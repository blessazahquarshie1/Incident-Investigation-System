import type { InvestigationData } from '../types'

// CONNECTION SCORING RULES (plain English):
// - LOCATION: both people have a 'visited' edge to the same location (an incident's own location does NOT count)
// - VEHICLE: both people have 'owns' or 'connected-to' edge to the same vehicle (includes Vehicle.ownerId)
// - INCIDENT: both people have 'involved-in' or 'witnessed' edge to the same incident
// - EVIDENCE: both people appear in the same Evidence.linkedPersons
// - PHONE: the two people's phone numbers overlap.
//   A person's numbers = Person.phone + every phoneNumber in phoneRecords where personId === person.id

export const SCORE_WEIGHTS = {
  location: 2,
  vehicle: 4,
  incident: 5,
  evidence: 5,
  phone: 6,
} as const

export type ConnectionLevel = 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY STRONG'

export interface PairConnection {
  personAId: string
  personBId: string
  sharedLocations: string[]
  sharedVehicles: string[]
  sharedIncidents: string[]
  sharedEvidence: string[]
  sharedPhoneNumbers: string[]
  score: number
  level: ConnectionLevel
}

export interface ConnectionResult {
  sharedPeople: string[]
  sharedVehicles: string[]
  sharedLocations: string[]
  sharedIncidents: string[]
  sharedEvidence: string[]
  connectionScore: number
  connections: PairConnection[]
}

export interface PersonFootprint {
  locationIds: Set<string>   // locations visited (visited edge only)
  vehicleIds: Set<string>    // vehicles linked (owns or connected-to)
  incidentIds: Set<string>   // incidents linked (involved-in or witnessed)
  evidenceIds: Set<string>   // evidence.linkedPersons
  phoneNumbers: Set<string>  // Person.phone + all phoneNumbers from phoneRecords
}

export function getPersonFootprint(data: InvestigationData, personId: string): PersonFootprint {
  const footprint: PersonFootprint = {
    locationIds: new Set(),
    vehicleIds: new Set(),
    incidentIds: new Set(),
    evidenceIds: new Set(),
    phoneNumbers: new Set(),
  }

  // LOCATIONS: only from 'visited' edges (not from incidents)
  for (const rel of data.relationships) {
    if (rel.source === personId && rel.relationship === 'visited' && rel.target.startsWith('L-')) {
      footprint.locationIds.add(rel.target)
    }
  }

  // VEHICLES: 'owns' or 'connected-to' edges, plus Vehicle.ownerId
  for (const rel of data.relationships) {
    if (rel.source === personId && (rel.relationship === 'owns' || rel.relationship === 'connected-to') && rel.target.startsWith('V-')) {
      footprint.vehicleIds.add(rel.target)
    }
  }
  for (const v of data.vehicles) {
    if (v.ownerId === personId) footprint.vehicleIds.add(v.id)
  }

  // INCIDENTS: 'involved-in' or 'witnessed' edges
  for (const rel of data.relationships) {
    if (rel.source === personId && (rel.relationship === 'involved-in' || rel.relationship === 'witnessed') && rel.target.startsWith('I-')) {
      footprint.incidentIds.add(rel.target)
    }
  }

  // EVIDENCE: evidence.linkedPersons
  for (const ev of data.evidence) {
    if (ev.linkedPersons.includes(personId)) footprint.evidenceIds.add(ev.id)
  }

  // PHONE NUMBERS: Person.phone + phoneRecords
  const person = data.persons.find(p => p.id === personId)
  if (person?.phone) footprint.phoneNumbers.add(person.phone)
  for (const pr of data.phoneRecords) {
    if (pr.personId === personId) footprint.phoneNumbers.add(pr.phoneNumber)
  }

  return footprint
}

// Helper: intersection of two sets
function intersect<T>(a: Set<T>, b: Set<T>): T[] {
  return [...a].filter(x => b.has(x))
}

export function classifyScore(score: number): ConnectionLevel {
  if (score <= 4) return 'WEAK'
  if (score <= 9) return 'MODERATE'
  if (score <= 15) return 'STRONG'
  return 'VERY STRONG'
}

