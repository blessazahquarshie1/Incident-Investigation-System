import { describe, it, expect } from 'vitest'
import { mockData } from '../../fixtures'
import { buildCaseMap, layoutCaseMap } from '../caseMap'
import { findAllCaseLinks } from '../caseComparison'

describe('Step 14: buildCaseMap', () => {
  it('focus on CASE-00123 with minScore 4 gives centre node + edges to CASE-00201, CASE-00203, CASE-00204 and NO edge to CASE-00202', () => {
    const { nodes, edges } = buildCaseMap(mockData, {
      focusCaseId: 'CASE-00123',
      minScore: 4,
    })

    // Centre node
    const centre = nodes.find(n => n.id === 'CASE-00123')
    expect(centre).toBeDefined()
    expect(centre?.isCentre).toBe(true)

    // Related node IDs
    const nodeIds = nodes.map(n => n.id)
    expect(nodeIds).toContain('CASE-00201')
    expect(nodeIds).toContain('CASE-00203')
    expect(nodeIds).toContain('CASE-00204')
    expect(nodeIds).not.toContain('CASE-00202')

    // Edge targets
    const targetIds = edges.map(e => e.target)
    expect(targetIds).toContain('CASE-00201')
    expect(targetIds).toContain('CASE-00203')
    expect(targetIds).toContain('CASE-00204')
    expect(targetIds).not.toContain('CASE-00202')

    // Edges have labels and sharedShort phrases
    const edgeTo201 = edges.find(e => e.target === 'CASE-00201')
    expect(edgeTo201?.label).toContain('same person')
    expect(edgeTo201?.label).toContain('same car')
    expect(edgeTo201?.label).toContain('same method')
  })

  it('focus on CASE-00123 with minScore 0 also includes weak link CASE-00202', () => {
    const { nodes, edges } = buildCaseMap(mockData, {
      focusCaseId: 'CASE-00123',
      minScore: 0,
    })

    const nodeIds = nodes.map(n => n.id)
    expect(nodeIds).toContain('CASE-00202')

    const targetIds = edges.map(e => e.target)
    expect(targetIds).toContain('CASE-00202')
  })

  it('all-cases mode has exactly one edge per pair from findAllCaseLinks, with no duplicates and no self-links', () => {
    const minScore = 4
    const { nodes, edges } = buildCaseMap(mockData, { minScore })
    const expectedLinks = findAllCaseLinks(mockData, minScore)

    expect(nodes.length).toBe(mockData.cases.length)
    expect(edges.length).toBe(expectedLinks.length)

    const seenPairs = new Set<string>()
    for (const edge of edges) {
      expect(edge.source).not.toBe(edge.target)
      const pairKey = [edge.source, edge.target].sort().join('|')
      expect(seenPairs.has(pairKey)).toBe(false)
      seenPairs.add(pairKey)
    }
  })
})

describe('Step 14: layoutCaseMap', () => {
  it('focus layout positions centre at (400, 300) and no two nodes share a position', () => {
    const { nodes } = buildCaseMap(mockData, {
      focusCaseId: 'CASE-00123',
      minScore: 0,
    })

    const positions = layoutCaseMap(nodes, 'focus')
    expect(positions['CASE-00123']).toEqual({ x: 400, y: 300 })

    const positionSet = new Set<string>()
    for (const node of nodes) {
      const pos = positions[node.id]
      expect(pos).toBeDefined()
      const key = `${pos.x},${pos.y}`
      expect(positionSet.has(key)).toBe(false)
      positionSet.add(key)
    }
  })

  it('all-cases layout positions every case and no two nodes share a position', () => {
    const { nodes } = buildCaseMap(mockData, { minScore: 4 })
    const positions = layoutCaseMap(nodes, 'all')

    expect(Object.keys(positions).length).toBe(nodes.length)

    const positionSet = new Set<string>()
    for (const node of nodes) {
      const pos = positions[node.id]
      expect(pos).toBeDefined()
      const key = `${pos.x},${pos.y}`
      expect(positionSet.has(key)).toBe(false)
      positionSet.add(key)
    }
  })
})

