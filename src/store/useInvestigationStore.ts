import { create } from 'zustand'
import { mockData } from '../data'
import type { InvestigationData, ActivityLogEntry, Case, Person, Evidence, Note, InvestigationEdge } from '../types'
import { nextId } from '../lib/ids'

interface InvestigationStore {
  data: InvestigationData
  currentOfficerId: string
  addActivity: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'officerId'>) => void
  createCase: (input: { title: string; description: string; type: Case['type']; priority: Case['priority']; leadInvestigator: string }) => void
  changeCasePriority: (caseId: string, priority: Case['priority']) => void
  changeCaseStatus: (caseId: string, status: Case['status']) => void
  addPersonToCase: (caseId: string, personId: string) => void
  createPersonForCase: (caseId: string, input: { fullName: string; type: Person['type']; phone?: string; address?: string }) => void
  linkVehicleToPerson: (caseId: string, vehicleId: string, personId: string, relationship: 'owns' | 'connected-to') => void
  addEvidence: (caseId: string, input: { title: string; type: Evidence['type']; description: string; locationId?: string; linkedPersons: string[] }) => void
  addNote: (caseId: string, text: string) => void
}

export const useInvestigationStore = create<InvestigationStore>((set, get) => ({
  data: mockData,
  currentOfficerId: 'O-001',
  
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
      updatedAt: now
    }
    
    set((s) => ({ data: { ...s.data, cases: [...s.data.cases, newCase] } }))
    get().addActivity({ caseId: id, action: 'case-created', description: `Case ${id} created: ${input.title}` })
  },

  changeCasePriority: (caseId, priority) => {
    const state = get()
    const oldCase = state.data.cases.find(c => c.id === caseId)
    if (!oldCase) return
    
    const oldPriority = oldCase.priority
    set((s) => ({
      data: {
        ...s.data,
        cases: s.data.cases.map(c => c.id === caseId ? { ...c, priority, updatedAt: new Date().toISOString() } : c)
      }
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
        cases: s.data.cases.map(c => c.id === caseId ? { ...c, status, updatedAt: new Date().toISOString() } : c)
      }
    }))
    
    get().addActivity({ caseId, action: 'status-changed', description: `Case status changed: ${oldStatus.toUpperCase()} → ${status.toUpperCase()}` })
  },

  addPersonToCase: (caseId, personId) => {
    const state = get()
    const person = state.data.persons.find(p => p.id === personId)
    if (!person) return
    
    set((s) => ({
      data: {
        ...s.data,
        cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: new Date().toISOString() } : c),
        persons: s.data.persons.map(p => p.id === personId ? { ...p, relatedCases: Array.from(new Set([...p.relatedCases, caseId])) } : p)
      }
    }))
    
    get().addActivity({ caseId, action: 'person-added', description: `Added ${person.fullName} to the case` })
  },

  createPersonForCase: (caseId, input) => {
    const state = get()
    const existingIds = state.data.persons.map(p => p.id)
    const id = nextId('P', existingIds)
    
    const newPerson: Person = {
      ...input,
      id,
      knownAliases: [],
      relatedCases: [caseId]
    }
    
    set((s) => ({
      data: {
        ...s.data,
        cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: new Date().toISOString() } : c),
        persons: [...s.data.persons, newPerson]
      }
    }))
    
    get().addActivity({ caseId, action: 'person-added', description: `Added ${input.fullName} to the case` })
  },

  linkVehicleToPerson: (caseId, vehicleId, personId, relationship) => {
    const state = get()
    const person = state.data.persons.find(p => p.id === personId)
    const vehicle = state.data.vehicles.find(v => v.id === vehicleId)
    if (!person || !vehicle) return

    const newEdge: InvestigationEdge = {
      source: personId,
      target: vehicleId,
      relationship
    }

    set((s) => ({
      data: {
        ...s.data,
        relationships: [...s.data.relationships, newEdge]
      }
    }))

    get().addActivity({ caseId, action: 'vehicle-linked', description: `Vehicle ${vehicle.registration} linked to ${person.fullName}` })
  },

  addEvidence: (caseId, input) => {
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
      custodyHistory: [{ id: `CE-${id}-1`, action: 'collected', timestamp: now, officerId }]
    }
    
    set((s) => ({
      data: {
        ...s.data,
        evidence: [...s.data.evidence, newEvidence],
        cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: now } : c)
      }
    }))
    
    get().addActivity({ caseId, action: 'evidence-uploaded', description: `Evidence ${id} uploaded: ${input.title}` })
  },

  addNote: (caseId, text) => {
    const state = get()
    const existingIds = state.data.notes.map(n => n.id)
    const id = nextId('N', existingIds)
    
    const newNote: Note = {
      id,
      caseId,
      authorId: state.currentOfficerId,
      text, // Changed from content to text
      createdAt: new Date().toISOString()
    }
    
    set((s) => ({
      data: {
        ...s.data,
        notes: [...s.data.notes, newNote],
        cases: s.data.cases.map(c => c.id === caseId ? { ...c, updatedAt: new Date().toISOString() } : c)
      }
    }))
    
    get().addActivity({ caseId, action: 'note-added', description: 'Note added' })
  }
}))
