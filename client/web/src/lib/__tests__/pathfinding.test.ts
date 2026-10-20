import { describe, it, expect } from 'vitest'
import { mockData } from '../../fixtures'
import { findShortestConnection, findAllShortestConnections } from '../pathfinding'

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

describe('findAllShortestConnections', () => {
  it('finds all 4 parallel 2-step paths between P-001 and P-002 (locations, vehicle, incident)', () => {
    const paths = findAllShortestConnections(mockData, 'P-001', 'P-002')
    expect(paths).toHaveLength(4)
    expect(paths.every(p => p.length === 2)).toBe(true)

    // Verify intermediate connector nodes
    const connectorIds = paths.map(p => p.nodes[1].id)
    expect(connectorIds).toContain('L-001') // Accra Mall
    expect(connectorIds).toContain('L-002') // Tema Commercial Centre
    expect(connectorIds).toContain('V-001') // Toyota Hilux
    expect(connectorIds).toContain('I-023') // Armed Robbery incident
  })

  it('returns exactly 1 path of length 4 for P-001 and P-006', () => {
    const paths = findAllShortestConnections(mockData, 'P-001', 'P-006')
    expect(paths).toHaveLength(1)
    expect(paths[0].length).toBe(4)
    expect(paths[0].nodes.map(n => n.id)).toEqual(['P-001', 'V-007', 'P-003', 'I-004', 'P-006'])
  })

  it('returns empty array when no connection exists', () => {
    const paths = findAllShortestConnections(mockData, 'P-001', 'P-NONEXISTENT')
    expect(paths).toEqual([])
  })
})

