import type { InvestigationData, EntityType } from '../types'
import type { Graph } from './graph'
import { getNeighbors, getLinkedCaseIds, getNodeType } from './graph'

// SearchResult entityType includes 'case' since cases are not in EntityType
export type SearchEntityType = EntityType | 'case'

export interface SearchResult {
  entityType: SearchEntityType
  id: string
  title: string
  subtitle: string
  score: number
  enrichment: Record<string, unknown>
}

// Normalise: lowercase, strip spaces and hyphens so GT-4521-23 matches gt452123
function normalise(s: string): string {
  return s.toLowerCase().replace(/[\s-]/g, '')
}

// Score a text against the query: exact=100, starts-with=60, word-starts-with=40, contains=20
function rankText(text: string, query: string): number {
  if (!text) return 0
  const t = normalise(text)
  const q = normalise(query)
  if (!q) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 60
  // check if any word within the text starts with the query
  if (t.split(/\W+/).some(w => w.startsWith(q) && w.length > 0)) return 40
  if (t.includes(q)) return 20
  return 0
}

function best(scores: number[]): number {
  return Math.max(0, ...scores)
}

export function searchAll(
  data: InvestigationData,
  graph: Graph,
  query: string
): SearchResult[] {
  if (query.trim().length < 2) return []

  const results: SearchResult[] = []

  // Persons
  for (const p of data.persons) {
    const score = best([
      rankText(p.fullName, query),
      p.phone ? rankText(p.phone, query) : 0,
      p.address ? rankText(p.address, query) : 0,
      ...(p.knownAliases ?? []).map(a => rankText(a, query)),
    ])
    if (score > 0) {
      const linkedCases = getLinkedCaseIds(data, graph, p.id)
      const linkedVehicles = data.vehicles
        .filter(v => v.ownerId === p.id ||
          data.relationships.some(r =>
            (r.source === p.id && r.target === v.id) ||
            (r.source === v.id && r.target === p.id)
          )
        )
        .map(v => v.registration)
      results.push({
        entityType: 'person',
        id: p.id,
        title: p.fullName,
        subtitle: `${p.type} — ${p.relatedCases.length} case(s)`,
        score,
        enrichment: {
          type: p.type,
          relatedCases: linkedCases,
          linkedVehicles,
          phone: p.phone ?? null,
          address: p.address ?? null,
        },
      })
    }
  }

  // Vehicles
  for (const v of data.vehicles) {
    const score = best([
      rankText(v.registration, query),
      rankText(v.make, query),
      rankText(v.model, query),
    ])
    if (score > 0) {
      const linkedCases = getLinkedCaseIds(data, graph, v.id)
      const linkedPersons = data.persons
        .filter(p =>
          p.id === v.ownerId ||
          data.relationships.some(r =>
            (r.source === p.id && r.target === v.id) ||
            (r.source === v.id && r.target === p.id)
          )
        )
        .map(p => p.fullName)
      // Seen locations: from sightings + visited neighbours
      const seenLocIds = new Set<string>()
      data.sightings.filter(s => s.vehicleId === v.id).forEach(s => seenLocIds.add(s.locationId))
      getNeighbors(graph, v.id).filter(nid => getNodeType(nid) === 'location').forEach(lid => seenLocIds.add(lid))
      const seenLocations = [...seenLocIds]
        .map(lid => data.locations.find(l => l.id === lid)?.name ?? lid)
      const owner = data.persons.find(p => p.id === v.ownerId)
      results.push({
        entityType: 'vehicle',
        id: v.id,
        title: `${v.registration} — ${v.make} ${v.model}`,
        subtitle: `${v.color}${owner ? `, owned by ${owner.fullName}` : ''}`,
        score,
        enrichment: { make: v.make, model: v.model, linkedCases, linkedPersons, seenLocations },
      })
    }
  }

  // Cases
  for (const c of data.cases) {
    const score = best([rankText(c.id, query), rankText(c.title, query)])
    if (score > 0) {
      results.push({
        entityType: 'case',
        id: c.id,
        title: c.title,
        subtitle: `${c.id} — ${c.status}, ${c.priority} priority`,
        score,
        enrichment: { status: c.status, priority: c.priority, type: c.type },
      })
    }
  }

  // Evidence
  for (const e of data.evidence) {
    const score = best([
      rankText(e.id, query),
      rankText(e.title, query),
      rankText(e.description, query),
    ])
    if (score > 0) {
      const c = data.cases.find(x => x.id === e.caseId)
      results.push({
        entityType: 'evidence',
        id: e.id,
        title: `${e.id} — ${e.title}`,
        subtitle: `${e.type} — ${e.status}`,
        score,
        enrichment: { case: c?.title ?? e.caseId, status: e.status, type: e.type },
      })
    }
  }

  // Incidents
  for (const i of data.incidents) {
    const score = best([rankText(i.id, query), rankText(i.title, query)])
    if (score > 0) {
      const loc = data.locations.find(l => l.id === i.locationId)
      results.push({
        entityType: 'incident',
        id: i.id,
        title: i.title,
        subtitle: `${i.type} — ${i.status} — ${loc?.name ?? i.locationId}`,
        score,
        enrichment: { status: i.status, type: i.type, location: loc?.name },
      })
    }
  }

  // Locations
  for (const l of data.locations) {
    const score = best([rankText(l.name, query), rankText(l.city, query)])
    if (score > 0) {
      const incidentCount = data.incidents.filter(i => i.locationId === l.id).length
      results.push({
        entityType: 'location',
        id: l.id,
        title: l.name,
        subtitle: `${l.city}, ${l.region} — ${incidentCount} incident(s)`,
        score,
        enrichment: { city: l.city, region: l.region, incidentCount },
      })
    }
  }

  // Phone records: match by phone number
  const phoneMatched = new Set<string>()
  for (const pr of data.phoneRecords) {
    const s = best([rankText(pr.phoneNumber, query), rankText(pr.otherNumber ?? '', query)])
    if (s > 0 && !phoneMatched.has(pr.personId)) {
      phoneMatched.add(pr.personId)
      // Add result for the person if not already added
      const existing = results.find(r => r.id === pr.personId)
      if (!existing) {
        const p = data.persons.find(x => x.id === pr.personId)
        if (p) {
          const linkedCases = getLinkedCaseIds(data, graph, p.id)
          results.push({
            entityType: 'person',
            id: p.id,
            title: p.fullName,
            subtitle: `${p.type} — matched via phone record`,
            score: s,
            enrichment: { type: p.type, relatedCases: linkedCases, phone: p.phone ?? pr.phoneNumber },
          })
        }
      }
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

// Route to detail page for a search result
export function getResultPath(result: SearchResult): string {
  switch (result.entityType) {
    case 'case': return `/cases/${result.id}`
    case 'person': return `/persons/${result.id}`
    case 'vehicle': return `/vehicles/${result.id}`
    case 'evidence': return `/evidence/${result.id}`
    case 'incident': return `/incidents/${result.id}`
    case 'location': return `/locations/${result.id}`
    default: return '/'
  }
}

