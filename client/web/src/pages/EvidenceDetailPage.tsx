import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph, getNeighbors, getNodeType, getNodeEdges } from '../lib/graph'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import EntityIcon from '../components/EntityIcon'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../lib/dates'
import { getOfficerName, getLocationName } from '../lib/lookup'
import CustodySection from '../components/CustodySection'
import type { EntityType } from '../types'

export default function EvidenceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const data = useInvestigationStore(s => s.data)
  const entity = data.evidence.find(x => x.id === id)
  
  useEffect(() => {
    document.title = entity ? `${entity.title} · Incident Investigation System` : 'Not Found · IIS'
  }, [entity])
  
  if (!entity) {
    return <EmptyState title="Not found" description="No record with this id." action={<Link to="/evidence" className="text-blue-600 hover:underline">← Back to list</Link>} />
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
      <PageHeader title={entity.title} description={`Evidence Item: ${entity.id}`} />
      <Card title="Details">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><span className="font-semibold text-slate-500 block">Description</span>{entity.description}</div>
          <div><span className="font-semibold text-slate-500 block">Type</span>{entity.type}</div>
          <div><span className="font-semibold text-slate-500 block">Status</span><StatusBadge status={entity.status} /></div>
          <div><span className="font-semibold text-slate-500 block">Collected At</span>{formatDate(entity.collectedAt)}</div>
          <div><span className="font-semibold text-slate-500 block">Collected By</span>{getOfficerName(data, entity.collectedBy)}</div>
          <div><span className="font-semibold text-slate-500 block">Location</span>{entity.locationId ? <Link to={`/locations/${entity.locationId}`} className="text-blue-600 hover:underline">{getLocationName(data, entity.locationId)}</Link> : '—'}</div>
          <div><span className="font-semibold text-slate-500 block">Case</span><Link to={`/cases/${entity.caseId}`} className="text-blue-600 hover:underline">{entity.caseId}</Link></div>
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
      <CustodySection evidence={entity} />
    </div>
  )
}
