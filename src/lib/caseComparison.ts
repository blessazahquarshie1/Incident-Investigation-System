import type { InvestigationData } from '../types'
import { getCaseFingerprint } from './caseFingerprint'
import { generateLeads } from './leads'
import type { Lead, NameMatch, NameMatchKind } from './leads'

export { generateLeads }
export type { Lead, NameMatch, NameMatchKind }

/**
 * Weights and scoring rules for case-to-case comparison.
 * Plain-English reasons for each weight:
 * - sharedPerson: 5 points - The same human being is tied to both cases.
 * - sharedVehicle: 5 points - The exact same automobile is tied to both cases.
 * - sharedPhone: 6 points - Phone numbers are distinct and hard to share by coincidence.
 * - sharedEvidenceTag: 4 points - Same physical method or object (e.g. 'grey-balaclava').
 * - sharedLocation: 2 points - Both cases occurred at or touched the same location.
 * - similarTimeOfDay: 1 point - Incidents happened within 90 minutes of the same time of day.
 * - sameType: 1 point - Both cases share the same legal classification (e.g. theft, fraud).
 * - nameMatchExact: 3 points - Same full name under different IDs (potential duplicate identity).
 * - nameMatchSharedAlias: 3 points - Alias match between records.
 * - nameMatchSurname: 1 point - Same surname only (possible family link or coincidence).
 * - nameMatchCap: 5 points - Max points for speculative name matches without confirmed IDs.
 */
export const CASE_COMPARISON_WEIGHTS = {
  sharedPerson: 5,
  sharedVehicle: 5,
  sharedPhone: 6,
  sharedEvidenceTag: 4,
  sharedLocation: 2,
  similarTimeOfDay: 1,
  sameType: 1,
  nameMatchExact: 3,
  nameMatchSharedAlias: 3,
  nameMatchSurname: 1,
  nameMatchCap: 5,
} as const

export type ComparisonLevel = 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY STRONG'

export interface CaseComparison {
  caseAId: string
  caseBId: string
  sharedPersonIds: string[]
  sharedVehicleIds: string[]
  sharedLocationIds: string[]
  sharedPhoneNumbers: string[]
  sharedEvidenceTags: string[]
  nameMatches: NameMatch[]
  similarTimeOfDay: boolean
  sameType: boolean
  score: number
  level: ComparisonLevel
  breakdown: string[] // Only for signals that fired
  leads: Lead[]
  otherCaseIsPast?: boolean
}

/**
 * Classifies numerical score into categorical investigation confidence levels.
 */
export function classifyComparisonScore(score: number): ComparisonLevel {
  if (score <= 3) return 'WEAK'
  if (score <= 9) return 'MODERATE'
  if (score <= 17) return 'STRONG'
  return 'VERY STRONG'
}

/**
 * Normalises a name by converting to lowercase, removing punctuation and accents,
 * and splitting into words.
 */
