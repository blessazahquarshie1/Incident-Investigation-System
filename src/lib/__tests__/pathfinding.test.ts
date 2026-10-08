import { describe, it, expect } from 'vitest'
import { mockData } from '../../data'
import { findShortestConnection } from '../pathfinding'

describe('findShortestConnection', () => {
  it('finds the 5-node path P-001→V-007→P-003→I-004→P-006 (length 4)', () => {
    const result = findShortestConnection(mockData, 'P-001', 'P-006')
    expect(result).not.toBeNull()
    expect(result!.length).toBe(4)
    expect(result!.nodes.map(n => n.id)).toEqual(['P-001', 'V-007', 'P-003', 'I-004', 'P-006'])
  })

  it('returns length 0 for same person', () => {
    const result = findShortestConnection(mockData, 'P-001', 'P-001')
    expect(result).not.toBeNull()
    expect(result!.length).toBe(0)
    expect(result!.nodes).toHaveLength(1)
  })

  it('returns null for unknown id', () => {
    const result = findShortestConnection(mockData, 'P-001', 'P-NONEXISTENT')
    expect(result).toBeNull()
  })
})
