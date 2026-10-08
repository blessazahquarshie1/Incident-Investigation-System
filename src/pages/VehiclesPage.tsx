import { useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { filterVehicles } from '../lib/filters'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import { getPersonName } from '../lib/lookup'
import type { Vehicle } from '../types'

export default function VehiclesPage() {
  const data = useInvestigationStore(s => s.data)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  
  const text = params.get('text') ?? ''
  
  const filtered = useMemo(() => filterVehicles(data.vehicles, { text }), [data, text])
  
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  
  function clearFilters() {
    setParams({}, { replace: true })
  }
  
  const columns: Column<Vehicle>[] = [
    { key: 'registration', header: 'Registration', render: r => <Link to={`/vehicles/${r.id}`} className="text-blue-600 hover:underline">{r.registration}</Link>, sortable: true, getValue: r => r.registration },
    { key: 'make', header: 'Make', render: r => r.make, sortable: true, getValue: r => r.make },
    { key: 'model', header: 'Model', render: r => r.model, sortable: true, getValue: r => r.model },
    { key: 'color', header: 'Color', render: r => r.color, sortable: true, getValue: r => r.color },
    { key: 'owner', header: 'Owner', render: r => r.ownerId ? <Link to={`/persons/${r.ownerId}`} className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{getPersonName(data, r.ownerId)}</Link> : 'Unknown', sortable: true, getValue: r => r.ownerId ? getPersonName(data, r.ownerId) : '' },
  ]
  
  return (
    <div className="space-y-6">
      <PageHeader title="Vehicles" description="Directory of connected vehicles." />
      <FilterBar 
        search={text} 
        onSearchChange={v => setParam('text', v)} 
        onClear={clearFilters}
        filters={[]}
      />
      <DataTable columns={columns} rows={filtered} getRowKey={r => r.id} showRowCount totalCount={data.vehicles.length} onRowClick={row => navigate(`/vehicles/${row.id}`)} />
    </div>
  )
}
