import { useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { filterPersons } from '../lib/filters'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import EntityTypeBadge from '../components/EntityTypeBadge'
import type { Person } from '../types'

export default function PersonsPage() {
  const data = useInvestigationStore(s => s.data)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  
  const text = params.get('text') ?? ''
  const type = params.get('type') ?? ''
  
  const filtered = useMemo(() => filterPersons(data.persons, { text, type }), [data, text, type])
  
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  
  function clearFilters() {
    setParams({}, { replace: true })
  }
  
  const columns: Column<Person>[] = [
    { key: 'fullName', header: 'Name', render: r => <Link to={`/persons/${r.id}`} className="text-blue-600 hover:underline">{r.fullName}</Link>, sortable: true, getValue: r => r.fullName },
    { key: 'type', header: 'Type', render: r => <EntityTypeBadge type={r.type as any} />, sortable: true, getValue: r => r.type },
    { key: 'phone', header: 'Phone', render: r => r.phone || '—', sortable: true, getValue: r => r.phone || '' },
    { key: 'aliases', header: 'Aliases', render: r => (r.knownAliases || []).join(', ') || '—', sortable: false },
    { key: 'cases', header: 'Related Cases', render: r => r.relatedCases.length, sortable: true, getValue: r => r.relatedCases.length },
  ]
  
  return (
    <div className="space-y-6">
      <PageHeader title="Persons" description="Directory of suspects, witnesses, victims, and persons of interest." />
      <FilterBar 
        search={text} 
        onSearchChange={v => setParam('text', v)} 
        onClear={clearFilters}
        filters={[
          { key: 'type', label: 'Type', value: type, onChange: v => setParam('type', v), options: ['suspect', 'witness', 'victim', 'person-of-interest'].map(t => ({ value: t, label: t })) }
        ]}
      />
      <DataTable columns={columns} rows={filtered} getRowKey={r => r.id} showRowCount totalCount={data.persons.length} onRowClick={row => navigate(`/persons/${row.id}`)} />
    </div>
  )
}
