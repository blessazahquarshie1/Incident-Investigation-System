import React, { useMemo, useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useInvestigationStore } from '../store/useInvestigationStore'
import {
  getCasePeople,
  getCaseEvidence,
  getCaseIncidents,
  getCaseDocuments,
  getCaseNotes,
  getCaseVehicles,
  getCaseLocations,
  getCaseActivity,
} from '../lib/caseScope'
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
import AddIncidentModal from '../components/AddIncidentModal'
import AddDocumentModal from '../components/AddDocumentModal'
import ChangeLeadInvestigatorModal from '../components/ChangeLeadInvestigatorModal'
import AddPersonModal from '../components/AddPersonModal'
import AddConnectionModal from '../components/AddConnectionModal'
import UploadEvidenceModal from '../components/UploadEvidenceModal'
import AddLocationToCaseModal from '../components/AddLocationToCaseModal'
import AddNewVehicleModal from '../components/AddNewVehicleModal'
import type {
  ActivityLogEntry,
  Case,
  Incident,
  CaseDocument,
  Person,
  Evidence,
  Location,
  Vehicle,
  Note,
} from '../types'

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const data = useInvestigationStore(s => s.data)
  const [params, setParams] = useSearchParams()
  const activeTab = params.get('tab') || 'overview'

  const kase = data.cases.find(c => c.id === caseId)

  useEffect(() => {
    document.title = kase ? `${kase.id}: ${kase.title} · Incident Investigation System` : 'Case Not Found · IIS'
  }, [kase])

  const people = useMemo(() => (caseId ? getCasePeople(data, caseId) : []), [data, caseId])
  const evidence = useMemo(() => (caseId ? getCaseEvidence(data, caseId) : []), [data, caseId])
  const incidents = useMemo(() => (caseId ? getCaseIncidents(data, caseId) : []), [data, caseId])
  const documents = useMemo(() => (caseId ? getCaseDocuments(data, caseId) : []), [data, caseId])
  const notes = useMemo(() => (caseId ? getCaseNotes(data, caseId) : []), [data, caseId])
  const vehicles = useMemo(() => (caseId ? getCaseVehicles(data, caseId) : []), [data, caseId])
  const locations = useMemo(() => (caseId ? getCaseLocations(data, caseId) : []), [data, caseId])
  const activity = useMemo(() => (caseId ? getCaseActivity(data, caseId) : []), [data, caseId])

  if (!kase || !caseId) {
    return (
      <EmptyState
        title="Not found"
        description="No case with this id."
        action={<Link to="/cases">← Back to cases</Link>}
      />
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'people', label: 'People' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'locations', label: 'Locations' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'connections', label: 'Connections' },
    { id: 'notes', label: 'Notes' },
    { id: 'activity', label: 'Activity' },
  ]

  function setTab(tabId: string) {
    setParams({ tab: tabId }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={kase.title}
        description={`Case ${kase.id} · Lead: ${getOfficerName(data, kase.leadInvestigator)}`}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setTab}>
        {activeTab === 'overview' && (
          <OverviewTab kase={kase} incidents={incidents} documents={documents} />
        )}
        {activeTab === 'people' && <PeopleTab kase={kase} people={people} />}
        {activeTab === 'evidence' && <EvidenceTab kase={kase} evidence={evidence} />}
        {activeTab === 'timeline' && <CaseTimelineTab caseId={caseId} />}
        {activeTab === 'locations' && <LocationsTab kase={kase} locations={locations} />}
        {activeTab === 'vehicles' && <VehiclesTab kase={kase} vehicles={vehicles} />}
        {activeTab === 'connections' && <CaseConnectionsTab caseId={caseId} />}
        {activeTab === 'notes' && <NotesTab kase={kase} notes={notes} />}
        {activeTab === 'activity' && <ActivityTab activity={activity} />}
      </Tabs>
    </div>
  )
}

