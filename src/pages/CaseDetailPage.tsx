import React, { useMemo, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { getCasePeople, getCaseEvidence, getCaseIncidents, getCaseDocuments, getCaseNotes, getCaseVehicles, getCaseLocations, getCaseActivity } from '../lib/caseScope'
import { getOfficerName, getPersonName } from '../lib/lookup'
import { formatDate, formatDateTime } from '../lib/dates'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Tabs from '../components/Tabs'
import PriorityBadge from '../components/PriorityBadge'
import StatusBadge from '../components/StatusBadge'
import DataTable from '../components/DataTable'
import EmptyState from '../components/EmptyState'
import CaseTimelineTab from '../components/CaseTimelineTab'
import CaseConnectionsTab from '../components/CaseConnectionsTab'
import ActivityFeed from '../components/ActivityFeed'
import type { ActivityLogEntry } from '../types'

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const data = useInvestigationStore(s => s.data)
  const [params, setParams] = useSearchParams()
  const activeTab = params.get('tab') || 'overview'
  
  const kase = data.cases.find(c => c.id === caseId)
  
  if (!kase || !caseId) {
    return <EmptyState title="Not found" description="No case with this id." action={<Link to="/cases">← Back to cases</Link>} />
  }

  const people = useMemo(() => getCasePeople(data, caseId), [data, caseId])
  const evidence = useMemo(() => getCaseEvidence(data, caseId), [data, caseId])
  const incidents = useMemo(() => getCaseIncidents(data, caseId), [data, caseId])
  const documents = useMemo(() => getCaseDocuments(data, caseId), [data, caseId])
  const notes = useMemo(() => getCaseNotes(data, caseId), [data, caseId])
  const vehicles = useMemo(() => getCaseVehicles(data, caseId), [data, caseId])
  const locations = useMemo(() => getCaseLocations(data, caseId), [data, caseId])
  const activity = useMemo(() => getCaseActivity(data, caseId), [data, caseId])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'people', label: 'People' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'locations', label: 'Locations' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'connections', label: 'Connections' },
    { id: 'notes', label: 'Notes' },
    { id: 'activity', label: 'Activity' }
  ]

  function setTab(tabId: string) {
    setParams({ tab: tabId }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader title={kase.title} description={`Case ${kase.id} · Lead: ${getOfficerName(data, kase.leadInvestigator)}`} />
      
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setTab}>
        {activeTab === 'overview' && <OverviewTab kase={kase} incidents={incidents} documents={documents} />}
        {activeTab === 'people' && <PeopleTab people={people} />}
        {activeTab === 'evidence' && <EvidenceTab evidence={evidence} />}
        {activeTab === 'timeline' && <CaseTimelineTab caseId={caseId} />}
        {activeTab === 'locations' && <LocationsTab kase={kase} locations={locations} />}
        {activeTab === 'vehicles' && <VehiclesTab vehicles={vehicles} />}
        {activeTab === 'connections' && <CaseConnectionsTab caseId={caseId} />}
        {activeTab === 'notes' && <NotesTab kase={kase} notes={notes} />}
        {activeTab === 'activity' && <ActivityTab activity={activity} />}
      </Tabs>
    </div>
  )
}

