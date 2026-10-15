import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph, getNeighbors, getNodeType, getNodeEdges } from '../lib/graph'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import EntityIcon from '../components/EntityIcon'
import { getVehicleOwner } from '../lib/lookup'
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

  const owner = getVehicleOwner(data, entity.id)
  
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
          <div>
            <span className="font-semibold text-slate-500 block">Owner</span>
            {owner ? (
              <Link to={`/persons/${owner.id}`} className="text-blue-600 hover:underline">
                {owner.fullName}
              </Link>
            ) : (
              'Unknown'
            )}
          </div>
        </div>
      </Card>

      {entity.id === 'V-001' && (
        <Card title="Investigation Context & History">
          <div className="rounded-lg bg-blue-50/80 border border-blue-200/70 p-4 space-y-2 text-[14px] text-blue-900">
            <p className="font-semibold text-blue-950">Vehicle Linkage & Background:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-900">
              <li>
                <strong>Reported Stolen:</strong> Originally registered to complainant <strong>Ama Boateng (P-004)</strong> and reported stolen from Cantonments in <em>CASE-00022 (Vehicle Theft)</em>.
              </li>
              <li>
                <strong>Syndicate Acquisition:</strong> Subsequently documented in possession of <strong>Kwame Asante (P-001)</strong> and operated by suspect <strong>Kofi Boateng (P-002)</strong> during armed robberies (<em>CASE-00123</em>, <em>CASE-00201</em>).
              </li>
              <li>
                <strong>ANPR Surveillance:</strong> Automated cameras logged sightings of this vehicle along Accra, Tema, and Kasoa corridors.
              </li>
            </ul>
          </div>
        </Card>
      )}

      <Card title="Linked to">
        <div className="space-y-4">
          {Object.entries(neighborsByType).map(([type, items]) => {
            if (items.length === 0) return null
            return (
              <div key={type}>
                <h4 className="text-sm font-semibold capitalize text-slate-600 mb-2 border-b pb-1">{type}s</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map(item => {
                    let note = item.relationship
                    if (entity.id === 'V-001') {
                      if (item.id === 'P-004') note = `${item.relationship} (Reported stolen in CASE-00022)`
                      else if (item.id === 'P-002') note = `${item.relationship} (Suspect driver in robberies)`
                      else if (item.id === 'P-001') note = `${item.relationship} (Syndicate possessor)`
                    }
                    return (
                      <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border">
                        <EntityIcon type={type as EntityType} />
                        <div className="flex-1 min-w-0">
                          <Link to={`/${type}s/${item.id}`} className="text-sm font-medium text-blue-600 hover:underline truncate block">{item.label}</Link>
                          <div className="text-[13px] text-slate-500 truncate" title={note}>{note}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
