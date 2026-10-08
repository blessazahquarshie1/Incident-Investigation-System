import { useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { filterLocations } from '../lib/filters'
import PageHeader from '../components/PageHeader'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable'
import type { Location } from '../types'

export default function LocationsPage() {
  useEffect(() => {
    document.title = 'Locations · Incident Investigation System'
  }, [])

  const data = useInvestigationStore(s => s.data)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  
  const text = params.get('text') ?? ''
  const city = params.get('city') ?? ''
  
  const filtered = useMemo(() => filterLocations(data.locations, { text, city }), [data, text, city])
  
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }
  
  function clearFilters() {
    setParams({}, { replace: true })
  }
  
  const columns: Column<Location>[] = [
    { key: 'name', header: 'Name', render: r => <Link to={`/locations/${r.id}`} className="text-blue-600 hover:underline">{r.name}</Link>, sortable: true, getValue: r => r.name },
    { key: 'city', header: 'City', render: r => r.city, sortable: true, getValue: r => r.city },
    { key: 'region', header: 'Region', render: r => r.region, sortable: true, getValue: r => r.region },
    { key: 'incidents', header: 'Incident Count', render: r => data.incidents.filter(i => i.locationId === r.id).length, sortable: true, getValue: r => data.incidents.filter(i => i.locationId === r.id).length },
  ]
  
  return (
    <div className="space-y-6">
      <PageHeader title="Locations" description="Directory of relevant locations." />
      <FilterBar 
        search={text} 
        onSearchChange={v => setParam('text', v)} 
        onClear={clearFilters}
        filters={[
          { key: 'city', label: 'City', value: city, onChange: v => setParam('city', v), options: Array.from(new Set(data.locations.map(c => c.city))).map(t => ({ value: t, label: t })) }
        ]}
      />
      <DataTable columns={columns} rows={filtered} getRowKey={r => r.id} showRowCount totalCount={data.locations.length} onRowClick={row => navigate(`/locations/${row.id}`)} />
    </div>
  )
}