function OverviewTab({
  kase,
  incidents,
  documents,
}: {
  kase: Case
  incidents: Incident[]
  documents: CaseDocument[]
}) {
  const data = useInvestigationStore(s => s.data)
  const changePriority = useInvestigationStore(s => s.changeCasePriority)
  const changeStatus = useInvestigationStore(s => s.changeCaseStatus)
  const [showPriMsg, setShowPriMsg] = useState(false)
  const [showStatMsg, setShowStatMsg] = useState(false)

  const [isAddIncidentOpen, setIsAddIncidentOpen] = useState(false)
  const [isAddDocOpen, setIsAddDocOpen] = useState(false)
  const [isChangeLeadOpen, setIsChangeLeadOpen] = useState(false)

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Details">
          <div className="space-y-4">
            <p className="text-slate-700">{kase.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold text-slate-500 block text-[13px]">Type</span>
                <span className="text-[15px]">{kase.type}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block text-[13px]">Created</span>
                <span className="text-[15px]">{formatDate(kase.createdAt)}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block text-[13px]">Updated</span>
                <span className="text-[15px]">{formatDate(kase.updatedAt)}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block text-[13px]">Lead Investigator</span>
                <span className="text-[15px] font-medium text-slate-900">
                  {getOfficerName(data, kase.leadInvestigator)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Management">
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-medium mb-1">Priority</label>
              <div className="flex gap-2 items-center">
                <select
                  className="border border-slate-200 p-2 rounded-lg text-base focus:border-blue-500 focus:outline-none"
                  value={kase.priority}
                  onChange={e => {
                    changePriority(kase.id, e.target.value as Case['priority'])
                    setShowPriMsg(true)
                    setTimeout(() => setShowPriMsg(false), 3000)
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <PriorityBadge priority={kase.priority} />
                {showPriMsg && <span className="text-green-600 text-sm">Priority updated.</span>}
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-medium mb-1">Status</label>
              <div className="flex gap-2 items-center">
                <select
                  className="border border-slate-200 p-2 rounded-lg text-base focus:border-blue-500 focus:outline-none"
                  value={kase.status}
                  onChange={e => {
                    changeStatus(kase.id, e.target.value as Case['status'])
                    setShowStatMsg(true)
                    setTimeout(() => setShowStatMsg(false), 3000)
                  }}
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                </select>
                <StatusBadge status={kase.status} />
                {showStatMsg && <span className="text-green-600 text-sm">Status updated.</span>}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="block text-[13px] text-slate-500 font-medium">Lead Investigator</span>
                <span className="text-[15px] font-medium text-slate-800">
                  {getOfficerName(data, kase.leadInvestigator)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeLeadOpen(true)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Change lead investigator
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Incidents Section */}
      <Card title="Incidents">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[14px] text-slate-500">Documented incidents associated with this investigation.</p>
            <button
              type="button"
              onClick={() => setIsAddIncidentOpen(true)}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-[14px] font-medium text-white hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add incident
            </button>
          </div>

          {incidents.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: 'id',
                  header: 'ID',
                  render: (r: Incident) => (
                    <Link to={`/incidents/${r.id}`} className="text-blue-600 hover:underline">
                      {r.id}
                    </Link>
                  ),
                },
                { key: 'title', header: 'Title', render: (r: Incident) => r.title },
                {
                  key: 'occurredAt',
                  header: 'Occurred At',
                  render: (r: Incident) => formatDateTime(r.occurredAt),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r: Incident) => <StatusBadge status={r.status} />,
                },
              ]}
              rows={incidents}
              getRowKey={(r: Incident) => r.id}
            />
          ) : (
            <EmptyState
              title="No incidents"
              description="No incidents recorded for this case."
              action={
                <button
                  type="button"
                  onClick={() => setIsAddIncidentOpen(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700"
                >
                  Add incident
                </button>
              }
            />
          )}
        </div>
      </Card>

      {/* Documents Section */}
      <Card title="Documents">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[14px] text-slate-500">Reports, warrants, court orders, and statements.</p>
            <button
              type="button"
              onClick={() => setIsAddDocOpen(true)}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-[14px] font-medium text-white hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add document
            </button>
          </div>

          {documents.length > 0 ? (
            <ul className="divide-y border border-slate-200 rounded-lg">
              {documents.map((d: CaseDocument) => (
                <li key={d.id} className="p-3.5 flex justify-between items-center bg-white hover:bg-slate-50">
                  <div>
                    <div className="font-medium text-blue-600 text-[15px]">{d.title}</div>
                    <div className="text-[13px] text-slate-500 capitalize">{d.kind}</div>
                  </div>
                  <div className="text-[13px] text-slate-500">{formatDate(d.uploadedAt)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No documents"
              description="No documents uploaded for this case."
              action={
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700"
                >
                  Add document
                </button>
              }
            />
          )}
        </div>
      </Card>

      <AddIncidentModal
        isOpen={isAddIncidentOpen}
        onClose={() => setIsAddIncidentOpen(false)}
        caseId={kase.id}
        defaultType={kase.type}
      />

      <AddDocumentModal
        isOpen={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
        caseId={kase.id}
      />

      <ChangeLeadInvestigatorModal
        isOpen={isChangeLeadOpen}
        onClose={() => setIsChangeLeadOpen(false)}
        caseId={kase.id}
        currentLeadId={kase.leadInvestigator}
      />
    </div>
  )
}

function PeopleTab({ kase, people }: { kase: Case; people: Person[] }) {
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false)
  const [connectionPersonId, setConnectionPersonId] = useState<string | null>(null)

  const byType: Record<string, Person[]> = {
    suspect: [],
    witness: [],
    victim: [],
    'person-of-interest': [],
  }
  people.forEach((p: Person) => {
    if (byType[p.type]) byType[p.type].push(p)
  })

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900">Case Persons</h3>
          <p className="text-[14px] text-slate-500">Individuals linked to this investigation.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddPersonOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add person to case
        </button>
      </div>

      {people.length === 0 ? (
        <EmptyState
          title="No people linked"
          description="Add suspects, witnesses, victims, or persons of interest to begin linking evidence and timelines."
          action={
            <button
              type="button"
              onClick={() => setIsAddPersonOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700"
            >
              Add person to case
            </button>
          }
        />
      ) : (
        Object.entries(byType).map(([type, list]) => (
          <Card key={type} title={type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ') + 's'}>
            {list.length > 0 ? (
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: 'Name',
                    render: (r: Person) => (
                      <Link to={`/persons/${r.id}`} className="text-blue-600 hover:underline">
                        {r.fullName}
                      </Link>
                    ),
                  },
                  { key: 'phone', header: 'Phone', render: (r: Person) => r.phone || '—' },
                  {
                    key: 'aliases',
                    header: 'Aliases',
                    render: (r: Person) => (r.knownAliases || []).join(', ') || '—',
                  },
                  {
                    key: 'actions',
                    header: '',
                    render: (r: Person) => (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          setConnectionPersonId(r.id)
                        }}
                        className="text-[13px] text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        + Add connection
                      </button>
                    ),
                  },
                ]}
                rows={list}
                getRowKey={(r: Person) => r.id}
              />
            ) : (
              <div className="text-slate-500 text-[14px]">No {type.replace('-', ' ')}s recorded.</div>
            )}
          </Card>
        ))
      )}

      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => setIsAddPersonOpen(false)}
        caseId={kase.id}
      />

      <AddConnectionModal
        isOpen={!!connectionPersonId}
        onClose={() => setConnectionPersonId(null)}
        caseId={kase.id}
        initialPersonId={connectionPersonId || undefined}
      />
    </div>
  )
}

