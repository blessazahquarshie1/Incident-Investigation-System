import { describe, it, expect } from 'vitest'
import { mockData } from '../../fixtures'
import { searchByName } from '../nameSearch'

describe('Step 12: Name Search Engine', () => {
  it('searchByName("asante") finds both Asantes and returns CASE-00123 and CASE-00203', () => {
    const res = searchByName(mockData, 'asante')
    const fullNames = res.people.map(p => p.person.fullName)
    expect(fullNames).toContain('Kwame Asante')
    expect(fullNames).toContain('Esi Asante')

    const caseIds = res.cases.map(c => c.caseId)
    expect(caseIds).toContain('CASE-00123')
    expect(caseIds).toContain('CASE-00203')
  })

  it('searchByName("kwame") finds every Kwame', () => {
    const res = searchByName(mockData, 'kwame')
    expect(res.people.length).toBeGreaterThanOrEqual(2)
    for (const p of res.people) {
      expect(p.person.fullName.toLowerCase()).toContain('kwame')
    }
  })

  it('searchByName("kojo b") finds the alias person', () => {
    const res = searchByName(mockData, 'kojo b')
    const aliases = res.people.flatMap(p => p.person.knownAliases ?? [])
    expect(aliases).toContain('Kojo B')
  })

  it('searchByName("ashante") finds the Asantes labelled "similar spelling"', () => {
    const res = searchByName(mockData, 'ashante')
    expect(res.people.length).toBeGreaterThanOrEqual(1)
    const match = res.people.find(p => p.person.fullName.toLowerCase().includes('asante'))
    expect(match).toBeDefined()
    expect(match?.matchedOn).toBe('similar spelling')
  })

  it('searchByName("k") returns empty results for queries under 2 characters', () => {
    const res = searchByName(mockData, 'k')
    expect(res.people).toHaveLength(0)
    expect(res.cases).toHaveLength(0)
  })
})

