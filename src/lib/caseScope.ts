import type { InvestigationData, Person, Evidence, Incident, Vehicle, Location, CaseDocument, Note, ActivityLogEntry } from '../types'
import { buildGraph, getNeighbors } from './graph'

export function getCasePeople(data: InvestigationData, caseId: string): Person[] {
  return data.persons.filter(p => p.relatedCases.includes(caseId))
}

export function getCaseEvidence(data: InvestigationData, caseId: string): Evidence[] {
  return data.evidence.filter(e => e.caseId === caseId)
}

export function getCaseIncidents(data: InvestigationData, caseId: string): Incident[] {
  return data.incidents.filter(i => i.caseId === caseId)
}

export function getCaseDocuments(data: InvestigationData, caseId: string): CaseDocument[] {
  return data.documents.filter(d => d.caseId === caseId)
}

export function getCaseNotes(data: InvestigationData, caseId: string): Note[] {
  return data.notes.filter(n => n.caseId === caseId)
}

export function getCaseVehicles(data: InvestigationData, caseId: string): Vehicle[] {
  const graph = buildGraph(data)
  const vehicleIds = new Set<string>()
  getCasePeople(data, caseId).forEach(p =>
    getNeighbors(graph, p.id).filter(id => id.startsWith('V-')).forEach(id => vehicleIds.add(id))
  )
  getCaseIncidents(data, caseId).forEach(inc =>
    getNeighbors(graph, inc.id).filter(id => id.startsWith('V-')).forEach(id => vehicleIds.add(id))
  )
  data.sightings.filter(s => s.caseId === caseId && s.vehicleId).forEach(s => vehicleIds.add(s.vehicleId!))
  return data.vehicles.filter(v => vehicleIds.has(v.id))
}

export function getCaseLocations(data: InvestigationData, caseId: string): Location[] {
  const locationIds = new Set<string>()
  getCaseIncidents(data, caseId).forEach(i => locationIds.add(i.locationId))
  getCaseEvidence(data, caseId).forEach(e => { if (e.locationId) locationIds.add(e.locationId) })
  const graph = buildGraph(data)
  getCasePeople(data, caseId).forEach(p =>
    getNeighbors(graph, p.id).filter(id => id.startsWith('L-')).forEach(id => locationIds.add(id))
  )
  data.sightings.filter(s => s.caseId === caseId).forEach(s => locationIds.add(s.locationId))
  return data.locations.filter(l => locationIds.has(l.id))
}

export function getCaseActivity(data: InvestigationData, caseId: string): ActivityLogEntry[] {
  return [...data.activityLog]
    .filter(a => a.caseId === caseId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
