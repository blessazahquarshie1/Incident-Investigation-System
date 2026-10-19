import type { InvestigationData } from '../types'
import type { InvestigationNode, InvestigationEdge } from '../types'
import { buildGraph, getNeighbors } from './graph'

export interface ConnectionPath {
  nodes: InvestigationNode[]
  edges: InvestigationEdge[]
  length: number
}

/**
 * Finds ALL shortest connection paths between two individuals in the network graph.
 * If individuals share multiple direct links (e.g. a vehicle and a location), all
 * parallel paths of minimal length are returned so no shared entity is hidden.
 */
export function findAllShortestConnections(
  data: InvestigationData,
  startPersonId: string,
  targetPersonId: string
): ConnectionPath[] {
  // Edge case: same person
  if (startPersonId === targetPersonId) {
    const graph = buildGraph(data)
    const node = graph.nodes.find(n => n.id === startPersonId)
    if (!node) return []
    return [{ nodes: [node], edges: [], length: 0 }]
  }

  const graph = buildGraph(data)

  // Verify both nodes exist
  const startNode = graph.nodes.find(n => n.id === startPersonId)
  const targetNode = graph.nodes.find(n => n.id === targetPersonId)
  if (!startNode || !targetNode) return []

  const dist = new Map<string, number>()
  const parents = new Map<string, string[]>()
  dist.set(startPersonId, 0)
  parents.set(startPersonId, [])
  const queue: string[] = [startPersonId]
  let shortestDist: number | null = null

  while (queue.length > 0) {
    const current = queue.shift()!
    const d = dist.get(current)!

    if (shortestDist !== null && d >= shortestDist) {
      continue
    }

    for (const neighborId of getNeighbors(graph, current)) {
      if (!dist.has(neighborId)) {
        dist.set(neighborId, d + 1)
        parents.set(neighborId, [current])
        queue.push(neighborId)
        if (neighborId === targetPersonId) {
          shortestDist = d + 1
        }
      } else if (dist.get(neighborId) === d + 1) {
        parents.get(neighborId)!.push(current)
      }
    }
  }

  if (shortestDist === null) {
    return []
  }

  function getPaths(nodeId: string): string[][] {
    if (nodeId === startPersonId) {
      return [[startPersonId]]
    }
    const parList = parents.get(nodeId) || []
    const allSubPaths: string[][] = []
    for (const p of parList) {
      for (const sub of getPaths(p)) {
        allSubPaths.push([...sub, nodeId])
      }
    }
    return allSubPaths
  }

  const rawPaths = getPaths(targetPersonId)

  const paths: ConnectionPath[] = rawPaths.map(pathIds => {
    const nodes = pathIds.map(id => graph.nodes.find(n => n.id === id)!)
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
  })

  return paths
}

// BFS (Breadth-First Search) finds the shortest path between two nodes.
// Think of it like ripples in a pond: we explore all nodes 1 step away first,
// then 2 steps, then 3 — so the first time we reach the target, we have the fewest steps.
export function findShortestConnection(
  data: InvestigationData,
  startPersonId: string,
  targetPersonId: string
): ConnectionPath | null {
  const all = findAllShortestConnections(data, startPersonId, targetPersonId)
  return all.length > 0 ? all[0] : null
}

