import { useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { filterEvidence } from '../lib/filters'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../lib/dates'
import { getOfficerName } from '../lib/lookup'
import type { Evidence } from '../types'

export default function EvidencePage() {
  const data = useInvestigationStore(s => s.data)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  
  const text = params.get('text') ?? ''
  const type = params.get('type') ?? ''
  const status = params.get('status') ?? ''
  const caseId = params.get('caseId') ?? ''
  
  const filtered = useMemo(() => filterEvidence(data.evidence, { text, type, status, caseId }), [data, text, type, status, caseId])
  
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  
  function clearFilters() {
    setParams({}, { replace: true })
  }
  
  const columns: Column<Evidence>[] = [
    { key: 'id', header: 'ID', render: r => <Link to={`/evidence/${r.id}`} className="text-blue-600 hover:underline">{r.id}</Link>, sortable: true, getValue: r => r.id },
    { key: 'title', header: 'Title', render: r => r.title, sortable: true, getValue: r => r.title },
    { key: 'type', header: 'Type', render: r => r.type, sortable: true, getValue: r => r.type },
    { key: 'caseId', header: 'Case', render: r => <Link to={`/cases/${r.caseId}`} className="text-blue-600 hover:underline">{r.caseId}</Link>, sortable: true, getValue: r => r.caseId },
    { key: 'collectedAt', header: 'Collected At', render: r => formatDate(r.collectedAt), sortable: true, getValue: r => r.collectedAt },
    { key: 'collectedBy', header: 'Collected By', render: r => getOfficerName(data, r.collectedBy), sortable: true, getValue: r => getOfficerName(data, r.collectedBy) },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} />, sortable: true, getValue: r => r.status },
  ]
  
  return (
    <div className="space-y-6">
      <PageHeader title="Evidence" description="Registry of all collected evidence." />
      <FilterBar 
        search={text} 
        onSearchChange={v => setParam('text', v)} 
        onClear={clearFilters}
        filters={[
          { key: 'type', label: 'Type', value: type, onChange: v => setParam('type', v), options: Array.from(new Set(data.evidence.map(c => c.type))).map(t => ({ value: t, label: t })) },
          { key: 'status', label: 'Status', value: status, onChange: v => setParam('status', v), options: Array.from(new Set(data.evidence.map(c => c.status))).map(t => ({ value: t, label: t })) },
          { key: 'caseId', label: 'Case', value: caseId, onChange: v => setParam('caseId', v), options: data.cases.map(c => ({ value: c.id, label: c.id })) }
        ]}
      />
      <DataTable columns={columns} rows={filtered} getRowKey={r => r.id} showRowCount totalCount={data.evidence.length} onRowClick={row => navigate(`/evidence/${row.id}`)} />
    </div>
  )
}
