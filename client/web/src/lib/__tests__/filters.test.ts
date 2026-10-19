import { describe, it, expect } from 'vitest'
import { mockData } from '../../data'
import { filterPersons } from '../filters'

describe('filterPersons', () => {
  it('filters persons by address', () => {
    const results = filterPersons(mockData.persons, { text: 'Ridge' })
    expect(results.some(p => p.id === 'P-001')).toBe(true)
    expect(results.every(p => p.address?.toLowerCase().includes('ridge') || p.fullName.toLowerCase().includes('ridge'))).toBe(true)
  })

  it('filters persons by type', () => {
    const suspects = filterPersons(mockData.persons, { type: 'suspect' })
    expect(suspects.every(p => p.type === 'suspect')).toBe(true)
  })

  it('returns all persons when no filters are set', () => {
    const all = filterPersons(mockData.persons, {})
    expect(all.length).toBe(mockData.persons.length)
  })
})

