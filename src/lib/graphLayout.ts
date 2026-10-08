import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import type { InvestigationNode, InvestigationEdge } from '../types'

interface LayoutNode extends SimulationNodeDatum {
  id: string
}

interface LayoutLink extends SimulationLinkDatum<LayoutNode> {
  source: string | LayoutNode
  target: string | LayoutNode
}

/**
 * Computes 2D positions for investigation graph nodes using a force simulation.
 * 
 * Plain-English analogy:
 * Think of the graph as a physical model:
 * - Nodes repel each other like magnets (many-body charge force).
 * - Connected edges pull nodes together like springs (link distance and strength).
 * - Collision spheres prevent labels from colliding or overlapping.
 * - The picture settles into a balanced equilibrium where all forces cancel out.
 * 
 * We run 300 simulation ticks synchronously up front rather than animating live,
 * so the investigator instantly receives a clean, stable layout without distracting jitter.
 * Initial positions are seeded deterministically based on node index on a circle,
 * ensuring identical inputs always yield identical coordinates without random drifting.
 */
export function computeLayout(
  nodes: InvestigationNode[],
  edges: InvestigationEdge[]
): Record<string, { x: number; y: number }> {
  if (nodes.length === 0) {
    return {}
  }

  const width = 800
  const height = 600
  const centerX = width / 2
  const centerY = height / 2

  // Seed deterministic positions along a circle
  const radius = Math.min(centerX, centerY) * 0.7
  const simulationNodes: LayoutNode[] = nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / (nodes.length || 1)
    return {
      id: node.id,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })

  // Valid node ID lookup set
  const nodeIdSet = new Set(nodes.map(n => n.id))

  // Filter links to only those where both source and target exist
  const simulationLinks: LayoutLink[] = edges
    .filter(e => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
    .map(e => ({
      source: e.source,
      target: e.target,
    }))

  const simulation = forceSimulation<LayoutNode>(simulationNodes)
    .force(
      'link',
      forceLink<LayoutNode, LayoutLink>(simulationLinks)
        .id(d => d.id)
        .distance(120)
    )
    .force('charge', forceManyBody<LayoutNode>().strength(-450))
    .force('center', forceCenter<LayoutNode>(centerX, centerY))
    .force('collide', forceCollide<LayoutNode>().radius(55))
    .stop()

  // Run synchronously for 300 ticks to let forces settle
  for (let i = 0; i < 300; i++) {
    simulation.tick()
  }

  const positions: Record<string, { x: number; y: number }> = {}
  for (const sn of simulationNodes) {
    positions[sn.id] = {
      x: Math.round(sn.x ?? centerX),
      y: Math.round(sn.y ?? centerY),
    }
  }

  return positions
}
