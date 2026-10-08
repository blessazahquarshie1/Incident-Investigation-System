import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph, getNeighbors, getNodeType, getNodeEdges } from '../lib/graph'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import EntityIcon from '../components/EntityIcon'
import EntityTypeBadge from '../components/EntityTypeBadge'
import type { EntityType } from '../types'
import { findConnections } from '../lib/connections'
import ConnectionScoreCard from '../components/ConnectionScoreCard'

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const data = useInvestigationStore(s => s.data)
  const entity = data.persons.find(x => x.id === id)
  
  useEffect(() => {
    document.title = entity ? `${entity.fullName} · Incident Investigation System` : 'Not Found · IIS'
  }, [entity])
  
  if (!entity) {
    return <EmptyState title="Not found" description="No record with this id." action={<Link to="/persons" className="text-blue-600 hover:underline">← Back to list</Link>} />
  }
  
  const graph = buildGraph(data)
  const neighborIds = getNeighbors(graph, entity.id)
  const nodeEdges = getNodeEdges(graph, entity.id)
  
  const neighborsByType: Record<EntityType, Array<{id: string, label: string, relationship: string}>> = {
    person: [], incident: [], vehicle: [], evidence: [], location: []
  }
  for (const nid of neighborIds) {
    const ntype = getNodeType(nid)
    if (!ntype) continue
    const edge = nodeEdges.find(e => e.source === nid || e.target === nid)
    const label = graph.nodes.find(n => n.id === nid)?.label ?? nid
    neighborsByType[ntype].push({ id: nid, label, relationship: edge?.relationship ?? 'connected-to' })
  }
  
  return (
    <div className="space-y-6">
      <PageHeader title={entity.fullName} description={`Person Profile: ${entity.id}`} />
      <Card title="Details">
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-semibold text-slate-500 block">Type</span><EntityTypeBadge type={entity.type} /></div>
          <div><span className="font-semibold text-slate-500 block">Phone</span>{entity.phone || '—'}</div>
          <div><span className="font-semibold text-slate-500 block">Address</span>{entity.address || '—'}</div>
          <div><span className="font-semibold text-slate-500 block">Aliases</span>{(entity.knownAliases || []).join(', ') || '—'}</div>
          <div><span className="font-semibold text-slate-500 block">Related Cases</span>
            {entity.relatedCases.map(cid => <div key={cid}><Link to={`/cases/${cid}`} className="text-blue-600 hover:underline">{cid}</Link></div>)}
          </div>
        </div>
      </Card>
      <Card title="Linked to">
        <div className="space-y-4">
          {Object.entries(neighborsByType).map(([type, items]) => {
            if (items.length === 0) return null
            return (
              <div key={type}>
                <h4 className="text-sm font-semibold capitalize text-slate-600 mb-2 border-b pb-1">{type}s</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border">
                      <EntityIcon type={type as EntityType} />
                      <div className="flex-1 min-w-0">
                        <Link to={`/${type}s/${item.id}`} className="text-sm font-medium text-blue-600 hover:underline truncate block">{item.label}</Link>
                        <div className="text-[13px] text-slate-500 truncate">{item.relationship}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      <div id="connections-section">
        <Card title="Connections">
          {(() => {
            const result = findConnections(data, entity.id)
            if (result.connections.length === 0) {
              return <EmptyState title="No connections" description="This person shares no common links with others." />
            }
            return (
              <div className="space-y-2">
                {result.connections.map(pair => (
                  <ConnectionScoreCard
                    key={`${pair.personAId}-${pair.personBId}`}
                    pair={pair}
                    personAName={data.persons.find(p => p.id === pair.personAId)?.fullName ?? pair.personAId}
                    personBName={data.persons.find(p => p.id === pair.personBId)?.fullName ?? pair.personBId}
                  />
                ))}
              </div>
            )
          })()}
        </Card>
      </div>
    </div>
  )
}