export function normaliseWords(str: string): string[] {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Compares names and aliases between persons in two cases who have different IDs.
 */
export function findNameMatches(
  data: InvestigationData,
  caseAId: string,
  caseBId: string
): NameMatch[] {
  const peopleA = data.persons.filter(p => p.relatedCases.includes(caseAId))
  const peopleB = data.persons.filter(p => p.relatedCases.includes(caseBId))

  const matches: NameMatch[] = []
  const seenPairs = new Set<string>()

  for (const pA of peopleA) {
    for (const pB of peopleB) {
      if (pA.id === pB.id) continue

      const pairKey = [pA.id, pB.id].sort().join('|')
      if (seenPairs.has(pairKey)) continue

      const wordsA = normaliseWords(pA.fullName)
      const wordsB = normaliseWords(pB.fullName)

      // 1. Exact name match: all words match, any order
      const exactMatch =
        wordsA.length === wordsB.length &&
        wordsA.length > 0 &&
        [...wordsA].sort().join(' ') === [...wordsB].sort().join(' ')

      if (exactMatch) {
        seenPairs.add(pairKey)
        matches.push({
          personAId: pA.id,
          personBId: pB.id,
          kind: 'exact-name',
          matchedTerm: pA.fullName,
        })
        continue
      }

      // 2. Shared alias: one person's alias matches the other's alias or full name
      const aliasesA = (pA.knownAliases ?? []).map(a => normaliseWords(a).join(' '))
      const aliasesB = (pB.knownAliases ?? []).map(b => normaliseWords(b).join(' '))
      const strA = wordsA.join(' ')
      const strB = wordsB.join(' ')

      let sharedAliasMatch: string | null = null
      for (const a of aliasesA) {
        if (!a) continue
        if (aliasesB.includes(a) || a === strB) {
          sharedAliasMatch = a
          break
        }
      }
      if (!sharedAliasMatch) {
        for (const b of aliasesB) {
          if (!b) continue
          if (aliasesA.includes(b) || b === strA) {
            sharedAliasMatch = b
            break
          }
        }
      }

      if (sharedAliasMatch) {
        seenPairs.add(pairKey)
        matches.push({
          personAId: pA.id,
          personBId: pB.id,
          kind: 'shared-alias',
          matchedTerm: sharedAliasMatch,
        })
        continue
      }

      // 3. Surname only: exactly one word in common, length >= 4, first names differ
      const commonWords = wordsA.filter(w => wordsB.includes(w))
      const isFirstWordA = wordsA[0] !== undefined
      const isFirstWordB = wordsB[0] !== undefined
      const firstNameMatch = isFirstWordA && isFirstWordB && wordsA[0] === wordsB[0]

      if (commonWords.length === 1 && !firstNameMatch) {
        const sharedWord = commonWords[0]
        if (sharedWord.length >= 4) {
          seenPairs.add(pairKey)
          matches.push({
            personAId: pA.id,
            personBId: pB.id,
            kind: 'surname-only',
            matchedTerm: sharedWord,
          })
          continue
        }
      }
    }
  }

  return matches
}

/**
 * Calculates circular time difference in minutes between two minutes of day (0 to 1439).
 */
function minuteDifference(m1: number, m2: number): number {
  const diff = Math.abs(m1 - m2)
  return Math.min(diff, 1440 - diff)
}

/**
 * Compares two cases across all signals and returns a comprehensive comparison result.
 * The operation is mathematically symmetric: compareCases(A, B) produces the exact same
 * score and level as compareCases(B, A).
 */
export function compareCases(
  data: InvestigationData,
  caseAId: string,
  caseBId: string
): CaseComparison {
  const fpA = getCaseFingerprint(data, caseAId)
  const fpB = getCaseFingerprint(data, caseBId)

  // Shared entities (intersections)
  const sharedPersonIds = fpA.personIds.filter(id => fpB.personIds.includes(id))
  const sharedVehicleIds = fpA.vehicleIds.filter(id => fpB.vehicleIds.includes(id))
  const sharedLocationIds = fpA.locationIds.filter(id => fpB.locationIds.includes(id))
  const sharedPhoneNumbers = fpA.phoneNumbers.filter(ph => fpB.phoneNumbers.includes(ph))
  const sharedEvidenceTags = fpA.evidenceTags.filter(t => fpB.evidenceTags.includes(t))

  // Name matches between distinct records
  const nameMatches = findNameMatches(data, caseAId, caseBId)

  // Similar time of day (any incident pair within 90 minutes)
  let similarTimeOfDay = false
  for (const tA of fpA.incidentMinutesOfDay) {
    for (const tB of fpB.incidentMinutesOfDay) {
      if (minuteDifference(tA, tB) <= 90) {
        similarTimeOfDay = true
        break
      }
    }
    if (similarTimeOfDay) break
  }

  // Same case type
  const sameType = fpA.type === fpB.type

  // Score computation
  let score = 0
  const breakdown: string[] = []

  if (sharedPersonIds.length > 0) {
    const pts = sharedPersonIds.length * CASE_COMPARISON_WEIGHTS.sharedPerson
    score += pts
    breakdown.push(
      `${sharedPersonIds.length} person${sharedPersonIds.length > 1 ? 's' : ''} × ${CASE_COMPARISON_WEIGHTS.sharedPerson} = ${pts}`
    )
  }

  if (sharedVehicleIds.length > 0) {
    const pts = sharedVehicleIds.length * CASE_COMPARISON_WEIGHTS.sharedVehicle
    score += pts
    breakdown.push(
      `${sharedVehicleIds.length} vehicle${sharedVehicleIds.length > 1 ? 's' : ''} × ${CASE_COMPARISON_WEIGHTS.sharedVehicle} = ${pts}`
    )
  }

  if (sharedPhoneNumbers.length > 0) {
    const pts = sharedPhoneNumbers.length * CASE_COMPARISON_WEIGHTS.sharedPhone
    score += pts
    breakdown.push(
      `${sharedPhoneNumbers.length} phone number${sharedPhoneNumbers.length > 1 ? 's' : ''} × ${CASE_COMPARISON_WEIGHTS.sharedPhone} = ${pts}`
    )
  }

  if (sharedEvidenceTags.length > 0) {
    const pts = sharedEvidenceTags.length * CASE_COMPARISON_WEIGHTS.sharedEvidenceTag
    score += pts
    breakdown.push(
      `${sharedEvidenceTags.length} evidence tag${sharedEvidenceTags.length > 1 ? 's' : ''} × ${CASE_COMPARISON_WEIGHTS.sharedEvidenceTag} = ${pts}`
    )
  }

  if (sharedLocationIds.length > 0) {
    const pts = sharedLocationIds.length * CASE_COMPARISON_WEIGHTS.sharedLocation
    score += pts
    breakdown.push(
      `${sharedLocationIds.length} location${sharedLocationIds.length > 1 ? 's' : ''} × ${CASE_COMPARISON_WEIGHTS.sharedLocation} = ${pts}`
    )
  }

  // Name match scoring (capped at 5)
  if (nameMatches.length > 0) {
    let rawNameScore = 0
    for (const nm of nameMatches) {
      if (nm.kind === 'exact-name') rawNameScore += CASE_COMPARISON_WEIGHTS.nameMatchExact
      else if (nm.kind === 'shared-alias') rawNameScore += CASE_COMPARISON_WEIGHTS.nameMatchSharedAlias
      else if (nm.kind === 'surname-only') rawNameScore += CASE_COMPARISON_WEIGHTS.nameMatchSurname
    }
    const finalNameScore = Math.min(rawNameScore, CASE_COMPARISON_WEIGHTS.nameMatchCap)
    score += finalNameScore
    breakdown.push(`name matches = ${finalNameScore}${rawNameScore > CASE_COMPARISON_WEIGHTS.nameMatchCap ? ' (capped at 5)' : ''}`)
  }

  if (similarTimeOfDay) {
    score += CASE_COMPARISON_WEIGHTS.similarTimeOfDay
    breakdown.push(`similar time of day = ${CASE_COMPARISON_WEIGHTS.similarTimeOfDay}`)
  }

  if (sameType) {
    score += CASE_COMPARISON_WEIGHTS.sameType
    breakdown.push(`same case type = ${CASE_COMPARISON_WEIGHTS.sameType}`)
  }

  const level = classifyComparisonScore(score)

  const comparisonSignals = {
    caseAId,
    caseBId,
    sharedPersonIds,
    sharedVehicleIds,
    sharedLocationIds,
    sharedPhoneNumbers,
    sharedEvidenceTags,
    nameMatches,
    similarTimeOfDay,
    sameType,
  }

  const leads = generateLeads(data, comparisonSignals)
  const caseB = data.cases.find(c => c.id === caseBId)
  const otherCaseIsPast = caseB?.status === 'closed'

  return {
    caseAId,
    caseBId,
    sharedPersonIds,
    sharedVehicleIds,
    sharedLocationIds,
    sharedPhoneNumbers,
    sharedEvidenceTags,
    nameMatches,
    similarTimeOfDay,
    sameType,
    score,
    level,
    breakdown,
    leads,
    otherCaseIsPast,
  }
}

/**
 * Finds all other cases related to the given case, ordered by score descending.
 * Omits comparisons with score = 0 or comparison with self.
 */
export function findRelatedCases(
  data: InvestigationData,
  caseId: string
): CaseComparison[] {
  const results: CaseComparison[] = []

  for (const c of data.cases) {
    if (c.id === caseId) continue
    const comparison = compareCases(data, caseId, c.id)
    if (comparison.score > 0) {
      results.push(comparison)
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

/**
 * Compares every pair of distinct cases in the database exactly once,
 * returning those with score >= minScore, sorted strongest first.
 */
export function findAllCaseLinks(
  data: InvestigationData,
  minScore = 4
): CaseComparison[] {
  const links: CaseComparison[] = []
  const cases = data.cases

  for (let i = 0; i < cases.length; i++) {
    for (let j = i + 1; j < cases.length; j++) {
      const comparison = compareCases(data, cases[i].id, cases[j].id)
      if (comparison.score >= minScore) {
        links.push(comparison)
      }
    }
  }

  return links.sort((a, b) => b.score - a.score)
}

/**
 * Returns up to 3 concise phrases in order explaining why two cases are connected,
 * appending "+N more" if more than 3 signals are present.
 * 
 * Precedence order:
 * 1. same person (shared suspect / person of interest)
 * 2. same car (shared vehicle)
 * 3. same phone (shared phone number)
 * 4. same method (shared MO evidence tags e.g. 'grey-balaclava')
 * 5. same place (shared incident or sighting location)
 * 6. similar name (fuzzy or alias name match)
 * 7. similar time (incidents within 90 mins time of day)
 */
export function describeSharedShort(comparison: CaseComparison): string[] {
  const phrases: string[] = []

  if (comparison.sharedPersonIds.length > 0) phrases.push('same person')
  if (comparison.sharedVehicleIds.length > 0) phrases.push('same car')
  if (comparison.sharedPhoneNumbers.length > 0) phrases.push('same phone')
  if (comparison.sharedEvidenceTags.length > 0) phrases.push('same method')
  if (comparison.sharedLocationIds.length > 0) phrases.push('same place')
  if (comparison.nameMatches.length > 0) phrases.push('similar name')
  if (comparison.similarTimeOfDay) phrases.push('similar time')

  if (phrases.length <= 3) {
    return phrases
  }

  const top3 = phrases.slice(0, 3)
  const remaining = phrases.length - 3
  top3.push(`+${remaining} more`)
  return top3
}

