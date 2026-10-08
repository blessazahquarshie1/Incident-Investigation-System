import { useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { filterIncidents } from '../lib/filters'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { formatDateTime } from '../lib/dates'
import { getLocationName } from '../lib/lookup'
import type { Incident } from '../types'

export default function IncidentsPage() {
  useEffect(() => {
    document.title = 'Incidents · Incident Investigation System'
  }, [])

  const data = useInvestigationStore(s => s.data)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  
  const text = params.get('text') ?? ''
  const type = params.get('type') ?? ''
  const status = params.get('status') ?? ''
  
  const filtered = useMemo(() => filterIncidents(data.incidents, { text, type, status }), [data, text, type, status])
  
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  
  function clearFilters() {
    setParams({}, { replace: true })
  }
  
  const columns: Column<Incident>[] = [
    { key: 'id', header: 'ID', render: r => <Link to={`/incidents/${r.id}`} className="text-blue-600 hover:underline">{r.id}</Link>, sortable: true, getValue: r => r.id },
    { key: 'title', header: 'Title', render: r => r.title, sortable: true, getValue: r => r.title },
    { key: 'type', header: 'Type', render: r => r.type, sortable: true, getValue: r => r.type },
    { key: 'location', header: 'Location', render: r => getLocationName(data, r.locationId), sortable: true, getValue: r => getLocationName(data, r.locationId) },
    { key: 'occurredAt', header: 'Occurred At', render: r => formatDateTime(r.occurredAt), sortable: true, getValue: r => r.occurredAt },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} />, sortable: true, getValue: r => r.status },
    { key: 'caseId', header: 'Case', render: r => <Link to={`/cases/${r.caseId}`} className="text-blue-600 hover:underline">{r.caseId}</Link>, sortable: true, getValue: r => r.caseId },
  ]
  
  return (
    <div className="space-y-6">
      <PageHeader title="Incidents" description="All incidents across cases." />
      <FilterBar 
        search={text} 
        onSearchChange={v => setParam('text', v)} 
        onClear={clearFilters}
        filters={[
          { key: 'type', label: 'Type', value: type, onChange: v => setParam('type', v), options: Array.from(new Set(data.incidents.map(c => c.type))).map(t => ({ value: t, label: t })) },
          { key: 'status', label: 'Status', value: status, onChange: v => setParam('status', v), options: ['open', 'resolved', 'under-review'].map(t => ({ value: t, label: t })) }
        ]}
      />
      <DataTable columns={columns} rows={filtered} getRowKey={r => r.id} showRowCount totalCount={data.incidents.length} onRowClick={row => navigate(`/incidents/${row.id}`)} />
    </div>
  )
}