export function calculateConnection(data: InvestigationData, personAId: string, personBId: string): PairConnection {
  const fa = getPersonFootprint(data, personAId)
  const fb = getPersonFootprint(data, personBId)

  const sharedLocations = intersect(fa.locationIds, fb.locationIds)
  const sharedVehicles = intersect(fa.vehicleIds, fb.vehicleIds)
  const sharedIncidents = intersect(fa.incidentIds, fb.incidentIds)
  const sharedEvidence = intersect(fa.evidenceIds, fb.evidenceIds)
  const sharedPhoneNumbers = intersect(fa.phoneNumbers, fb.phoneNumbers)

  const score =
    sharedLocations.length * SCORE_WEIGHTS.location +
    sharedVehicles.length * SCORE_WEIGHTS.vehicle +
    sharedIncidents.length * SCORE_WEIGHTS.incident +
    sharedEvidence.length * SCORE_WEIGHTS.evidence +
    sharedPhoneNumbers.length * SCORE_WEIGHTS.phone

  return {
    personAId,
    personBId,
    sharedLocations,
    sharedVehicles,
    sharedIncidents,
    sharedEvidence,
    sharedPhoneNumbers,
    score,
    level: classifyScore(score),
  }
}

export function describeScore(pair: PairConnection): string[] {
  const lines: string[] = []
  if (pair.sharedLocations.length > 0)
    lines.push(`${pair.sharedLocations.length} location${pair.sharedLocations.length > 1 ? 's' : ''} × ${SCORE_WEIGHTS.location} = ${pair.sharedLocations.length * SCORE_WEIGHTS.location}`)
  if (pair.sharedVehicles.length > 0)
    lines.push(`${pair.sharedVehicles.length} vehicle${pair.sharedVehicles.length > 1 ? 's' : ''} × ${SCORE_WEIGHTS.vehicle} = ${pair.sharedVehicles.length * SCORE_WEIGHTS.vehicle}`)
  if (pair.sharedIncidents.length > 0)
    lines.push(`${pair.sharedIncidents.length} incident${pair.sharedIncidents.length > 1 ? 's' : ''} × ${SCORE_WEIGHTS.incident} = ${pair.sharedIncidents.length * SCORE_WEIGHTS.incident}`)
  if (pair.sharedEvidence.length > 0)
    lines.push(`${pair.sharedEvidence.length} evidence × ${SCORE_WEIGHTS.evidence} = ${pair.sharedEvidence.length * SCORE_WEIGHTS.evidence}`)
  if (pair.sharedPhoneNumbers.length > 0)
    lines.push(`${pair.sharedPhoneNumbers.length} phone number${pair.sharedPhoneNumbers.length > 1 ? 's' : ''} × ${SCORE_WEIGHTS.phone} = ${pair.sharedPhoneNumbers.length * SCORE_WEIGHTS.phone}`)
  return lines
}

export function findConnections(data: InvestigationData, personId: string): ConnectionResult {
  // If person doesn't exist, return empty result
  if (!data.persons.find(p => p.id === personId)) {
    return { sharedPeople: [], sharedVehicles: [], sharedLocations: [], sharedIncidents: [], sharedEvidence: [], connectionScore: 0, connections: [] }
  }

  const pairs: PairConnection[] = []
  for (const other of data.persons) {
    if (other.id === personId) continue
    const pair = calculateConnection(data, personId, other.id)
    if (pair.score > 0) pairs.push(pair)
  }

  // connectionScore is the HIGHEST pair score, not the sum.
  // (The sum would measure popularity, not connection strength.)
  const connectionScore = pairs.reduce((max, p) => Math.max(max, p.score), 0)

  // Combine shared items from all pairs (no duplicates)
  const sharedPeople = [...new Set(pairs.map(p => p.personAId === personId ? p.personBId : p.personAId))]
  const sharedVehicles = [...new Set(pairs.flatMap(p => p.sharedVehicles))]
  const sharedLocations = [...new Set(pairs.flatMap(p => p.sharedLocations))]
  const sharedIncidents = [...new Set(pairs.flatMap(p => p.sharedIncidents))]
  const sharedEvidence = [...new Set(pairs.flatMap(p => p.sharedEvidence))]

  // Sort pairs strongest first
  pairs.sort((a, b) => b.score - a.score)

  return { sharedPeople, sharedVehicles, sharedLocations, sharedIncidents, sharedEvidence, connectionScore, connections: pairs }
}
