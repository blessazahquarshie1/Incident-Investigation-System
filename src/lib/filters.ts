import type { Case, Person, Evidence, Incident, Vehicle, Location, Officer } from '../types'

// ─── Cases ───────────────────────────────────────────────────────────────────

export interface CaseFilters {
  text?: string
  type?: string
  priority?: string
  status?: string
  leadInvestigator?: string
}

export function filterCases(cases: Case[], f: CaseFilters): Case[] {
  return cases.filter(c => {
    if (f.text) {
      const q = f.text.toLowerCase()
      if (!c.title.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false
    }
    if (f.type && f.type !== '' && c.type !== f.type) return false
    if (f.priority && f.priority !== '' && c.priority !== f.priority) return false
    if (f.status && f.status !== '' && c.status !== f.status) return false
    if (f.leadInvestigator && f.leadInvestigator !== '' && c.leadInvestigator !== f.leadInvestigator) return false
    return true
  })
}

// ─── Persons ─────────────────────────────────────────────────────────────────

export interface PersonFilters { text?: string; type?: string }

export function filterPersons(persons: Person[], f: PersonFilters): Person[] {
  return persons.filter(p => {
    if (f.text) {
      const q = f.text.toLowerCase()
      const inName = p.fullName.toLowerCase().includes(q)
      const inPhone = p.phone?.toLowerCase().includes(q) ?? false
      const inAddress = p.address?.toLowerCase().includes(q) ?? false
      const inAlias = p.knownAliases?.some(a => a.toLowerCase().includes(q)) ?? false
      if (!inName && !inPhone && !inAddress && !inAlias) return false
    }
    if (f.type && f.type !== '' && p.type !== f.type) return false
    return true
  })
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export interface EvidenceFilters { text?: string; type?: string; status?: string; caseId?: string }

export function filterEvidence(evidence: Evidence[], f: EvidenceFilters): Evidence[] {
  return evidence.filter(e => {
    if (f.text) {
      const q = f.text.toLowerCase()
      if (!e.id.toLowerCase().includes(q) && !e.title.toLowerCase().includes(q) && !e.description.toLowerCase().includes(q)) return false
    }
    if (f.type && f.type !== '' && e.type !== f.type) return false
    if (f.status && f.status !== '' && e.status !== f.status) return false
    if (f.caseId && f.caseId !== '' && e.caseId !== f.caseId) return false
    return true
  })
}

// ─── Incidents ───────────────────────────────────────────────────────────────

export interface IncidentFilters { text?: string; status?: string; type?: string; caseId?: string }

export function filterIncidents(incidents: Incident[], f: IncidentFilters): Incident[] {
  return incidents.filter(i => {
    if (f.text) {
      const q = f.text.toLowerCase()
      if (!i.id.toLowerCase().includes(q) && !i.title.toLowerCase().includes(q)) return false
    }
    if (f.status && f.status !== '' && i.status !== f.status) return false
    if (f.type && f.type !== '' && i.type !== f.type) return false
    if (f.caseId && f.caseId !== '' && i.caseId !== f.caseId) return false
    return true
  })
}

// ─── Vehicles ────────────────────────────────────────────────────────────────

export interface VehicleFilters { text?: string }

export function filterVehicles(vehicles: Vehicle[], f: VehicleFilters): Vehicle[] {
  return vehicles.filter(v => {
    if (f.text) {
      const q = f.text.toLowerCase()
      const norm = (s: string) => s.toLowerCase().replace(/[\s-]/g, '')
      if (!norm(v.registration).includes(norm(q)) && !v.make.toLowerCase().includes(q) && !v.model.toLowerCase().includes(q)) return false
    }
    return true
  })
}

// ─── Locations ────────────────────────────────────────────────────────────────

export interface LocationFilters { text?: string; city?: string }

export function filterLocations(locations: Location[], f: LocationFilters): Location[] {
  return locations.filter(l => {
    if (f.text) {
      const q = f.text.toLowerCase()
      if (!l.name.toLowerCase().includes(q) && !l.city.toLowerCase().includes(q)) return false
    }
    if (f.city && f.city !== '' && l.city.toLowerCase() !== f.city.toLowerCase()) return false
    return true
  })
}

// ─── Officers ────────────────────────────────────────────────────────────────

export interface OfficerFilters { text?: string; rank?: string }

export function filterOfficers(officers: Officer[], f: OfficerFilters): Officer[] {
  return officers.filter(o => {
    if (f.text) {
      const q = f.text.toLowerCase()
      if (!o.fullName.toLowerCase().includes(q) && !o.badgeNumber.toLowerCase().includes(q)) return false
    }
    if (f.rank && f.rank !== '' && o.rank !== f.rank) return false
    return true
  })
}

