import type { InvestigationData, InvestigationNode, InvestigationEdge, EntityType } from '../types'

export interface Graph {
  nodes: InvestigationNode[]
  edges: InvestigationEdge[]
}

export function getNodeType(id: string): EntityType | null {
  if (id.startsWith('P-')) return 'person'
  if (id.startsWith('I-')) return 'incident'
  if (id.startsWith('V-')) return 'vehicle'
  if (id.startsWith('E-')) return 'evidence'
  if (id.startsWith('L-')) return 'location'
  return null
}

export function buildGraph(data: InvestigationData): Graph {
  const nodes: InvestigationNode[] = [
    ...data.persons.map(p => ({ id: p.id, type: 'person' as EntityType, label: p.fullName })),
    ...data.incidents.map(i => ({ id: i.id, type: 'incident' as EntityType, label: i.title })),
    ...data.vehicles.map(v => ({ id: v.id, type: 'vehicle' as EntityType, label: `${v.registration} ${v.make}` })),
    ...data.evidence.map(e => ({ id: e.id, type: 'evidence' as EntityType, label: `${e.id} ${e.title}` })),
    ...data.locations.map(l => ({ id: l.id, type: 'location' as EntityType, label: l.name })),
  ]
  
  const nodeIds = new Set(nodes.map(n => n.id))
  
  const edgeSet = new Set<string>()
  const edges: InvestigationEdge[] = []
  
  function addEdge(edge: InvestigationEdge) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return
    const key = `${edge.source}|${edge.target}|${edge.relationship}`
    if (edgeSet.has(key)) return
    edgeSet.add(key)
    edges.push(edge)
  }
  
  for (const rel of data.relationships) {
    addEdge(rel)
  }
  
  for (const ev of data.evidence) {
    for (const pid of ev.linkedPersons) {
      addEdge({ source: pid, target: ev.id, relationship: 'connected-to' })
    }
    if (ev.locationId) {
      addEdge({ source: ev.id, target: ev.locationId, relationship: 'connected-to' })
    }
  }
  
  for (const inc of data.incidents) {
    addEdge({ source: inc.id, target: inc.locationId, relationship: 'connected-to' })
  }
  
  for (const v of data.vehicles) {
    if (v.ownerId) {
      addEdge({ source: v.ownerId, target: v.id, relationship: 'owns' })
    }
  }
  
  return { nodes, edges }
}

export function getNeighbors(graph: Graph, nodeId: string): string[] {
  const neighbors = new Set<string>()
  for (const edge of graph.edges) {
    if (edge.source === nodeId) neighbors.add(edge.target)
    if (edge.target === nodeId) neighbors.add(edge.source)
  }
  return Array.from(neighbors)
}

export function getNodeEdges(graph: Graph, nodeId: string): InvestigationEdge[] {
  return graph.edges.filter(e => e.source === nodeId || e.target === nodeId)
}

export function getLinkedCaseIds(data: InvestigationData, graph: Graph, nodeId: string): string[] {
  const caseIds = new Set<string>()
  const nodeType = getNodeType(nodeId)
  
  if (nodeType === 'person') {
    const person = data.persons.find(p => p.id === nodeId)
    if (person) person.relatedCases.forEach(c => caseIds.add(c))
  }
  
  if (nodeType === 'evidence') {
    const ev = data.evidence.find(e => e.id === nodeId)
    if (ev) caseIds.add(ev.caseId)
  }
  if (nodeType === 'incident') {
    const inc = data.incidents.find(i => i.id === nodeId)
    if (inc) caseIds.add(inc.caseId)
  }
  
  const neighbors = getNeighbors(graph, nodeId)
  for (const nid of neighbors) {
    const ntype = getNodeType(nid)
    if (ntype === 'person') {
      const p = data.persons.find(x => x.id === nid)
      if (p) p.relatedCases.forEach(c => caseIds.add(c))
    }
    if (ntype === 'evidence') {
      const e = data.evidence.find(x => x.id === nid)
      if (e) caseIds.add(e.caseId)
    }
    if (ntype === 'incident') {
      const i = data.incidents.find(x => x.id === nid)
      if (i) caseIds.add(i.caseId)
    }
  }
  
  return Array.from(caseIds).filter(Boolean)
}
