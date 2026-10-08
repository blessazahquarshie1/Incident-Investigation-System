import type { InvestigationData } from '../types'
export function getOfficerName(data: InvestigationData, id: string): string {
  return data.officers.find(o => o.id === id)?.fullName ?? id
}
export function getLocationName(data: InvestigationData, id: string): string {
  return data.locations.find(l => l.id === id)?.name ?? id
}
export function getPersonName(data: InvestigationData, id: string): string {
  return data.persons.find(p => p.id === id)?.fullName ?? id
}
