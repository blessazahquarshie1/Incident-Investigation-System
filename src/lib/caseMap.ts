import type { InvestigationData, Case } from '../types'
import {
  findRelatedCases,
  findAllCaseLinks,
  describeSharedShort,
  type CaseComparison,
  type ComparisonLevel,
} from './caseComparison'

/**
 * CaseMapNode represents a single case rendered as a circle in the Case map.
 */
export interface CaseMapNode {
  id: string
  title: string
  status: Case['status']
  priority: Case['priority']
  isPast: boolean
  isCentre: boolean
}

/**
 * CaseMapEdge represents a shared connection link between two cases in the Case map.
 */
export interface CaseMapEdge {
  id: string
  source: string
  target: string
  score: number
  level: ComparisonLevel
  label: string
  sharedShort: string[]
  comparison: CaseComparison
}

export interface CaseMapData {
  nodes: CaseMapNode[]
  edges: CaseMapEdge[]
}

export interface BuildCaseMapOptions {
  focusCaseId?: string
  minScore?: number
}

/**
 * Builds the nodes and edges for the Case map view.
 * 
 * Plain-English explanation:
 * In "focus" mode, one selected case sits in the centre like the sun, and every
 * related case orbits around it like planets, linked by connection lines.
 * In "all cases" mode, every case in the system is arranged on a large circular ring,
 * and lines criss-cross between cases that share people, cars, phones, or methods.
 * 
 * @param data Complete investigation mock data
 * @param options Configuration: focusCaseId (for single case focus) and minScore (default 4)
 */
export function buildCaseMap(
  data: InvestigationData,
  options: BuildCaseMapOptions = {}
): CaseMapData {
  const { focusCaseId, minScore = 4 } = options

  // 1. FOCUS MODE: Focus on one case in the centre
  if (focusCaseId) {
    const centreCase = data.cases.find(c => c.id === focusCaseId)
    if (!centreCase) {
      return { nodes: [], edges: [] }
    }

    const centreNode: CaseMapNode = {
      id: centreCase.id,
      title: centreCase.title,
      status: centreCase.status,
      priority: centreCase.priority,
      isPast: centreCase.status === 'closed',
      isCentre: true,
    }

    // Retrieve related cases and filter by minimum score threshold
    const related = findRelatedCases(data, focusCaseId).filter(
      r => r.score >= minScore
    )

    const nodes: CaseMapNode[] = [centreNode]
    const edges: CaseMapEdge[] = []

    for (const comp of related) {
      const otherCase = data.cases.find(c => c.id === comp.caseBId)
      if (!otherCase) continue

      nodes.push({
        id: otherCase.id,
        title: otherCase.title,
        status: otherCase.status,
        priority: otherCase.priority,
        isPast: otherCase.status === 'closed',
        isCentre: false,
      })

      const shortPhrases = describeSharedShort(comp)
      edges.push({
        id: `case-map-edge-${focusCaseId}-${comp.caseBId}`,
        source: focusCaseId,
        target: comp.caseBId,
        score: comp.score,
        level: comp.level,
        label: shortPhrases.join(' · '),
        sharedShort: shortPhrases,
        comparison: comp,
      })
    }

    return { nodes, edges }
  }

  // 2. ALL CASES MODE: Every case on a big circle
  const nodes: CaseMapNode[] = data.cases.map(c => ({
    id: c.id,
    title: c.title,
    status: c.status,
    priority: c.priority,
    isPast: c.status === 'closed',
    isCentre: false,
  }))

  const allLinks = findAllCaseLinks(data, minScore)
  const edges: CaseMapEdge[] = allLinks.map(link => {
    const shortPhrases = describeSharedShort(link)
    return {
      id: `case-map-edge-${link.caseAId}-${link.caseBId}`,
      source: link.caseAId,
      target: link.caseBId,
      score: link.score,
      level: link.level,
      label: shortPhrases.join(' · '),
      sharedShort: shortPhrases,
      comparison: link,
    }
  })

  return { nodes, edges }
}

/**
 * Computes neat 2D positions for nodes using deterministic circle geometry.
 * 
 * Plain-English analogy:
 * Instead of letting a physics engine wobble and shake nodes into random positions,
 * we use simple clock-face trigonometry.
 * - Focus mode: The centre case sits at (400, 300). Surrounding cases are placed
 *   like the hours on a clock face at equal angle steps.
 * - All cases mode: All cases are placed along one large perimeter circle.
 * 
 * This guarantees the map looks identical and orderly every time with zero overlaps.
 * 
 * @param nodes List of case nodes to layout
 * @param mode 'focus' for radial around centre; 'all' for single perimeter circle
 */
export function layoutCaseMap(
  nodes: CaseMapNode[],
  mode?: 'focus' | 'all'
): Record<string, { x: number; y: number }> {
  if (nodes.length === 0) {
    return {}
  }

  const centerX = 400
  const centerY = 300
  const effectiveMode = mode ?? (nodes.some(n => n.isCentre) ? 'focus' : 'all')

  const positions: Record<string, { x: number; y: number }> = {}

  // Layout A: Radial Focus Mode
  if (effectiveMode === 'focus') {
    const centreNode = nodes.find(n => n.isCentre) ?? nodes[0]
    positions[centreNode.id] = { x: centerX, y: centerY }

    const surroundingNodes = nodes.filter(n => n.id !== centreNode.id)
    const count = surroundingNodes.length

    if (count > 0) {
      const radius = Math.max(300, count * 45)
      for (let i = 0; i < count; i++) {
        // Start from top (-90 degrees / -PI/2) and space evenly clockwise
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / count
        positions[surroundingNodes[i].id] = {
          x: Math.round(centerX + radius * Math.cos(angle)),
          y: Math.round(centerY + radius * Math.sin(angle)),
        }
      }
    }

    return positions
  }

  // Layout B: Single Big Circle Mode
  const count = nodes.length
  if (count === 1) {
    positions[nodes[0].id] = { x: centerX, y: centerY }
    return positions
  }

  const radius = Math.max(340, count * 35)
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count
    positions[nodes[i].id] = {
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle)),
    }
  }

  return positions
}

