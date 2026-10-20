import { describe, it, expect } from 'vitest'
import { mockData } from '../../fixtures'
import { compareCases, findRelatedCases, findAllCaseLinks } from '../caseComparison'
import { searchByName } from '../nameSearch'
import { buildTimeline } from '../timeline'

describe('Step 13: Full Acceptance Test', () => {
  it('1. CASE-00123 Connections shows the four new cases with correct status and confidence levels', () => {
    const related = findRelatedCases(mockData, 'CASE-00123')
    const caseMap = new Map(related.map(r => [r.caseBId, r]))

    // CASE-00201: Past, STRONG or higher, shares vehicle, person, and evidence tag
    const c201 = caseMap.get('CASE-00201')
    expect(c201).toBeDefined()
    expect(c201!.otherCaseIsPast).toBe(true)
    expect(['STRONG', 'VERY STRONG']).toContain(c201!.level)
    expect(c201!.sharedVehicleIds).toContain('V-001')
    expect(c201!.sharedPersonIds).toContain('P-002')
    expect(c201!.sharedEvidenceTags).toContain('grey-balaclava')

    // CASE-00203: Current, STRONG, shares phone number, with name matches
    const c203 = caseMap.get('CASE-00203')
    expect(c203).toBeDefined()
    expect(c203!.otherCaseIsPast).toBe(false)
    expect(c203!.level).toBe('STRONG')
    expect(c203!.sharedPhoneNumbers).toContain('0241111111')
    expect(c203!.nameMatches.length).toBeGreaterThan(0)

    // CASE-00204: Past, MODERATE, shares evidence tag crowbar-pry-marks
    const c204 = caseMap.get('CASE-00204')
    expect(c204).toBeDefined()
    expect(c204!.otherCaseIsPast).toBe(true)
    expect(c204!.level).toBe('MODERATE')
    expect(c204!.sharedEvidenceTags).toContain('crowbar-pry-marks')

    // CASE-00202: WEAK, shares only Accra Mall (and type)
    const c202 = caseMap.get('CASE-00202')
    expect(c202).toBeDefined()
    expect(c202!.level).toBe('WEAK')
    expect(c202!.sharedLocationIds).toContain('L-001')
    expect(c202!.sharedPersonIds).toHaveLength(0)
    expect(c202!.sharedVehicleIds).toHaveLength(0)
  })

  it('2. Compare on CASE-00201 produces leads mentioning Hilux GT-4521-23 and Kofi Boateng, and two side-by-side timelines', () => {
    const comparison = compareCases(mockData, 'CASE-00123', 'CASE-00201')
    expect(comparison.leads.length).toBeGreaterThan(0)

    const allLeadsText = comparison.leads.map(l => l.text).join(' ')
    expect(allLeadsText).toContain('GT-4521-23')
    expect(allLeadsText).toContain('Kofi Boateng')

    // Side-by-side timelines
    const timelineA = buildTimeline(mockData, 'CASE-00123')
    const timelineB = buildTimeline(mockData, 'CASE-00201')
    expect(timelineA.length).toBeGreaterThan(0)
    expect(timelineB.length).toBeGreaterThan(0)
  })

  it('3. Name search: asante returns both records, and kwame, kojo b, ashante (similar spelling) all resolve', () => {
    // asante: returns both Asante records (Kwame Asante P-001 and Kwame Asante P-031 / Esi Asante P-032)
    const asanteRes = searchByName(mockData, 'asante')
    expect(asanteRes.people.length).toBeGreaterThanOrEqual(2)
    const asanteNames = asanteRes.people.map(p => p.person.fullName)
    expect(asanteNames).toContain('Kwame Asante')

    // kwame: returns Kwame Asante records
    const kwameRes = searchByName(mockData, 'kwame')
    expect(kwameRes.people.some(p => p.person.fullName.toLowerCase().includes('kwame'))).toBe(true)

    // kojo b: matches alias for Kofi Boateng (P-002) and Daniel Cudjoe (P-033)
    const kojoRes = searchByName(mockData, 'kojo b')
    expect(kojoRes.people.length).toBeGreaterThanOrEqual(2)
    for (const match of kojoRes.people) {
      expect(match.matchedOn).toBe('alias')
    }

    // ashante: matches Kwame Asante with similar spelling
    const ashanteRes = searchByName(mockData, 'ashante')
    expect(ashanteRes.people.length).toBeGreaterThan(0)
    const ashanteMatch = ashanteRes.people.find(p => p.person.fullName === 'Kwame Asante')
    expect(ashanteMatch).toBeDefined()
    expect(ashanteMatch!.matchedOn).toBe('similar spelling')
  })

  it('4. Relationship graph in Cases mode: findAllCaseLinks returns links with varying levels and thickness', () => {
    const strongLinks = findAllCaseLinks(mockData, 4)
    expect(strongLinks.length).toBeGreaterThanOrEqual(5)

    const levels = new Set(strongLinks.map(l => l.level))
    expect(levels.has('STRONG') || levels.has('VERY STRONG')).toBe(true)
    expect(levels.has('MODERATE')).toBe(true)

    // Weak links when threshold is 1
    const allLinks = findAllCaseLinks(mockData, 1)
    expect(allLinks.some(l => l.level === 'WEAK')).toBe(true)
  })

  it('6. Dashboard: findAllCaseLinks(mockData, 4).slice(0, 5) supplies top 5 strongest case links', () => {
    const topLinks = findAllCaseLinks(mockData, 4).slice(0, 5)
    expect(topLinks.length).toBe(5)
    for (let i = 0; i < topLinks.length - 1; i++) {
      expect(topLinks[i].score).toBeGreaterThanOrEqual(topLinks[i + 1].score)
    }
  })
})