function EvidenceTab({ kase, evidence }: { kase: Case; evidence: Evidence[] }) {
  const data = useInvestigationStore(s => s.data)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900">Case Evidence</h3>
          <p className="text-[14px] text-slate-500">Physical and digital evidence items with chain of custody tracking.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Upload evidence
        </button>
      </div>

      <Card title="Evidence Items">
        {evidence.length > 0 ? (
          <DataTable
            columns={[
              {
                key: 'id',
                header: 'ID',
                render: (r: Evidence) => (
                  <Link to={`/evidence/${r.id}`} className="text-blue-600 hover:underline">
                    {r.id}
                  </Link>
                ),
              },
              { key: 'title', header: 'Title', render: (r: Evidence) => r.title },
              { key: 'type', header: 'Type', render: (r: Evidence) => r.type },
              { key: 'collectedAt', header: 'Collected', render: (r: Evidence) => formatDate(r.collectedAt) },
              {
                key: 'collectedBy',
                header: 'Officer',
                render: (r: Evidence) => getOfficerName(data, r.collectedBy),
              },
              { key: 'status', header: 'Status', render: (r: Evidence) => <StatusBadge status={r.status} /> },
            ]}
            rows={evidence}
            getRowKey={(r: Evidence) => r.id}
          />
        ) : (
          <EmptyState
            title="No evidence items"
            description="No evidence has been uploaded for this case yet."
            action={
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700"
              >
                Upload evidence
              </button>
            }
          />
        )}
      </Card>

      <UploadEvidenceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        caseId={kase.id}
      />
    </div>
  )
}

