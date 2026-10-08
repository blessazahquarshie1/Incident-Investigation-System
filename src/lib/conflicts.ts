import type { InvestigationData } from '../types'
import { getTravelMinutes } from '../data/travelTimes'

export interface PresenceClaim {
  personId: string
  locationId: string
  timestamp: string
  sourceType: 'witness-statement' | 'sighting' | 'phone-record'
  sourceId: string
  description: string
}

export interface TimelineConflict {
  id: string
  personId: string
  claimA: PresenceClaim
  claimB: PresenceClaim
  gapMinutes: number
  requiredMinutes: number
  explanation: string
}

export function detectTimelineConflicts(
  data: InvestigationData,
  caseId?: string
): TimelineConflict[] {
  // Step 1: Build all presence claims.
  // A claim says "person X was at location Y at time T according to source Z"
  const claims: PresenceClaim[] = []

  const inCase = (c: string) => !caseId || c === caseId

  // From witness statements: use claimedTime (when they say the person was there),
  // NOT recordedAt (when the statement was taken)
  for (const ws of data.witnessStatements) {
    if (!inCase(ws.caseId)) continue
    claims.push({
      personId: ws.subjectPersonId,
      locationId: ws.locationId,
      timestamp: ws.claimedTime,
      sourceType: 'witness-statement',
      sourceId: ws.id,
      description: `Witness statement ${ws.id}: placed at location`,
    })
  }

  // From sightings with a personId
  for (const s of data.sightings) {
    if (!inCase(s.caseId)) continue
    if (!s.personId) continue
    claims.push({
      personId: s.personId,
      locationId: s.locationId,
      timestamp: s.timestamp,
      sourceType: 'sighting',
      sourceId: s.id,
      description: `Sighting ${s.id} (${s.source}): detected at location`,
    })
  }

  // From cell-tower phone records with a locationId
  for (const pr of data.phoneRecords) {
    if (!inCase(pr.caseId)) continue
    if (pr.kind !== 'cell-tower' || !pr.locationId) continue
    claims.push({
      personId: pr.personId,
      locationId: pr.locationId,
      timestamp: pr.timestamp,
      sourceType: 'phone-record',
      sourceId: pr.id,
      description: `Phone record ${pr.id}: cell tower at location`,
    })
  }

  // Step 2: Group by person
  const byPerson = new Map<string, PresenceClaim[]>()
  for (const claim of claims) {
    if (!byPerson.has(claim.personId)) byPerson.set(claim.personId, [])
    byPerson.get(claim.personId)!.push(claim)
  }

  const conflicts: TimelineConflict[] = []
  let conflictIdx = 0

  // Step 3: For each person, compare every pair of claims.
  // We check every pair because each person has only a handful of claims.
  for (const [personId, personClaims] of byPerson) {
    for (let i = 0; i < personClaims.length; i++) {
      for (let j = i + 1; j < personClaims.length; j++) {
        const a = personClaims[i]
        const b = personClaims[j]

        // Step 4: A conflict is when:
        // - the two claims are at DIFFERENT locations
        // - and the time between them is LESS than the travel time between those locations
        if (a.locationId === b.locationId) continue // same location = no conflict

        const locA = data.locations.find(l => l.id === a.locationId)
        const locB = data.locations.find(l => l.id === b.locationId)
        if (!locA || !locB) continue

        const tA = new Date(a.timestamp).getTime()
        const tB = new Date(b.timestamp).getTime()
        const gapMinutes = Math.abs(tA - tB) / 60000
        const requiredMinutes = getTravelMinutes(locA.city, locB.city)

        // If you can't physically get from A to B in the gap, it's a conflict.
        // Equal timestamps at different places is also a conflict (gap=0 < any required time).
        if (gapMinutes < requiredMinutes) {
          const earlier = tA <= tB ? a : b
          const later = tA <= tB ? b : a
          const person = data.persons.find(p => p.id === personId)
          const personName = person?.fullName ?? personId
          const earlierLoc = data.locations.find(l => l.id === earlier.locationId)
          const laterLoc = data.locations.find(l => l.id === later.locationId)

          const explanation = [
            earlier.sourceType === 'witness-statement' ? 'Witness statement' : earlier.sourceType === 'sighting' ? 'Sighting' : 'Phone record',
            `places ${personName} in ${earlierLoc?.city ?? earlier.locationId} at ${new Date(earlier.timestamp).toISOString().substring(11, 16)} UTC,`,
            `but ${later.sourceType === 'witness-statement' ? 'witness statement' : later.sourceType === 'sighting' ? 'sighting' : 'phone record'}`,
            `places them in ${laterLoc?.city ?? later.locationId} at ${new Date(later.timestamp).toISOString().substring(11, 16)} UTC.`,
            `Travel between them takes about ${requiredMinutes} minutes; the gap is ${Math.round(gapMinutes)} minutes.`,
          ].join(' ')

          conflicts.push({
            id: `conflict-${conflictIdx++}`,
            personId,
            claimA: earlier,
            claimB: later,
            gapMinutes: Math.round(gapMinutes),
            requiredMinutes,
            explanation,
          })
        }
      }
    }
  }

  // Step 5: Return all conflicts (same location or enough time = not a conflict)
  return conflicts
}
