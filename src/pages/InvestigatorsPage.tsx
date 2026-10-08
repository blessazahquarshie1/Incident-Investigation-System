import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { filterOfficers } from '../lib/filters'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import type { Officer } from '../types'

export default function InvestigatorsPage() {
  const data = useInvestigationStore(s => s.data)
  const [params, setParams] = useSearchParams()
  
  const text = params.get('text') ?? ''
  const rank = params.get('rank') ?? ''
  
  const filtered = useMemo(() => filterOfficers(data.officers, { text, rank }), [data, text, rank])
  
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  
  function clearFilters() {
    setParams({}, { replace: true })
  }
  
  const columns: Column<Officer>[] = [
    { key: 'fullName', header: 'Name', render: r => r.fullName, sortable: true, getValue: r => r.fullName },
    { key: 'rank', header: 'Rank', render: r => r.rank, sortable: true, getValue: r => r.rank },
    { key: 'badgeNumber', header: 'Badge Number', render: r => r.badgeNumber, sortable: true, getValue: r => r.badgeNumber },
    { key: 'department', header: 'Department', render: r => r.department, sortable: true, getValue: r => r.department },
    { key: 'casesLed', header: 'Cases Led', render: r => data.cases.filter(c => c.leadInvestigator === r.id).length, sortable: true, getValue: r => data.cases.filter(c => c.leadInvestigator === r.id).length },
    { key: 'evidenceCollected', header: 'Evidence Collected', render: r => data.evidence.filter(e => e.collectedBy === r.id).length, sortable: true, getValue: r => data.evidence.filter(e => e.collectedBy === r.id).length },
    { key: 'activityCount', header: 'Activity Count', render: r => data.activityLog.filter(a => a.officerId === r.id).length, sortable: true, getValue: r => data.activityLog.filter(a => a.officerId === r.id).length },
  ]
  
  return (
    <div className="space-y-6">
      <PageHeader title="Investigators" description="Directory of investigation staff." />
      <FilterBar 
        search={text} 
        onSearchChange={v => setParam('text', v)} 
        onClear={clearFilters}
        filters={[
          { key: 'rank', label: 'Rank', value: rank, onChange: v => setParam('rank', v), options: Array.from(new Set(data.officers.map(c => c.rank))).map(t => ({ value: t, label: t })) }
        ]}
      />
      <DataTable columns={columns} rows={filtered} getRowKey={r => r.id} showRowCount totalCount={data.officers.length} />
    </div>
  )
}
