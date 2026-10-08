import { describe, it, expect } from 'vitest'
import { mockData } from '../../data'
import {
  calculateConnection, classifyScore, findConnections, SCORE_WEIGHTS
} from '../connections'

describe('classifyScore', () => {
  it('0 and 4 → WEAK', () => {
    expect(classifyScore(0)).toBe('WEAK')
    expect(classifyScore(4)).toBe('WEAK')
  })
  it('5 and 9 → MODERATE', () => {
    expect(classifyScore(5)).toBe('MODERATE')
    expect(classifyScore(9)).toBe('MODERATE')
  })
  it('10 and 15 → STRONG', () => {
    expect(classifyScore(10)).toBe('STRONG')
    expect(classifyScore(15)).toBe('STRONG')
  })
  it('16 and 40 → VERY STRONG', () => {
    expect(classifyScore(16)).toBe('VERY STRONG')
    expect(classifyScore(40)).toBe('VERY STRONG')
  })
})

describe('calculateConnection P-001 vs P-002', () => {
  it('scores 13 STRONG', () => {
    const result = calculateConnection(mockData, 'P-001', 'P-002')
    expect(result.sharedLocations).toHaveLength(2)
    expect(result.sharedVehicles).toHaveLength(1)
    expect(result.sharedIncidents).toHaveLength(1)
    expect(result.sharedEvidence).toHaveLength(0)
    expect(result.sharedPhoneNumbers).toHaveLength(0)
    expect(result.score).toBe(13)
    expect(result.level).toBe('STRONG')
  })

  it('is symmetric: calculateConnection(a,b) === calculateConnection(b,a)', () => {
    const ab = calculateConnection(mockData, 'P-001', 'P-002')
    const ba = calculateConnection(mockData, 'P-002', 'P-001')
    expect(ab.score).toBe(ba.score)
    expect(ab.sharedLocations.sort()).toEqual(ba.sharedLocations.sort())
    expect(ab.sharedVehicles.sort()).toEqual(ba.sharedVehicles.sort())
    expect(ab.sharedIncidents.sort()).toEqual(ba.sharedIncidents.sort())
  })
})

describe('P-004 vs P-005 shared phone', () => {
  it('includes a shared phone number and adds 6', () => {
    const result = calculateConnection(mockData, 'P-004', 'P-005')
    expect(result.sharedPhoneNumbers.length).toBeGreaterThanOrEqual(1)
    expect(result.score).toBeGreaterThanOrEqual(SCORE_WEIGHTS.phone)
  })
})

describe('findConnections', () => {
  it('lists P-002 in sharedPeople for P-001', () => {
    const result = findConnections(mockData, 'P-001')
    expect(result.sharedPeople).toContain('P-002')
  })

  it('lists V-001 in sharedVehicles for P-001', () => {
    const result = findConnections(mockData, 'P-001')
    expect(result.sharedVehicles).toContain('V-001')
  })

  it('connectionScore is at least 13 for P-001', () => {
    const result = findConnections(mockData, 'P-001')
    expect(result.connectionScore).toBeGreaterThanOrEqual(13)
  })

  it('returns empty result for unknown person id', () => {
    const result = findConnections(mockData, 'P-NONEXISTENT')
    expect(result.sharedPeople).toHaveLength(0)
    expect(result.connectionScore).toBe(0)
  })
})
