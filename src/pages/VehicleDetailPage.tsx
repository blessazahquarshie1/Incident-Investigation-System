import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph, getNeighbors, getNodeType, getNodeEdges } from '../lib/graph'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import EntityIcon from '../components/EntityIcon'
import { getPersonName } from '../lib/lookup'
import type { EntityType } from '../types'

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const data = useInvestigationStore(s => s.data)
  const entity = data.vehicles.find(x => x.id === id)
  
  useEffect(() => {
    document.title = entity ? `${entity.registration} · Incident Investigation System` : 'Not Found · IIS'
  }, [entity])
  
  if (!entity) {
    return <EmptyState title="Not found" description="No record with this id." action={<Link to="/vehicles" className="text-blue-600 hover:underline">← Back to list</Link>} />
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
      <PageHeader title={entity.registration} description={`Vehicle Details: ${entity.id}`} />
      <Card title="Details">
        <div className="grid grid-cols-2 gap-4">
          <div><span className="font-semibold text-slate-500 block">Registration</span>{entity.registration}</div>
          <div><span className="font-semibold text-slate-500 block">Make</span>{entity.make}</div>
          <div><span className="font-semibold text-slate-500 block">Model</span>{entity.model}</div>
          <div><span className="font-semibold text-slate-500 block">Color</span>{entity.color}</div>
          <div><span className="font-semibold text-slate-500 block">Owner</span>{entity.ownerId ? <Link to={`/persons/${entity.ownerId}`} className="text-blue-600 hover:underline">{getPersonName(data, entity.ownerId)}</Link> : 'Unknown'}</div>
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
                        <div className="text-xs text-slate-500 truncate">{item.relationship}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
