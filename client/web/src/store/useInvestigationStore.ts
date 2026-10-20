import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { apiGet, apiSend } from '../lib/api'
import type {
  InvestigationData,
  ActivityLogEntry,
  Case,
  Person,
  Evidence,
  Note,
  InvestigationEdge,
  CustodyAction,
  Incident,
  Location,
  Vehicle,
  CaseDocument,
  WitnessStatement,
  Sighting,
  PhoneRecord,
} from '../types'
import { getConnectionSnapshot, diffSnapshots } from '../lib/connectionDiff'

const emptyData: InvestigationData = {
  cases: [],
  persons: [],
  incidents: [],
  evidence: [],
  vehicles: [],
  locations: [],
  officers: [],
  documents: [],
  notes: [],
  witnessStatements: [],
  sightings: [],
  phoneRecords: [],
  activityLog: [],
  relationships: [],
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item]
}

interface MutationResult {
  id: string | null
  data: InvestigationData
}

interface ServerResult {
  case?: Case
  activity?: ActivityLogEntry
  note?: Note
  document?: CaseDocument
}

export interface ToastNotification {
  id: string
  caseId?: string
  title: string
  changes: string[]
  timestamp: number
}

interface InvestigationStore {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  load: () => Promise<void>
  data: InvestigationData
  currentOfficerId: string
  toast: ToastNotification | null
  lastDiff: string[]
  showToast: (toast: { caseId?: string; title: string; changes: string[] }) => void
  dismissToast: () => void
  resetDemoData: () => void
  addActivity: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'officerId'>) => void
  createCase: (input: { title: string; description: string; type: Case['type']; priority: Case['priority']; leadInvestigator: string }) => Promise<Case | null>
  changeCasePriority: (caseId: string, priority: Case['priority']) => Promise<void>
  changeCaseStatus: (caseId: string, status: Case['status']) => Promise<void>
  addPersonToCase: (caseId: string, personId: string) => Promise<string[] | null>
  createPersonForCase: (caseId: string, input: { fullName: string; type: Person['type']; phone?: string; address?: string }) => Promise<string[] | null>
  linkVehicleToPerson: (caseId: string, vehicleId: string, personId: string, relationship: 'owns' | 'connected-to') => Promise<string[] | null>
  addEvidence: (caseId: string, input: { title: string; type: Evidence['type']; description: string; locationId?: string; linkedPersons: string[] }) => Promise<string[] | null>
  addNote: (caseId: string, text: string) => Promise<void>
  applyEvidenceCustodyAction: (
    evidenceId: string,
    action: CustodyAction,
    options?: { toOfficerId?: string; note?: string }
  ) => Promise<{ ok: true } | { ok: false; reason: string }>
  addIncidentToCase: (
    caseId: string,
    input: {
      title: string
      description: string
      type: Incident['type']
      locationId: string
      occurredAt: string
      status: Incident['status']
    }
  ) => Promise<(Incident & { diff: string[] }) | null>
  addDocumentToCase: (
    caseId: string,
    input: { title: string; kind: CaseDocument['kind'] }
  ) => Promise<CaseDocument | null>
  changeLeadInvestigator: (caseId: string, officerId: string) => Promise<void>
  createLocation: (input: { name: string; city: string; region: string }) => Promise<Location | null>
  addVisitedLocation: (caseId: string, locationId: string, personId: string) => Promise<string[] | null>
  createVehicle: (
    caseId: string,
    input: { registration: string; make: string; model: string; color: string },
    connections?: Array<{ targetId: string; relationship: 'owns' | 'connected-to' | 'involved-in' }>
  ) => Promise<(Vehicle & { diff: string[] }) | null>
  addConnection: (caseId: string, edge: InvestigationEdge) => Promise<string[] | null>
  addWitnessStatement: (
    caseId: string,
    input: {
      witnessId: string
      subjectPersonId: string
      locationId: string
      claimedTime: string
      recordedAt: string
      text: string
    }
  ) => Promise<(WitnessStatement & { diff: string[] }) | null>
  addSighting: (
    caseId: string,
    input: {
      source: Sighting['source']
      action: Sighting['action']
      locationId: string
      timestamp: string
      vehicleId?: string
      personId?: string
      description: string
    }
  ) => Promise<(Sighting & { diff: string[] }) | null>
  addPhoneRecord: (
    caseId: string,
    input: {
      personId: string
      phoneNumber: string
      kind: PhoneRecord['kind']
      timestamp: string
      locationId?: string
      otherNumber?: string
    }
  ) => Promise<(PhoneRecord & { diff: string[] }) | null>
  removePersonFromCase: (caseId: string, personId: string) => Promise<string[] | null>
  removeVehicleFromCase: (caseId: string, vehicleId: string) => Promise<string[] | null>
  removeLocationFromCase: (caseId: string, locationId: string) => Promise<string[] | null>
  updatePerson: (
    personId: string,
    input: {
      fullName: string
      type: Person['type']
      phone?: string
      address?: string
      knownAliases?: string[]
    },
    caseId?: string
  ) => Promise<string[] | null>
}

const safeLocalStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('iis-investigation-data-v1')
        localStorage.removeItem('iis-investigation-data-v2')
        localStorage.removeItem('iis-investigation-data-v3')
        localStorage.removeItem('iis-investigation-data-v4')
      } catch {
        // ignore
      }
      return localStorage.getItem(name)
    }
    return null
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(name, value)
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(name)
    }
  },
}

export const useInvestigationStore = create<InvestigationStore>()(
  persist(
    (set, get) => {
      const casePath = (caseId: string, tail: string) => `/cases/${encodeURIComponent(caseId)}/${tail}`

      // Calls the API as the current officer. Shows a toast and returns null on failure.
      async function send<T>(
        method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
        path: string,
        body?: unknown,
      ): Promise<T | null> {
        try {
          return await apiSend<T>(method, path, get().currentOfficerId, body)
        } catch (e) {
          get().showToast({
            title: `Could not save: ${e instanceof Error ? e.message : 'unknown error'}`,
            changes: [],
          })
          return null
        }
      }

      // Merges what the server returned (updated case, new activity entry, new note) into local state.
      function applyServerResult(r: ServerResult) {
        const { case: updatedCase, activity, note, document } = r
        set((s) => ({
          data: {
            ...s.data,
            cases: updatedCase
              ? upsertById(s.data.cases, updatedCase)
              : s.data.cases,
            activityLog: activity ? [activity, ...s.data.activityLog] : s.data.activityLog,
            notes: note ? [...s.data.notes, note] : s.data.notes,
            documents: document ? [...s.data.documents, document] : s.data.documents,
          },
        }))
      }

            // Calls an endpoint that replies { id, data } and swaps in the fresh server snapshot.
      async function mutate(
        method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
        path: string,
        body?: unknown,
      ): Promise<MutationResult | null> {
        const r = await send<MutationResult>(method, path, body)
        if (r) set({ data: r.data })
        return r
      }

      // Like runWithCaseDiff, but the mutation is an API call. result is null if the call failed.
      async function runWithCaseDiffAsync(
        caseId: string,
        request: () => Promise<MutationResult | null>,
      ): Promise<{ result: MutationResult | null; diff: string[] }> {
        const before = getConnectionSnapshot(get().data, caseId)
        const result = await request()
        if (!result) return { result, diff: [] }
        const diff = diffSnapshots(before, getConnectionSnapshot(get().data, caseId))
        get().showToast({
          caseId,
          title: diff.length > 0 ? 'Saved. New connections found:' : 'Saved. No new connections found.',
          changes: diff.slice(0, 3),
        })
        set({ lastDiff: diff })
        return { result, diff }
      }

      // Creates a record inside a case and returns it (read from the fresh snapshot) plus the connection diff.
      async function createWithDiff<
        K extends 'incidents' | 'vehicles' | 'witnessStatements' | 'sightings' | 'phoneRecords',
      >(
        caseId: string,
        tail: string,
        key: K,
        body: unknown,
      ): Promise<(InvestigationData[K][number] & { diff: string[] }) | null> {
        const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
          mutate('POST', casePath(caseId, tail), body),
        )
        if (!result) return null
        const created = (get().data[key] as unknown as { id: string }[]).find((x) => x.id === result.id)
        return created ? ({ ...created, diff } as unknown as InvestigationData[K][number] & { diff: string[] }) : null
      }

      return {
        data: emptyData,
        status: 'idle',
        error: null,
        currentOfficerId: 'O-001',
        toast: null,
        lastDiff: [],

        load: async () => {
          if (get().status === 'loading') return
          set({ status: 'loading', error: null })
          try {
            const data = await apiGet<InvestigationData>('/investigation')
            set({ data, status: 'ready', error: null, toast: null, lastDiff: [] })
          } catch (e) {
            set({ status: 'error', error: e instanceof Error ? e.message : 'Failed to load data' })
          }
        },

        showToast: (t) => {
          set({
            toast: {
              ...t,
              id: `toast-${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
            },
          })
        },

        dismissToast: () => set({ toast: null }),

        resetDemoData: () => {
          void get().load()
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.removeItem('iis-investigation-data-v1')
              localStorage.removeItem('iis-investigation-data-v2')
              localStorage.removeItem('iis-investigation-data-v3')
              localStorage.removeItem('iis-investigation-data-v4')
            } catch {
              // ignore
            }
          }
        },

        addActivity: (entry) => {
          const state = get()
          const id = `A-${String(state.data.activityLog.length + 1).padStart(3, '0')}`
          const newEntry: ActivityLogEntry = {
            ...entry,
            id,
            timestamp: new Date().toISOString(),
            officerId: state.currentOfficerId,
          }
          set((s) => ({ data: { ...s.data, activityLog: [newEntry, ...s.data.activityLog] } }))
        },

        createCase: async (input) => {
          const r = await send<ServerResult>('POST', '/cases', input)
          if (!r?.case) return null
          applyServerResult(r)
          return r.case
        },

        changeCasePriority: async (caseId, priority) => {
          const r = await send<ServerResult>('PATCH', casePath(caseId, 'priority'), { priority })
          if (r) applyServerResult(r)
        },

        changeCaseStatus: async (caseId, status) => {
          const r = await send<ServerResult>('PATCH', casePath(caseId, 'status'), { status })
          if (r) applyServerResult(r)
        },

        addPersonToCase: async (caseId, personId) => {
          const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
            mutate('POST', casePath(caseId, 'persons/link'), { personId }),
          )
          return result ? diff : null
        },

        createPersonForCase: async (caseId, input) => {
          const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
            mutate('POST', casePath(caseId, 'persons'), input),
          )
          return result ? diff : null
        },

        linkVehicleToPerson: async (caseId, vehicleId, personId, relationship) => {
          const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
            mutate('POST', casePath(caseId, 'connections'), {
              source: personId,
              target: vehicleId,
              relationship,
            }),
          )
          return result ? diff : null
        },

        addEvidence: async (caseId, input) => {
          const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
            mutate('POST', casePath(caseId, 'evidence'), input),
          )
          return result ? diff : null
        },

        addNote: async (caseId, text) => {
          const r = await send<ServerResult>('POST', casePath(caseId, 'notes'), { text })
          if (r) applyServerResult(r)
        },

        applyEvidenceCustodyAction: async (evidenceId, action, options) => {
          try {
            const r = await apiSend<MutationResult>(
              'POST',
              `/evidence/${encodeURIComponent(evidenceId)}/custody`,
              get().currentOfficerId,
              { action, toOfficerId: options?.toOfficerId, note: options?.note },
            )
            set({ data: r.data })
            return { ok: true as const }
          } catch (e) {
            return {
              ok: false as const,
              reason: e instanceof Error ? e.message : 'Could not apply custody action.',
            }
          }
        },

        addIncidentToCase: (caseId, input) => createWithDiff(caseId, 'incidents', 'incidents', input),

        addDocumentToCase: async (caseId, input) => {
          const r = await send<ServerResult>('POST', casePath(caseId, 'documents'), input)
          if (!r) return null
          applyServerResult(r)
          return r.document ?? null
        },

        changeLeadInvestigator: async (caseId, officerId) => {
          const r = await send<ServerResult>('PATCH', casePath(caseId, 'lead-investigator'), { officerId })
          if (r) applyServerResult(r)
        },

        createLocation: async (input) => {
          const r = await mutate('POST', '/locations', input)
          return r ? (get().data.locations.find((l) => l.id === r.id) ?? null) : null
        },

        addVisitedLocation: async (caseId, locationId, personId) => {
          const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
            mutate('POST', casePath(caseId, 'visited-locations'), { locationId, personId }),
          )
          return result ? diff : null
        },

        createVehicle: (caseId, input, connections = []) =>
          createWithDiff(caseId, 'vehicles', 'vehicles', { ...input, connections }),

        addConnection: async (caseId, edge) => {
          const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
            mutate('POST', casePath(caseId, 'connections'), edge),
          )
          return result ? diff : null
        },

        addWitnessStatement: (caseId, input) =>
          createWithDiff(caseId, 'witness-statements', 'witnessStatements', input),

        addSighting: (caseId, input) => createWithDiff(caseId, 'sightings', 'sightings', input),

        addPhoneRecord: (caseId, input) => createWithDiff(caseId, 'phone-records', 'phoneRecords', input),

        removePersonFromCase: async (caseId, personId) => {
          const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
            mutate('DELETE', `${casePath(caseId, 'persons')}/${encodeURIComponent(personId)}`),
          )
          return result ? diff : null
        },

        removeVehicleFromCase: async (caseId, vehicleId) => {
          const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
            mutate('DELETE', `${casePath(caseId, 'vehicles')}/${encodeURIComponent(vehicleId)}`),
          )
          return result ? diff : null
        },

        removeLocationFromCase: async (caseId, locationId) => {
          const { result, diff } = await runWithCaseDiffAsync(caseId, () =>
            mutate('DELETE', `${casePath(caseId, 'locations')}/${encodeURIComponent(locationId)}`),
          )
          return result ? diff : null
        },

        updatePerson: async (personId, input, caseId) => {
          const existing = get().data.persons.find((p) => p.id === personId)
          if (!existing) return null
          const path = `/persons/${encodeURIComponent(personId)}`
          const targetCaseId = caseId ?? existing.relatedCases[0]
          if (!targetCaseId) {
            const r = await mutate('PATCH', path, input)
            return r ? [] : null
          }
          const { result, diff } = await runWithCaseDiffAsync(targetCaseId, () =>
            mutate('PATCH', path, input),
          )
          return result ? diff : null
        },
      }
    },
    {
      name: 'iis-investigation-data-v6',
      version: 6,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: () => ({}),

    }
  )
)