function LocationsTab({ kase, locations }: { kase: Case; locations: Location[] }) {
  const data = useInvestigationStore(s => s.data)
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false)

  function getConnectionReason(locId: string): string {
    const reasons = []
    if (data.incidents.some(i => i.caseId === kase.id && i.locationId === locId)) reasons.push('Incident')
    if (data.evidence.some(e => e.caseId === kase.id && e.locationId === locId)) reasons.push('Evidence')
    if (data.sightings.some(s => s.caseId === kase.id && s.locationId === locId)) reasons.push('Sighting')
    const casePeople = getCasePeople(data, kase.id)
    if (
      data.relationships.some(
        r => r.relationship === 'visited' && r.target === locId && casePeople.some(p => p.id === r.source)
      )
    ) {
      reasons.push('Person visited')
    }
    return reasons.join(', ') || 'Connected'
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900">Case Locations</h3>
          <p className="text-[14px] text-slate-500">Geographic footprint from incidents, visits, evidence, and sightings.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddLocationOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add location
        </button>
      </div>

      <Card title="Locations">
        {locations.length > 0 ? (
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Name',
                render: (r: Location) => (
                  <Link to={`/locations/${r.id}`} className="text-blue-600 hover:underline">
                    {r.name}
                  </Link>
                ),
              },
              { key: 'city', header: 'City', render: (r: Location) => r.city },
              { key: 'reason', header: 'Connected Via', render: (r: Location) => getConnectionReason(r.id) },
            ]}
            rows={locations}
            getRowKey={(r: Location) => r.id}
          />
        ) : (
          <EmptyState
            title="No locations"
            description="No locations currently associated with this case."
            action={
              <button
                type="button"
                onClick={() => setIsAddLocationOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700"
              >
                Add location
              </button>
            }
          />
        )}
      </Card>

      <AddLocationToCaseModal
        isOpen={isAddLocationOpen}
        onClose={() => setIsAddLocationOpen(false)}
        caseId={kase.id}
      />
    </div>
  )
}

