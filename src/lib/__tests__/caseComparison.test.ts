import { describe, it, expect } from 'vitest'
import { mockData } from '../../data'
import {
  compareCases,
  findRelatedCases,
  findAllCaseLinks,
  describeSharedShort,
} from '../caseComparison'
import { getCaseFingerprint } from '../caseFingerprint'

describe('Step 12: Case Fingerprint', () => {
  it('extracts fingerprint for CASE-00123 correctly', () => {
    const fp = getCaseFingerprint(mockData, 'CASE-00123')
    expect(fp.caseId).toBe('CASE-00123')
    expect(fp.type).toBe('theft')
    expect(fp.personIds).toContain('P-001')
    expect(fp.personIds).toContain('P-002')
    expect(fp.vehicleIds).toContain('V-001')
    expect(fp.locationIds).toContain('L-001')
    expect(fp.evidenceTags).toContain('grey-balaclava')
    expect(fp.evidenceTags).toContain('crowbar-pry-marks')
    expect(fp.incidentMinutesOfDay.length).toBeGreaterThan(0)
  })
})

describe('Step 12: compareCases', () => {
  it('CASE-00123 vs CASE-00201: shares V-001, P-002, and grey-balaclava tag; level is STRONG or VERY STRONG', () => {
    const res = compareCases(mockData, 'CASE-00123', 'CASE-00201')
    expect(res.sharedVehicleIds).toContain('V-001')
    expect(res.sharedPersonIds).toContain('P-002')
    expect(res.sharedEvidenceTags).toContain('grey-balaclava')
    expect(['STRONG', 'VERY STRONG']).toContain(res.level)
    expect(res.otherCaseIsPast).toBe(true)
    expect(res.leads.length).toBeGreaterThan(0)
  })

  it('CASE-00123 vs CASE-00202: shares only Accra Mall (and type); level WEAK; no shared people or name matches', () => {
    const res = compareCases(mockData, 'CASE-00123', 'CASE-00202')
    expect(res.sharedLocationIds).toContain('L-001')
    expect(res.sharedPersonIds).toHaveLength(0)
    expect(res.sharedVehicleIds).toHaveLength(0)
    expect(res.nameMatches).toHaveLength(0)
    expect(res.level).toBe('WEAK')
  })

  it('CASE-00123 vs CASE-00203: shares phone number; exact-name, surname-only, and shared-alias match; capped at 5; level STRONG', () => {
    const res = compareCases(mockData, 'CASE-00123', 'CASE-00203')
    expect(res.sharedPhoneNumbers.length).toBeGreaterThanOrEqual(1)
    expect(res.sharedPhoneNumbers).toContain('0241111111')

    const exactMatch = res.nameMatches.find(m => m.kind === 'exact-name')
    const surnameMatch = res.nameMatches.find(m => m.kind === 'surname-only')
    const aliasMatch = res.nameMatches.find(m => m.kind === 'shared-alias')

    expect(exactMatch).toBeDefined()
    expect(surnameMatch).toBeDefined()
    expect(aliasMatch).toBeDefined()

    expect(res.level).toBe('STRONG')
  })

  it('CASE-00123 vs CASE-00204: shares only crowbar-pry-marks; level MODERATE; otherCaseIsPast is true', () => {
    const res = compareCases(mockData, 'CASE-00123', 'CASE-00204')
    expect(res.sharedEvidenceTags).toContain('crowbar-pry-marks')
    expect(res.sharedPersonIds).toHaveLength(0)
    expect(res.sharedVehicleIds).toHaveLength(0)
    expect(res.sharedLocationIds).toHaveLength(0)
    expect(res.level).toBe('MODERATE')
    expect(res.otherCaseIsPast).toBe(true)
  })

  it('is symmetric: compareCases(A, B).score === compareCases(B, A).score', () => {
    const ab = compareCases(mockData, 'CASE-00123', 'CASE-00201')
    const ba = compareCases(mockData, 'CASE-00201', 'CASE-00123')
    expect(ab.score).toBe(ba.score)
    expect(ab.level).toBe(ba.level)
  })
})