function OverviewTab({ kase, incidents, documents }: any) {
  const changePriority = useInvestigationStore(s => s.changeCasePriority)
  const changeStatus = useInvestigationStore(s => s.changeCaseStatus)
  const [showPriMsg, setShowPriMsg] = useState(false)
  const [showStatMsg, setShowStatMsg] = useState(false)

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Details">
          <div className="space-y-4">
            <p className="text-slate-700">{kase.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="font-semibold text-slate-500 block">Type</span>{kase.type}</div>
              <div><span className="font-semibold text-slate-500 block">Created</span>{formatDate(kase.createdAt)}</div>
              <div><span className="font-semibold text-slate-500 block">Updated</span>{formatDate(kase.updatedAt)}</div>
            </div>
          </div>
        </Card>
        <Card title="Management">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <div className="flex gap-2 items-center">
                <select className="border p-2 rounded" value={kase.priority} onChange={e => { changePriority(kase.id, e.target.value as any); setShowPriMsg(true); setTimeout(() => setShowPriMsg(false), 3000) }}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
                <PriorityBadge priority={kase.priority} />
                {showPriMsg && <span className="text-green-600 text-sm">Priority updated.</span>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <div className="flex gap-2 items-center">
                <select className="border p-2 rounded" value={kase.status} onChange={e => { changeStatus(kase.id, e.target.value as any); setShowStatMsg(true); setTimeout(() => setShowStatMsg(false), 3000) }}>
                  <option value="open">Open</option><option value="closed">Closed</option><option value="cold">Cold</option>
                </select>
                <StatusBadge status={kase.status} />
                {showStatMsg && <span className="text-green-600 text-sm">Status updated.</span>}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Incidents">
        {incidents.length > 0 ? (
          <DataTable 
            columns={[
              { key: 'id', header: 'ID', render: (r: any) => <Link to={`/incidents/${r.id}`} className="text-blue-600 hover:underline">{r.id}</Link> },
              { key: 'title', header: 'Title', render: (r: any) => r.title },
              { key: 'occurredAt', header: 'Occurred At', render: (r: any) => formatDateTime(r.occurredAt) },
              { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> }
            ]} 
            rows={incidents} getRowKey={(r: any) => r.id} 
          />
        ) : <EmptyState title="No incidents" description="No incidents recorded for this case." />}
      </Card>
      
      <Card title="Documents">
        {documents.length > 0 ? (
          <ul className="divide-y border rounded">
            {documents.map((d: any) => (
              <li key={d.id} className="p-3 flex justify-between items-center">
                <div><div className="font-medium text-blue-600">{d.title}</div><div className="text-sm text-slate-500">{d.type}</div></div>
                <div className="text-sm text-slate-500">{formatDate(d.uploadedAt)}</div>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No documents" description="No documents uploaded." />}
      </Card>
    </div>
  )
}

function PeopleTab({ people }: any) {
  const byType: Record<string, any[]> = { suspect: [], witness: [], victim: [], 'person-of-interest': [] }
  people.forEach((p: any) => { if (byType[p.type]) byType[p.type].push(p) })

  return (
    <div className="space-y-6 pt-4">
      {Object.entries(byType).map(([type, list]) => (
        <Card key={type} title={type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ') + 's'}>
          {list.length > 0 ? (
            <DataTable 
              columns={[
                { key: 'name', header: 'Name', render: (r: any) => <Link to={`/persons/${r.id}`} className="text-blue-600 hover:underline">{r.fullName}</Link> },
                { key: 'phone', header: 'Phone', render: (r: any) => r.phone || '—' },
                { key: 'aliases', header: 'Aliases', render: (r: any) => (r.knownAliases || []).join(', ') || '—' }
              ]} 
              rows={list} getRowKey={(r: any) => r.id} 
            />
          ) : <div className="text-slate-500 text-sm">No {type}s recorded.</div>}
        </Card>
      ))}
    </div>
  )
}

function EvidenceTab({ evidence }: any) {
  const data = useInvestigationStore(s => s.data)
  return (
    <div className="space-y-6 pt-4">
      <Card title="Evidence">
        <DataTable 
          columns={[
            { key: 'id', header: 'ID', render: (r: any) => <Link to={`/evidence/${r.id}`} className="text-blue-600 hover:underline">{r.id}</Link> },
            { key: 'title', header: 'Title', render: (r: any) => r.title },
            { key: 'type', header: 'Type', render: (r: any) => r.type },
            { key: 'collectedAt', header: 'Collected', render: (r: any) => formatDate(r.collectedAt) },
            { key: 'collectedBy', header: 'Officer', render: (r: any) => getOfficerName(data, r.collectedBy) },
            { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> }
          ]} 
          rows={evidence} getRowKey={(r: any) => r.id} 
        />
      </Card>
    </div>
  )
}

function LocationsTab({ kase, locations }: any) {
  const data = useInvestigationStore(s => s.data)
  
  function getConnectionReason(locId: string): string {
    const reasons = []
    if (data.incidents.some(i => i.caseId === kase.id && i.locationId === locId)) reasons.push('Incident')
    if (data.evidence.some(e => e.caseId === kase.id && e.locationId === locId)) reasons.push('Evidence')
    if (data.sightings.some(s => s.caseId === kase.id && s.locationId === locId)) reasons.push('Sighting')
    const casePeople = getCasePeople(data, kase.id)
    if (data.relationships.some(r => r.relationship === 'visited' && r.target === locId && casePeople.some(p => p.id === r.source))) reasons.push('Person visited')
    return reasons.join(', ') || 'Connected'
  }

  return (
    <div className="space-y-6 pt-4">
      <Card title="Locations">
        <DataTable 
          columns={[
            { key: 'name', header: 'Name', render: (r: any) => <Link to={`/locations/${r.id}`} className="text-blue-600 hover:underline">{r.name}</Link> },
            { key: 'city', header: 'City', render: (r: any) => r.city },
            { key: 'reason', header: 'Connected Via', render: (r: any) => getConnectionReason(r.id) }
          ]} 
          rows={locations} getRowKey={(r: any) => r.id} 
        />
      </Card>
    </div>
  )
}

function VehiclesTab({ vehicles }: any) {
  const data = useInvestigationStore(s => s.data)
  return (
    <div className="space-y-6 pt-4">
      <Card title="Vehicles">
        <DataTable 
          columns={[
            { key: 'reg', header: 'Registration', render: (r: any) => <Link to={`/vehicles/${r.id}`} className="text-blue-600 hover:underline">{r.registration}</Link> },
            { key: 'make', header: 'Make/Model', render: (r: any) => `${r.make} ${r.model}` },
            { key: 'owner', header: 'Owner', render: (r: any) => r.ownerId ? getPersonName(data, r.ownerId) : 'Unknown' }
          ]} 
          rows={vehicles} getRowKey={(r: any) => r.id} 
        />
      </Card>
    </div>
  )
}

function NotesTab({ kase, notes }: any) {
  const addNote = useInvestigationStore(s => s.addNote)
  const data = useInvestigationStore(s => s.data)
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text) return
    addNote(kase.id, text)
    setText('')
  }

  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-6 pt-4">
      <Card title="Add Note">
        <form onSubmit={handleSubmit} className="flex gap-2 flex-col">
          <textarea className="w-full border p-2 rounded" rows={3} value={text} onChange={e => setText(e.target.value)} required />
          <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Post Note</button></div>
        </form>
      </Card>
      <div className="space-y-4">
        {sorted.map(n => (
          <Card key={n.id} title={getOfficerName(data, n.authorId)}>
            <div className="text-xs text-slate-500 mb-2">{formatDateTime(n.createdAt)}</div>
            <div className="text-slate-800 whitespace-pre-wrap">{n.text}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ActivityTab({ activity }: { activity: ActivityLogEntry[] }) {
  const [filter, setFilter] = useState('')
  
  const filtered = useMemo(() => {
    return filter ? activity.filter(a => a.action === filter) : activity
  }, [activity, filter])

  const actionTypes = useMemo(() => {
    return Array.from(new Set(activity.map(a => a.action)))
  }, [activity])

  return (
    <div className="space-y-6 pt-4">
      <div className="flex gap-2 items-center">
        <label className="text-[13px] font-medium text-slate-700">Filter by action:</label>
        <select
          className="border border-slate-200 bg-white p-2 rounded-lg text-[13px] focus:border-blue-500 focus:outline-none"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="">All actions ({activity.length})</option>
          {actionTypes.map(act => (
            <option key={act} value={act}>{act}</option>
          ))}
        </select>
      </div>
      <ActivityFeed entries={filtered} emptyMessage="No activity matches this filter." />
    </div>
  )
}