function VehiclesTab({ kase, vehicles }: { kase: Case; vehicles: Vehicle[] }) {
  const data = useInvestigationStore(s => s.data)
  const linkVehicleToPerson = useInvestigationStore(s => s.linkVehicleToPerson)

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const casePeople = useMemo(() => getCasePeople(data, kase.id), [data, kase.id])

  const [linkVehId, setLinkVehId] = useState(data.vehicles[0]?.id || '')
  const [linkPersonId, setLinkPersonId] = useState('')
  const [linkRel, setLinkRel] = useState<'owns' | 'connected-to'>('connected-to')
  const [linkSuccess, setLinkSuccess] = useState('')

  const effectivePersonId = linkPersonId || casePeople[0]?.id || ''

  function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!linkVehId || !effectivePersonId) return
    linkVehicleToPerson(kase.id, linkVehId, effectivePersonId, linkRel)
    setLinkSuccess('Vehicle linked to person successfully.')
    setTimeout(() => setLinkSuccess(''), 3000)
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-[18px] font-semibold text-slate-900">Case Vehicles</h3>
          <p className="text-[14px] text-slate-500">Vehicles owned, connected to persons, or involved in incidents.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddVehicleOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add new vehicle
        </button>
      </div>

      <Card title="Vehicles">
        {vehicles.length > 0 ? (
          <DataTable
            columns={[
              {
                key: 'reg',
                header: 'Registration',
                render: (r: Vehicle) => (
                  <Link to={`/vehicles/${r.id}`} className="text-blue-600 hover:underline">
                    {r.registration}
                  </Link>
                ),
              },
              { key: 'make', header: 'Make/Model', render: (r: Vehicle) => `${r.make} ${r.model}` },
              {
                key: 'owner',
                header: 'Owner',
                render: (r: Vehicle) => (r.ownerId ? getPersonName(data, r.ownerId) : 'Unknown'),
              },
            ]}
            rows={vehicles}
            getRowKey={(r: Vehicle) => r.id}
          />
        ) : (
          <EmptyState
            title="No vehicles"
            description="No vehicles currently associated with this case."
            action={
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700"
              >
                Add new vehicle
              </button>
            }
          />
        )}
      </Card>

      {/* Link Existing Vehicle Card */}
      {casePeople.length > 0 && (
        <Card title="Link Existing Vehicle to Person">
          <form onSubmit={handleLinkSubmit} className="space-y-4">
            {linkSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-[14px] text-green-700">
                {linkSuccess}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">
                  Existing Vehicle
                </label>
                <select
                  value={linkVehId}
                  onChange={e => setLinkVehId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                >
                  {data.vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration} — {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">
                  Case Person
                </label>
                <select
                  value={effectivePersonId}
                  onChange={e => setLinkPersonId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                >
                  {casePeople.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">
                  Relationship
                </label>
                <select
                  value={linkRel}
                  onChange={e => setLinkRel(e.target.value as 'owns' | 'connected-to')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
                >
                  <option value="connected-to">connected-to</option>
                  <option value="owns">owns</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700"
              >
                Link Vehicle
              </button>
            </div>
          </form>
        </Card>
      )}

      <AddNewVehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        caseId={kase.id}
      />
    </div>
  )
}

function NotesTab({ kase, notes }: { kase: Case; notes: Note[] }) {
  const addNote = useInvestigationStore(s => s.addNote)
  const data = useInvestigationStore(s => s.data)
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    addNote(kase.id, text.trim())
    setText('')
  }

  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-6 pt-4">
      <Card title="Add Note">
        <form onSubmit={handleSubmit} className="flex gap-3 flex-col">
          <textarea
            className="w-full border border-slate-200 p-2.5 rounded-lg text-base focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Record investigative observation or internal note..."
            value={text}
            onChange={e => setText(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[14px] font-medium hover:bg-blue-700"
            >
              Post Note
            </button>
          </div>
        </form>
      </Card>
      <div className="space-y-4">
        {sorted.map(n => (
          <Card key={n.id} title={getOfficerName(data, n.authorId)}>
            <div className="text-[13px] text-slate-500 mb-2">{formatDateTime(n.createdAt)}</div>
            <div className="text-slate-800 whitespace-pre-wrap text-[15px]">{n.text}</div>
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
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>
      <ActivityFeed entries={filtered} emptyMessage="No activity matches this filter." />
    </div>
  )
}
