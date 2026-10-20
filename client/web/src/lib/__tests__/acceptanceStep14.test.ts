import { describe, it, expect } from 'vitest'
import { mockData } from '../../fixtures'
import { buildCaseMap, layoutCaseMap } from '../caseMap'
import { describeSharedShort, findAllCaseLinks } from '../caseComparison'
import { computeLayout } from '../graphLayout'
import { buildGraph } from '../graph'

describe('Step 14: Full Acceptance Test (Case Map & Graph Usability)', () => {
  it('1. Focus on CASE-00123: Centre case surrounded by related cases with minScore 4', () => {
    const { nodes, edges } = buildCaseMap(mockData, {
      focusCaseId: 'CASE-00123',
      minScore: 4,
    })

    // Centre node is CASE-00123 with isCentre: true
    const centre = nodes.find(n => n.id === 'CASE-00123')
    expect(centre).toBeDefined()
    expect(centre?.isCentre).toBe(true)
    expect(centre?.status).toBe('investigating')
    expect(centre?.isPast).toBe(false)

    // Surrounding nodes include CASE-00201, CASE-00203, CASE-00204
    const nodeIds = nodes.map(n => n.id)
    expect(nodeIds).toContain('CASE-00201')
    expect(nodeIds).toContain('CASE-00203')
    expect(nodeIds).toContain('CASE-00204')
    expect(nodeIds).not.toContain('CASE-00202') // score 3 < 4 excluded

    // Edges exist to all 3 related cases
    const targetIds = edges.map(e => e.target)
    expect(targetIds).toContain('CASE-00201')
    expect(targetIds).toContain('CASE-00203')
    expect(targetIds).toContain('CASE-00204')
    expect(targetIds).not.toContain('CASE-00202')
  })

  it('2. Clicking line to CASE-00201 provides Hilux, Kofi Boateng, grey-balaclava, and leads in plain words', () => {
    const { edges } = buildCaseMap(mockData, {
      focusCaseId: 'CASE-00123',
      minScore: 4,
    })

    const edge201 = edges.find(e => e.target === 'CASE-00201')
    expect(edge201).toBeDefined()
    expect(edge201!.score).toBeGreaterThanOrEqual(18)
    expect(['STRONG', 'VERY STRONG']).toContain(edge201!.level)

    // Label on the edge line
    const shortPhrases = describeSharedShort(edge201!.comparison)
    expect(shortPhrases).toContain('same person')
    expect(shortPhrases).toContain('same car')
    expect(shortPhrases).toContain('same method')

    // Real entities behind the link
    const comp = edge201!.comparison
    const sharedVehicles = comp.sharedVehicleIds.map(vid => mockData.vehicles.find(v => v.id === vid))
    const sharedPersons = comp.sharedPersonIds.map(pid => mockData.persons.find(p => p.id === pid))

    expect(sharedVehicles.some(v => v?.registration === 'GT-4521-23' && v?.model === 'Hilux')).toBe(true)
    expect(sharedPersons.some(p => p?.fullName === 'Kofi Boateng')).toBe(true)
    expect(comp.sharedEvidenceTags).toContain('grey-balaclava')

    // Actionable investigative leads
    expect(comp.leads.length).toBeGreaterThan(0)
    const allLeadsText = comp.leads.map(l => l.text).join(' ')
    expect(allLeadsText).toContain('GT-4521-23')
    expect(allLeadsText).toContain('Kofi Boateng')
  })

  it('3. "Show weak links" (minScore: 0) includes CASE-00202', () => {
    const { nodes, edges } = buildCaseMap(mockData, {
      focusCaseId: 'CASE-00123',
      minScore: 0,
    })

    expect(nodes.map(n => n.id)).toContain('CASE-00202')
    expect(edges.map(e => e.target)).toContain('CASE-00202')

    const edge202 = edges.find(e => e.target === 'CASE-00202')
    expect(edge202?.level).toBe('WEAK')
    expect(edge202?.comparison.sharedLocationIds).toContain('L-001')
  })

  it('4. All-cases mode places all cases in a circle with exactly one edge per pair from findAllCaseLinks', () => {
    const { nodes, edges } = buildCaseMap(mockData, { minScore: 4 })
    const allExpectedLinks = findAllCaseLinks(mockData, 4)

    expect(nodes.length).toBe(mockData.cases.length)
    expect(edges.length).toBe(allExpectedLinks.length)

    // No duplicate edges and no self-links
    const seen = new Set<string>()
    for (const edge of edges) {
      expect(edge.source).not.toBe(edge.target)
      const key = [edge.source, edge.target].sort().join('|')
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }

    // Geometry test: all positions on a circle, zero overlaps
    const positions = layoutCaseMap(nodes, 'all')
    const posKeys = new Set<string>()
    for (const n of nodes) {
      const pos = positions[n.id]
      expect(pos).toBeDefined()
      const key = `${pos.x},${pos.y}`
      expect(posKeys.has(key)).toBe(false)
      posKeys.add(key)
    }
  })

  it('5. Detailed entity graph layout has larger collision radius and spacing without overlapping positions', () => {
    const graph = buildGraph(mockData)
    // Filter to CASE-00123 entities
    const case123People = mockData.persons.filter(p => p.relatedCases.includes('CASE-00123')).map(p => p.id)
    const subNodes = graph.nodes.filter(n => case123People.includes(n.id))
    const subEdges = graph.edges.filter(e => case123People.includes(e.source) && case123People.includes(e.target))

    const layout = computeLayout(subNodes, subEdges)
    expect(Object.keys(layout).length).toBe(subNodes.length)
  })
})

