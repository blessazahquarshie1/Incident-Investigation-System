import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mockData } from '../data'
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
import { getOfficerName, getPersonName, getLocationName, getEntityLabel, getVehicleOwner } from '../lib/lookup'
import { findExistingLocation } from '../lib/validation'
import { getCasePeople, getCaseIncidents, getCaseEvidence } from '../lib/caseScope'
import { getConnectionSnapshot, diffSnapshots } from '../lib/connectionDiff'

export interface ToastNotification {
  id: string
  caseId?: string
  title: string
  changes: string[]
  timestamp: number
}

interface InvestigationStore {
  data: InvestigationData
  currentOfficerId: string
  toast: ToastNotification | null
  lastDiff: string[]
  showToast: (toast: { caseId?: string; title: string; changes: string[] }) => void
  dismissToast: () => void
  resetDemoData: () => void
  addActivity: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'officerId'>) => void
  createCase: (input: { title: string; description: string; type: Case['type']; priority: Case['priority']; leadInvestigator: string }) => Case
  changeCasePriority: (caseId: string, priority: Case['priority']) => void
  changeCaseStatus: (caseId: string, status: Case['status']) => void
  addPersonToCase: (caseId: string, personId: string) => string[]
  createPersonForCase: (caseId: string, input: { fullName: string; type: Person['type']; phone?: string; address?: string }) => string[]
  linkVehicleToPerson: (caseId: string, vehicleId: string, personId: string, relationship: 'owns' | 'connected-to') => string[]
  addEvidence: (caseId: string, input: { title: string; type: Evidence['type']; description: string; locationId?: string; linkedPersons: string[] }) => string[]
  addNote: (caseId: string, text: string) => void
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
  ) => Incident & { diff: string[] }
  addDocumentToCase: (
    caseId: string,
    input: { title: string; kind: CaseDocument['kind'] }
  ) => CaseDocument
  changeLeadInvestigator: (caseId: string, officerId: string) => void
  createLocation: (input: { name: string; city: string; region: string }) => Location
  addVisitedLocation: (caseId: string, locationId: string, personId: string) => string[]
  createVehicle: (
    caseId: string,
    input: { registration: string; make: string; model: string; color: string },
    connections?: Array<{ targetId: string; relationship: 'owns' | 'connected-to' | 'involved-in' }>
  ) => Vehicle & { diff: string[] }
  addConnection: (caseId: string, edge: InvestigationEdge) => string[]
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
  ) => WitnessStatement & { diff: string[] }
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
  ) => Sighting & { diff: string[] }
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
  ) => PhoneRecord & { diff: string[] }
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
        data: mockData,
        currentOfficerId: 'O-001',
        toast: null,
        lastDiff: [],

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
          set({ data: mockData, toast: null, lastDiff: [] })
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.removeItem('iis-investigation-data-v1')
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

        createCase: (input) => {
          const state = get()
          const maxNum = state.data.cases.reduce((max, c) => {
            const num = parseInt(c.id.replace('CASE-', ''))
            return num > max ? num : max
          }, 0)
          const id = `CASE-${String(maxNum + 1).padStart(5, '0')}`
          const now = new Date().toISOString()

          const newCase: Case = {
            ...input,
            id,
            status: 'open',
            createdAt: now,
            updatedAt: now,
          }

          set((s) => ({ data: { ...s.data, cases: [...s.data.cases, newCase] } }))
          get().addActivity({ caseId: id, action: 'case-created', description: `Case ${id} created: ${input.title}` })
          return newCase
        },

        changeCasePriority: (caseId, priority) => {
          const state = get()
          const oldCase = state.data.cases.find(c => c.id === caseId)
          if (!oldCase) return

          const oldPriority = oldCase.priority
          set((s) => ({
            data: {
              ...s.data,
              cases: s.data.cases.map(c => c.id === caseId ? { ...c, priority, updatedAt: new Date().toISOString() } : c),
            },
          }))

          get().addActivity({ caseId, action: 'priority-changed', description: `Case priority changed: ${oldPriority.toUpperCase()} → ${priority.toUpperCase()}` })
        },

        changeCaseStatus: (caseId, status) => {
          const state = get()
          const oldCase = state.data.cases.find(c => c.id === caseId)
          if (!oldCase) return

          const oldStatus = oldCase.status
          set((s) => ({
            data: {
              ...s.data,
              cases: s.data.cases.map(c => c.id === caseId ? { ...c, status, updatedAt: new Date().toISOString() } : c),
            },
          }))

          get().addActivity({ caseId, action: 'status-changed', description: `Case status changed: ${oldStatus.toUpperCase()} → ${status.toUpperCase()}` })
        },

        addPersonToCase: (caseId, personId) => {
          return runWithCaseDiff(caseId, () => {
            const state = get()
            const person = state.data.persons.find(p => p.id === personId)
            if (!person) return

            set((s) => ({
              data: {
                ...s.data,
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: new Date().toISOString() } : c),
                persons: s.data.persons.map(p => p.id === personId ? { ...p, relatedCases: Array.from(new Set([...p.relatedCases, caseId])) } : p),
              },
            }))

            get().addActivity({ caseId, action: 'person-added', description: `Added ${person.fullName} to the case` })
          }).diff
        },

        createPersonForCase: (caseId, input) => {
          return runWithCaseDiff(caseId, () => {
            const state = get()
            const existingIds = state.data.persons.map(p => p.id)
            const id = nextId('P', existingIds)

            const newPerson: Person = {
              ...input,
              id,
              knownAliases: [],
              relatedCases: [caseId],
            }

            set((s) => ({
              data: {
                ...s.data,
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: new Date().toISOString() } : c),
                persons: [...s.data.persons, newPerson],
              },
            }))

            get().addActivity({ caseId, action: 'person-added', description: `Added ${input.fullName} to the case` })
          }).diff
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

        addNote: (caseId, text) => {
          const state = get()
          const existingIds = state.data.notes.map(n => n.id)
          const id = nextId('N', existingIds)

          const newNote: Note = {
            id,
            caseId,
            authorId: state.currentOfficerId,
            text,
            createdAt: new Date().toISOString(),
          }

          set((s) => ({
            data: {
              ...s.data,
              notes: [...s.data.notes, newNote],
              cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: new Date().toISOString() } : c),
            },
          }))

          get().addActivity({ caseId, action: 'note-added', description: 'Note added' })
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

        addIncidentToCase: (caseId, input) => {
          const { result } = runWithCaseDiff(caseId, () => {
            const state = get()
            const id = nextId('I', state.data.incidents.map(i => i.id))
            const now = new Date().toISOString()
            const newIncident: Incident = { ...input, id, caseId }
            set((s) => ({
              data: {
                ...s.data,
                incidents: [...s.data.incidents, newIncident],
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))
            get().addActivity({ caseId, action: 'incident-added', description: `Incident ${id} added: ${input.title}` })
            return newIncident
          })
          return Object.assign(result, { diff: get().lastDiff })
        },

        addDocumentToCase: (caseId, input) => {
          const state = get()
          const id = nextId('D', state.data.documents.map(d => d.id))
          const now = new Date().toISOString()
          const newDoc: CaseDocument = {
            ...input,
            id,
            caseId,
            uploadedAt: now,
            uploadedBy: state.currentOfficerId,
          }
          set((s) => ({
            data: {
              ...s.data,
              documents: [...s.data.documents, newDoc],
              cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
            },
          }))
          get().addActivity({ caseId, action: 'document-added', description: `Document "${input.title}" added` })
          return newDoc
        },

        changeLeadInvestigator: (caseId, officerId) => {
          const state = get()
          const targetCase = state.data.cases.find(c => c.id === caseId)
          if (!targetCase) return
          const oldOfficerName = getOfficerName(state.data, targetCase.leadInvestigator)
          const newOfficerName = getOfficerName(state.data, officerId)
          const now = new Date().toISOString()
          set((s) => ({
            data: {
              ...s.data,
              cases: s.data.cases.map(c => c.id === caseId ? { ...c, leadInvestigator: officerId, updatedAt: now } : c),
            },
          }))
          get().addActivity({
            caseId,
            action: 'lead-changed',
            description: `Lead investigator changed: ${oldOfficerName} → ${newOfficerName}`,
          })
        },

        createLocation: (input) => {
          const state = get()
          const existing = findExistingLocation(state.data, input.name, input.city)
          if (existing) {
            return existing
          }
          const id = nextId('L', state.data.locations.map(l => l.id))
          const newLoc: Location = { ...input, id }
          set((s) => ({
            data: {
              ...s.data,
              locations: [...s.data.locations, newLoc],
            },
          }))
          get().addActivity({
            caseId: '',
            action: 'location-added',
            description: `Location ${input.name} added`,
          })
          return newLoc
        },

        addVisitedLocation: (caseId, locationId, personId) => {
          return runWithCaseDiff(caseId, () => {
            const state = get()
            const exists = state.data.relationships.some(
              r => r.source === personId && r.target === locationId && r.relationship === 'visited'
            )
            const now = new Date().toISOString()
            const personName = getPersonName(state.data, personId)
            const locationName = getLocationName(state.data, locationId)

            if (!exists) {
              const edge: InvestigationEdge = { source: personId, target: locationId, relationship: 'visited' }
              set((s) => ({
                data: {
                  ...s.data,
                  relationships: [...s.data.relationships, edge],
                  cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
                },
              }))
            }
            get().addActivity({
              caseId,
              action: 'location-added',
              description: `${personName} linked to ${locationName}: visited`,
            })
          }).diff
        },

        createVehicle: (caseId, input, connections = []) => {
          const { result } = runWithCaseDiff(caseId, () => {
            const state = get()
            const id = nextId('V', state.data.vehicles.map(v => v.id))
            const now = new Date().toISOString()
            const ownerConn = connections.find(c => c.relationship === 'owns')
            const ownerId = ownerConn ? ownerConn.targetId : undefined
            const newVehicle: Vehicle = { ...input, id, ownerId }

            const newEdges: InvestigationEdge[] = connections.map(conn => {
              if (conn.relationship === 'involved-in') {
                return { source: id, target: conn.targetId, relationship: 'involved-in' }
              }
              return { source: conn.targetId, target: id, relationship: conn.relationship }
            })

            const uniqueNewEdges = newEdges.filter(
              ne => !state.data.relationships.some(r => r.source === ne.source && r.target === ne.target && r.relationship === ne.relationship)
            )

            set((s) => ({
              data: {
                ...s.data,
                vehicles: [...s.data.vehicles, newVehicle],
                relationships: [...s.data.relationships, ...uniqueNewEdges],
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))

            get().addActivity({
              caseId,
              action: 'vehicle-added',
              description: `Vehicle ${input.registration} added`,
            })
            return newVehicle
          })
          return Object.assign(result, { diff: get().lastDiff })
        },

        addConnection: (caseId, edge) => {
          return runWithCaseDiff(caseId, () => {
            const state = get()
            let relationships = [...state.data.relationships]
            let vehicles = [...state.data.vehicles]

            if (edge.relationship === 'owns') {
              const vehicleId = edge.target.startsWith('V-') ? edge.target : edge.source
              const personId = edge.target.startsWith('V-') ? edge.source : edge.target
              const vehicle = state.data.vehicles.find(v => v.id === vehicleId)
              const person = state.data.persons.find(p => p.id === personId)

              if (vehicle && person) {
                const currentOwner = getVehicleOwner(state.data, vehicleId)
                if (currentOwner && currentOwner.id !== personId) {
                  // Owner conflict rule: demote previous owner to connected-to
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
                }

                // Keep Vehicle.ownerId in sync
                vehicles = vehicles.map(v => v.id === vehicleId ? { ...v, ownerId: personId } : v)
              }
            }

            const exists = relationships.some(
              r => r.source === edge.source && r.target === edge.target && r.relationship === edge.relationship
            )
            if (!exists) {
              relationships.push(edge)
            }

            const now = new Date().toISOString()
            const sourceLabel = getEntityLabel(state.data, edge.source)
            const targetLabel = getEntityLabel(state.data, edge.target)

            set((s) => ({
              data: {
                ...s.data,
                vehicles,
                relationships,
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))

            get().addActivity({
              caseId,
              action: 'link-added',
              description: `${sourceLabel} linked to ${targetLabel}: ${edge.relationship}`,
            })
          }).diff
        },

        addWitnessStatement: (caseId, input) => {
          const { result } = runWithCaseDiff(caseId, () => {
            const state = get()
            const id = nextId('WS', state.data.witnessStatements.map(ws => ws.id))
            const now = new Date().toISOString()
            const newWs: WitnessStatement = { ...input, id, caseId }
            set((s) => ({
              data: {
                ...s.data,
                witnessStatements: [...s.data.witnessStatements, newWs],
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))
            get().addActivity({
              caseId,
              action: 'timeline-record-added',
              description: `Witness statement ${id} recorded`,
            })
            return newWs
          })
          return Object.assign(result, { diff: get().lastDiff })
        },

        addSighting: (caseId, input) => {
          const { result } = runWithCaseDiff(caseId, () => {
            const state = get()
            const id = nextId('SG', state.data.sightings.map(s => s.id))
            const now = new Date().toISOString()
            const newSg: Sighting = { ...input, id, caseId }
            set((s) => ({
              data: {
                ...s.data,
                sightings: [...s.data.sightings, newSg],
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))
            get().addActivity({
              caseId,
              action: 'timeline-record-added',
              description: `Sighting ${id} recorded`,
            })
            return newSg
          })
          return Object.assign(result, { diff: get().lastDiff })
        },

        addPhoneRecord: (caseId, input) => {
          const { result } = runWithCaseDiff(caseId, () => {
            const state = get()
            const id = nextId('PR', state.data.phoneRecords.map(pr => pr.id))
            const now = new Date().toISOString()
            const newPr: PhoneRecord = { ...input, id, caseId }
            set((s) => ({
              data: {
                ...s.data,
                phoneRecords: [...s.data.phoneRecords, newPr],
                cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c),
              },
            }))
            get().addActivity({
              caseId,
              action: 'timeline-record-added',
              description: `Phone record ${id} recorded`,
            })
            return newPr
          })
          return Object.assign(result, { diff: get().lastDiff })
        },

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
      name: 'iis-investigation-data-v1',
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ data: state.data }),
    }
  )
)