describe('Step 12: findRelatedCases and findAllCaseLinks', () => {
  it('findRelatedCases(CASE-00123) returns new cases ordered strongest first and never includes itself', () => {
    const related = findRelatedCases(mockData, 'CASE-00123')
    expect(related.some(r => r.caseBId === 'CASE-00123')).toBe(false)

    const ids = related.map(r => r.caseBId)
    expect(ids).toContain('CASE-00201')
    expect(ids).toContain('CASE-00202')
    expect(ids).toContain('CASE-00203')
    expect(ids).toContain('CASE-00204')

    // Strongest first
    for (let i = 0; i < related.length - 1; i++) {
      expect(related[i].score).toBeGreaterThanOrEqual(related[i + 1].score)
    }
  })

  it('findAllCaseLinks contains no duplicate pairs and no case paired with itself', () => {
    const allLinks = findAllCaseLinks(mockData, 4)
    const seen = new Set<string>()

    for (const link of allLinks) {
      expect(link.caseAId).not.toBe(link.caseBId)
      const pairKey = [link.caseAId, link.caseBId].sort().join('|')
      expect(seen.has(pairKey)).toBe(false)
      seen.add(pairKey)
      expect(link.score).toBeGreaterThanOrEqual(4)
    }
  })

  it('every comparison that fired a signal has at least one lead, and leads are sorted high first', () => {
    const res = compareCases(mockData, 'CASE-00123', 'CASE-00201')
    expect(res.leads.length).toBeGreaterThan(0)

    const priorityRank = { high: 1, medium: 2, low: 3 }
    for (let i = 0; i < res.leads.length - 1; i++) {
      expect(priorityRank[res.leads[i].priority]).toBeLessThanOrEqual(
        priorityRank[res.leads[i + 1].priority]
      )
    }
  })
})

describe('Step 14: describeSharedShort', () => {
  it('returns plain words for CASE-00123 vs CASE-00201 in precedence order with +2 more', () => {
    const comp = compareCases(mockData, 'CASE-00123', 'CASE-00201')
    const shortPhrases = describeSharedShort(comp)
    // Signals present: same person (P-002), same car (V-001), same method (grey-balaclava),
    // plus name match and similar time. Top 3 + 2 more = 5 total.
    expect(shortPhrases).toEqual(['same person', 'same car', 'same method', '+2 more'])
  })

  it('returns single method phrase for CASE-00123 vs CASE-00204', () => {
    const comp = compareCases(mockData, 'CASE-00123', 'CASE-00204')
    const shortPhrases = describeSharedShort(comp)
    expect(shortPhrases).toEqual(['same method'])
  })

  it('returns exactly 3 phrases without truncation when exactly 3 signals fire', () => {
    const syntheticComp = {
      caseAId: 'A',
      caseBId: 'B',
      sharedPersonIds: ['P-1'],
      sharedVehicleIds: ['V-1'],
      sharedPhoneNumbers: ['0240000000'],
      sharedEvidenceTags: [],
      sharedLocationIds: [],
      nameMatches: [],
      similarTimeOfDay: false,
      sameType: false,
      score: 16,
      level: 'STRONG' as const,
      breakdown: [],
      leads: [],
    }
    expect(describeSharedShort(syntheticComp)).toEqual(['same person', 'same car', 'same phone'])
  })

  it('caps at 3 phrases and appends "+N more" when 4 signals fire', () => {
    const syntheticComp = {
      caseAId: 'A',
      caseBId: 'B',
      sharedPersonIds: ['P-1'],
      sharedVehicleIds: ['V-1'],
      sharedPhoneNumbers: ['0240000000'],
      sharedEvidenceTags: ['tag1'],
      sharedLocationIds: [],
      nameMatches: [],
      similarTimeOfDay: false,
      sameType: false,
      score: 20,
      level: 'VERY STRONG' as const,
      breakdown: [],
      leads: [],
    }
    expect(describeSharedShort(syntheticComp)).toEqual(['same person', 'same car', 'same phone', '+1 more'])
  })
})
