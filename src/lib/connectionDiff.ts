import type { InvestigationData } from '../types'
import { getCasePeople } from './caseScope'
import { calculateConnection } from './connections'
import { findRelatedCases, type ComparisonLevel } from './caseComparison'

export interface CasePairSnapshot {
  personAId: string
  personBId: string
  personAName: string
  personBName: string
  score: number
  level: ComparisonLevel
  sharedVehicles: string[]
  sharedLocations: string[]
  sharedIncidents: string[]
  sharedEvidence: string[]
  sharedPhoneNumbers: string[]
}

export interface RelatedCaseSnapshot {
  caseId: string
  score: number
  level: ComparisonLevel
}

export interface ConnectionSnapshot {
  caseId: string
  casePairs: Map<string, CasePairSnapshot>
  relatedCases: Map<string, RelatedCaseSnapshot>
}

/**
 * Captures a point-in-time snapshot of all connections for a case:
 * 1. People pairs within the case (score, level, shared entities).
 * 2. Cross-case related links (score, level).
 */
export function getConnectionSnapshot(
  data: InvestigationData,
  caseId: string
): ConnectionSnapshot {
  const casePairs = new Map<string, CasePairSnapshot>()
  const relatedCases = new Map<string, RelatedCaseSnapshot>()

  const people = getCasePeople(data, caseId)
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const p1 = people[i]
      const p2 = people[j]
      const pair = calculateConnection(data, p1.id, p2.id)
      const key = [p1.id, p2.id].sort().join(':')
      casePairs.set(key, {
        personAId: p1.id,
        personBId: p2.id,
        personAName: p1.fullName,
        personBName: p2.fullName,
        score: pair.score,
        level: pair.level,
        sharedVehicles: pair.sharedVehicles,
        sharedLocations: pair.sharedLocations,
        sharedIncidents: pair.sharedIncidents,
        sharedEvidence: pair.sharedEvidence,
        sharedPhoneNumbers: pair.sharedPhoneNumbers,
      })
    }
  }

  const related = findRelatedCases(data, caseId)
  for (const rc of related) {
    relatedCases.set(rc.caseBId, {
      caseId: rc.caseBId,
      score: rc.score,
      level: rc.level,
    })
  }

  return {
    caseId,
    casePairs,
    relatedCases,
  }
}

const LEVEL_RANK: Record<ComparisonLevel, number> = {
  'WEAK': 1,
  'MODERATE': 2,
  'STRONG': 3,
  'VERY STRONG': 4,
}

/**
 * Compares two snapshots and returns plain-English descriptions of newly discovered
 * links or strengthened connections.
 */
export function diffSnapshots(
  before: ConnectionSnapshot,
  after: ConnectionSnapshot
): string[] {
  const changes: string[] = []

  // 1. Check people pairs inside the case
  for (const [key, afterPair] of after.casePairs) {
    const beforePair = before.casePairs.get(key)
    if (!beforePair || beforePair.score === 0) {
      if (afterPair.score > 0) {
        let sharedThing = 'connection'
        if (afterPair.sharedVehicles.length > 0) sharedThing = 'vehicle'
        else if (afterPair.sharedIncidents.length > 0) sharedThing = 'incident'
        else if (afterPair.sharedEvidence.length > 0) sharedThing = 'evidence'
        else if (afterPair.sharedPhoneNumbers.length > 0) sharedThing = 'phone number'
        else if (afterPair.sharedLocations.length > 0) sharedThing = 'location'

        changes.push(
          `${afterPair.personAName} and ${afterPair.personBName} now share a ${sharedThing} (score ${afterPair.score}, ${afterPair.level})`
        )
      }
    } else if (afterPair.score > beforePair.score) {
      changes.push(
        `${afterPair.personAName} and ${afterPair.personBName} connection increased (score ${afterPair.score}, ${afterPair.level})`
      )
    }
  }

  // 2. Check related cases
  for (const [caseId, afterCase] of after.relatedCases) {
    const beforeCase = before.relatedCases.get(caseId)
    if (!beforeCase) {
      changes.push(`This case is now linked to ${caseId} (${afterCase.level})`)
    } else if (
      afterCase.score > beforeCase.score ||
      LEVEL_RANK[afterCase.level] > LEVEL_RANK[beforeCase.level]
    ) {
      changes.push(`Link to ${caseId} increased (${afterCase.level})`)
    }
  }

  return changes
}

