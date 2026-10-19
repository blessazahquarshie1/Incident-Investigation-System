import type { InvestigationData, Case } from '../types'
import {
  getCasePeople,
  getCaseVehicles,
  getCaseLocations,
  getCaseEvidence,
  getCaseIncidents,
} from './caseScope'

/**
 * A case's fingerprint is the collection of observable traces it leaves behind:
 * people involved, vehicles identified, locations visited, phone numbers dialed or logged,
 * evidence tags noted, and incident timing.
 *
 * When two cases have overlapping fingerprints, investigators can link them together.
 */
export interface CaseFingerprint {
  caseId: string
  type: Case['type']
  personIds: string[] // Everyone linked to the case (relatedCases), any person type
  vehicleIds: string[] // From getCaseVehicles in caseScope.ts
  locationIds: string[] // From getCaseLocations in caseScope.ts
  phoneNumbers: string[] // Normalised (digits only): the people's phone + every phone record of the case
  evidenceTags: string[] // All tags of all the case's evidence items, lowercase
  incidentMinutesOfDay: number[] // For each incident, minutes since midnight (UTC)
}

/**
 * Normalises a phone number string by keeping only digits.
 */
export function normalisePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Extracts the analytical fingerprint of a case from the investigation data.
 */
export function getCaseFingerprint(
  data: InvestigationData,
  caseId: string
): CaseFingerprint {
  const kase = data.cases.find(c => c.id === caseId)
  const type: Case['type'] = kase?.type ?? 'other'

  const people = getCasePeople(data, caseId)
  const personIds = Array.from(new Set(people.map(p => p.id)))

  const vehicles = getCaseVehicles(data, caseId)
  const vehicleIds = Array.from(new Set(vehicles.map(v => v.id)))

  const locations = getCaseLocations(data, caseId)
  const locationIds = Array.from(new Set(locations.map(l => l.id)))

  // Phone numbers: digits only from people's profile phone + all case phone records
  const phoneSet = new Set<string>()
  for (const p of people) {
    if (p.phone) {
      const clean = normalisePhoneNumber(p.phone)
      if (clean) phoneSet.add(clean)
    }
  }
  for (const pr of data.phoneRecords) {
    if (pr.caseId === caseId && pr.phoneNumber) {
      const clean = normalisePhoneNumber(pr.phoneNumber)
      if (clean) phoneSet.add(clean)
    }
  }
  const phoneNumbers = Array.from(phoneSet)

  // Evidence tags: lowercase tags across all case evidence
  const tagSet = new Set<string>()
  const evidence = getCaseEvidence(data, caseId)
  for (const ev of evidence) {
    if (ev.tags) {
      for (const tag of ev.tags) {
        const clean = tag.trim().toLowerCase()
        if (clean) tagSet.add(clean)
      }
    }
  }
  const evidenceTags = Array.from(tagSet)

  // Incident minutes of day (UTC)
  const incidents = getCaseIncidents(data, caseId)
  const incidentMinutesOfDay = incidents.map(inc => {
    const d = new Date(inc.occurredAt)
    return d.getUTCHours() * 60 + d.getUTCMinutes()
  })

  return {
    caseId,
    type,
    personIds,
    vehicleIds,
    locationIds,
    phoneNumbers,
    evidenceTags,
    incidentMinutesOfDay,
  }
}

