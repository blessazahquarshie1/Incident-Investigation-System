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

export function getEntityLabel(data: InvestigationData, id: string): string {
  if (id.startsWith('P-')) return getPersonName(data, id)
  if (id.startsWith('L-')) return getLocationName(data, id)
  if (id.startsWith('V-')) {
    const v = data.vehicles.find(veh => veh.id === id)
    return v ? `${v.registration} (${v.make} ${v.model})` : id
  }
  if (id.startsWith('I-')) {
    const inc = data.incidents.find(i => i.id === id)
    return inc ? inc.title : id
  }
  if (id.startsWith('E-')) {
    const ev = data.evidence.find(e => e.id === id)
    return ev ? ev.title : id
  }
  return id
}
