import type { InvestigationData } from '../types'
import type { InvestigationNode, InvestigationEdge } from '../types'
import { buildGraph, getNeighbors } from './graph'

export interface ConnectionPath {
  nodes: InvestigationNode[]
  edges: InvestigationEdge[]
  length: number
}

// BFS (Breadth-First Search) finds the shortest path between two nodes.
// Think of it like ripples in a pond: we explore all nodes 1 step away first,
// then 2 steps, then 3 — so the first time we reach the target, we have the fewest steps.
// We use a QUEUE (first-in, first-out) to process nodes in order.
export function findShortestConnection(
  data: InvestigationData,
  startPersonId: string,
  targetPersonId: string
): ConnectionPath | null {
  // Edge case: same person
  if (startPersonId === targetPersonId) {
    const graph = buildGraph(data)
    const node = graph.nodes.find(n => n.id === startPersonId)
    if (!node) return null
    return { nodes: [node], edges: [], length: 0 }
  }

  const graph = buildGraph(data)

  // Verify both nodes exist
  const startNode = graph.nodes.find(n => n.id === startPersonId)
  const targetNode = graph.nodes.find(n => n.id === targetPersonId)
  if (!startNode || !targetNode) return null

  // BFS: queue holds node ids to explore next
  const queue: string[] = [startPersonId]
  // visited: track which nodes we've already explored
  const visited = new Set<string>([startPersonId])
  // cameFrom: for each node, which node we reached it from (to reconstruct path)
  const cameFrom = new Map<string, string>()

  while (queue.length > 0) {
    const current = queue.shift()! // take from FRONT (FIFO queue)

    for (const neighborId of getNeighbors(graph, current)) {
      if (visited.has(neighborId)) continue

      visited.add(neighborId)
      cameFrom.set(neighborId, current)

      if (neighborId === targetPersonId) {
        // Found the target — reconstruct the path by walking back through cameFrom
        const pathIds: string[] = []
        let cur = neighborId
        while (cur !== undefined) {
          pathIds.push(cur)
          cur = cameFrom.get(cur)!
        }
        pathIds.reverse() // path was built backwards

        // Build nodes list
        const nodes = pathIds.map(id => graph.nodes.find(n => n.id === id)!)

        // Build edges list: for each consecutive pair in the path, find the edge
        const edges: InvestigationEdge[] = []
        for (let i = 0; i < pathIds.length - 1; i++) {
          const a = pathIds[i]
          const b = pathIds[i + 1]
          const edge = graph.edges.find(
            e => (e.source === a && e.target === b) || (e.source === b && e.target === a)
          )
          if (edge) edges.push(edge)
        }

        return { nodes, edges, length: pathIds.length - 1 }
      }

      queue.push(neighborId)
    }
  }

  // No path found
  return null
}
