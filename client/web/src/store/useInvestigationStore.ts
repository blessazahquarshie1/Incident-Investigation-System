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
import { nextId } from '../lib/ids'
import { applyCustodyAction } from '../lib/custody'
import { getOfficerName, getVehicleOwner } from '../lib/lookup'
import { getCasePeople, getCaseIncidents, getCaseEvidence } from '../lib/caseScope'
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
  linkVehicleToPerson: (caseId: string, vehicleId: string, personId: string, relationship: 'owns' | 'connected-to') => string[]
  addEvidence: (caseId: string, input: { title: string; type: Evidence['type']; description: string; locationId?: string; linkedPersons: string[] }) => string[]
  addNote: (caseId: string, text: string) => Promise<void>
  applyEvidenceCustodyAction: (
    evidenceId: string,
    action: CustodyAction,
    options?: { toOfficerId?: string; note?: string }
  ) => { ok: true } | { ok: false; reason: string }
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
  removePersonFromCase: (caseId: string, personId: string) => string[]
  removeVehicleFromCase: (caseId: string, vehicleId: string) => string[]
  removeLocationFromCase: (caseId: string, locationId: string) => string[]
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
  ) => string[]
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

      // Helper to wrap mutations with before & after connection snapshots
      function runWithCaseDiff<T>(
        caseId: string | undefined,
        action: () => T
      ): { result: T; diff: string[] } {
        if (!caseId) {
          const result = action()
          return { result, diff: [] }
        }

        const before = getConnectionSnapshot(get().data, caseId)
        const result = action()
        const after = getConnectionSnapshot(get().data, caseId)
        const diff = diffSnapshots(before, after)

        if (diff.length > 0) {
          get().showToast({
            caseId,
            title: 'Saved. New connections found:',
            changes: diff.slice(0, 3),
          })
        } else {
          get().showToast({
            caseId,
            title: 'Saved. No new connections found.',
            changes: [],
          })
        }

        set({ lastDiff: diff })
        return { result, diff }
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

        linkVehicleToPerson: (caseId, vehicleId, personId, relationship) => {
          return runWithCaseDiff(caseId, () => {
            const state = get()
            const person = state.data.persons.find(p => p.id === personId)
            const vehicle = state.data.vehicles.find(v => v.id === vehicleId)
            if (!person || !vehicle) return

            let relationships = [...state.data.relationships]
            let vehicles = [...state.data.vehicles]

            if (relationship === 'owns') {
              const currentOwner = getVehicleOwner(state.data, vehicleId)
              if (currentOwner && currentOwner.id !== personId) {
                // Owner conflict rule: demote previous owner's 'owns' link to 'connected-to'
                relationships = relationships.map(r => {
                  const isOldOwnerEdge =
                    r.relationship === 'owns' &&
                    ((r.source === currentOwner.id && r.target === vehicleId) ||
                     (r.source === vehicleId && r.target === currentOwner.id))
                  return isOldOwnerEdge ? { ...r, relationship: 'connected-to' as const } : r
                })

                const hasOldEdge = relationships.some(
                  r => (r.source === currentOwner.id && r.target === vehicleId) ||
                       (r.source === vehicleId && r.target === currentOwner.id)
                )
                if (!hasOldEdge) {
                  relationships.push({ source: currentOwner.id, target: vehicleId, relationship: 'connected-to' })
                }

                get().addActivity({
                  caseId,
                  action: 'vehicle-linked',
                  description: `${vehicle.registration} owner changed from ${currentOwner.fullName} to ${person.fullName}; ${currentOwner.fullName} is now connected to the vehicle.`,
                })
              } else {
                get().addActivity({
                  caseId,
                  action: 'vehicle-linked',
                  description: `Vehicle ${vehicle.registration} linked to ${person.fullName} as owner`,
                })
              }

              // Keep Vehicle.ownerId in sync
              vehicles = vehicles.map(v => v.id === vehicleId ? { ...v, ownerId: personId } : v)
            } else {
              get().addActivity({
                caseId,
                action: 'vehicle-linked',
                description: `Vehicle ${vehicle.registration} linked to ${person.fullName} as ${relationship}`,
              })
            }

            const newEdge: InvestigationEdge = {
              source: personId,
              target: vehicleId,
              relationship,
            }
            const exists = relationships.some(
              r => r.source === personId && r.target === vehicleId && r.relationship === relationship
            )
            if (!exists) {
              relationships.push(newEdge)
            }

            set((s) => ({
              data: {
                ...s.data,
                vehicles,
                relationships,
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: new Date().toISOString() } : c),
              },
            }))
          }).diff
        },

        addEvidence: (caseId, input) => {
          return runWithCaseDiff(caseId, () => {
            const state = get()
            const existingIds = state.data.evidence.map(e => e.id)
            const id = nextId('E', existingIds)
            const now = new Date().toISOString()
            const officerId = state.currentOfficerId

            const newEvidence: Evidence = {
              ...input,
              id,
              caseId,
              status: 'collected',
              collectedAt: now,
              collectedBy: officerId,
              custodyHistory: [{ id: `CE-${id}-1`, action: 'collected', timestamp: now, officerId }],
            }

            set((s) => ({
              data: {
                ...s.data,
                evidence: [...s.data.evidence, newEvidence],
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))

            get().addActivity({ caseId, action: 'evidence-uploaded', description: `Evidence ${id} uploaded: ${input.title}` })
          }).diff
        },

        addNote: async (caseId, text) => {
          const r = await send<ServerResult>('POST', casePath(caseId, 'notes'), { text })
          if (r) applyServerResult(r)
        },

        applyEvidenceCustodyAction: (evidenceId, action, options) => {
          const state = get()
          const evidence = state.data.evidence.find(e => e.id === evidenceId)
          if (!evidence) {
            return { ok: false, reason: `Evidence with ID ${evidenceId} not found.` }
          }

          const now = new Date().toISOString()
          const officerId = state.currentOfficerId

          const result = applyCustodyAction(evidence, action, {
            timestamp: now,
            officerId,
            toOfficerId: options?.toOfficerId,
            note: options?.note,
          })

          if (!result.ok) {
            return { ok: false, reason: result.reason }
          }

          const updatedEvidence = result.evidence

          set((s) => ({
            data: {
              ...s.data,
              evidence: s.data.evidence.map(e => e.id === evidenceId ? updatedEvidence : e),
              cases: s.data.cases.map(c => c.id === evidence.caseId ? { ...c, updatedAt: now } : c),
            },
          }))

          const toName = options?.toOfficerId ? getOfficerName(state.data, options.toOfficerId) : ''
          const actionDesc = action === 'collected'
            ? `Evidence ${evidence.id} collected`
            : action === 'transferred'
              ? `Evidence ${evidence.id} transferred to ${toName || options?.toOfficerId}`
              : action === 'submitted-to-evidence-room'
                ? `Evidence ${evidence.id} submitted to evidence room`
                : action === 'analysis-started'
                  ? `Evidence ${evidence.id} analysis started`
                  : action === 'analysis-completed'
                    ? `Evidence ${evidence.id} analysis completed`
                    : action === 'released'
                      ? `Evidence ${evidence.id} released`
                      : `Evidence ${evidence.id} destroyed`

          get().addActivity({
            caseId: evidence.caseId,
            action: 'custody-action',
            description: actionDesc,
          })

          return { ok: true }
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

        removePersonFromCase: (caseId, personId) => {
          return runWithCaseDiff(caseId, () => {
            const state = get()
            const person = state.data.persons.find(p => p.id === personId)
            if (!person) return

            const now = new Date().toISOString()
            const caseIncidents = new Set(getCaseIncidents(state.data, caseId).map(i => i.id))
            const caseEvidence = new Set(getCaseEvidence(state.data, caseId).map(e => e.id))

            // 1. Remove caseId from person.relatedCases (keep person and other cases)
            const persons = state.data.persons.map(p =>
              p.id === personId ? { ...p, relatedCases: p.relatedCases.filter(c => c !== caseId) } : p
            )

            // 2. Remove relationships between this person and this case's incidents or evidence
            const relationships = state.data.relationships.filter(r => {
              if (r.source === personId && (caseIncidents.has(r.target) || caseEvidence.has(r.target))) return false
              if (r.target === personId && (caseIncidents.has(r.source) || caseEvidence.has(r.source))) return false
              return true
            })

            // 3. Remove person from linkedPersons on this case's evidence
            const evidence = state.data.evidence.map(e =>
              e.caseId === caseId && e.linkedPersons.includes(personId)
                ? { ...e, linkedPersons: e.linkedPersons.filter(id => id !== personId) }
                : e
            )

            set((s) => ({
              data: {
                ...s.data,
                persons,
                relationships,
                evidence,
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))

            get().addActivity({
              caseId,
              action: 'status-changed',
              description: `Removed person ${person.fullName} from case`,
            })
          }).diff
        },

        removeVehicleFromCase: (caseId, vehicleId) => {
          return runWithCaseDiff(caseId, () => {
            const state = get()
            const vehicle = state.data.vehicles.find(v => v.id === vehicleId)
            if (!vehicle) return

            const now = new Date().toISOString()
            const casePeople = getCasePeople(state.data, caseId)
            const casePeopleIds = new Set(casePeople.map(p => p.id))
            const caseIncidents = getCaseIncidents(state.data, caseId)
            const caseIncidentIds = new Set(caseIncidents.map(i => i.id))

            // 1. Remove relationships between this vehicle and this case's people or incidents
            const relationships = state.data.relationships.filter(r => {
              const isVehicleEndpoint = r.source === vehicleId || r.target === vehicleId
              if (!isVehicleEndpoint) return true
              const otherId = r.source === vehicleId ? r.target : r.source
              if (casePeopleIds.has(otherId) || caseIncidentIds.has(otherId)) return false
              return true
            })

            // 2. If vehicle.ownerId belongs to a person in this case, detach owner
            const vehicles = state.data.vehicles.map(v => {
              if (v.id === vehicleId && v.ownerId && casePeopleIds.has(v.ownerId)) {
                return { ...v, ownerId: undefined }
              }
              return v
            })

            // 3. Remove sightings for this vehicle in this case
            const sightings = state.data.sightings.filter(
              s => !(s.caseId === caseId && s.vehicleId === vehicleId)
            )

            set((s) => ({
              data: {
                ...s.data,
                vehicles,
                relationships,
                sightings,
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))

            get().addActivity({
              caseId,
              action: 'status-changed',
              description: `Removed vehicle ${vehicle.registration} from case`,
            })
          }).diff
        },

        removeLocationFromCase: (caseId, locationId) => {
          return runWithCaseDiff(caseId, () => {
            const state = get()
            const loc = state.data.locations.find(l => l.id === locationId)
            if (!loc) return

            const now = new Date().toISOString()
            const casePeople = getCasePeople(state.data, caseId)
            const casePeopleIds = new Set(casePeople.map(p => p.id))

            // 1. Remove visited relationships for case people to this location
            const relationships = state.data.relationships.filter(
              r => !(r.relationship === 'visited' && r.target === locationId && casePeopleIds.has(r.source))
            )

            // 2. Remove sightings for this location in this case
            const sightings = state.data.sightings.filter(
              s => !(s.caseId === caseId && s.locationId === locationId)
            )

            // 3. Clear locationId on this case's evidence
            const evidence = state.data.evidence.map(e =>
              e.caseId === caseId && e.locationId === locationId ? { ...e, locationId: undefined } : e
            )

            // 4. For incidents in this case at this location, fallback to another location if one exists
            const otherLoc = state.data.locations.find(l => l.id !== locationId)
            const incidents = state.data.incidents.map(i =>
              i.caseId === caseId && i.locationId === locationId
                ? { ...i, locationId: otherLoc ? otherLoc.id : '' }
                : i
            )

            set((s) => ({
              data: {
                ...s.data,
                relationships,
                sightings,
                evidence,
                incidents,
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))

            get().addActivity({
              caseId,
              action: 'status-changed',
              description: `Removed location ${loc.name} from case`,
            })
          }).diff
        },

        updatePerson: (personId, input, caseId) => {
          const state = get()
          const existing = state.data.persons.find(p => p.id === personId)
          if (!existing) return []

          const targetCaseId = caseId ?? existing.relatedCases[0]

          return runWithCaseDiff(targetCaseId, () => {
            const updatedPerson: Person = {
              ...existing,
              fullName: input.fullName.trim(),
              type: input.type,
              phone: input.phone?.trim() || undefined,
              address: input.address?.trim() || undefined,
              knownAliases: input.knownAliases?.map(a => a.trim()).filter(Boolean) || undefined,
            }

            set((s) => ({
              data: {
                ...s.data,
                persons: s.data.persons.map(p => p.id === personId ? updatedPerson : p),
              },
            }))

            for (const cid of existing.relatedCases) {
              get().addActivity({
                caseId: cid,
                action: 'status-changed',
                description: `Updated details for ${input.fullName}`,
              })
            }
          }).diff
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
