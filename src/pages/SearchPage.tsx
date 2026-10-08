import { useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph } from '../lib/graph'
import { searchAll, getResultPath } from '../lib/search'
// Removed ENTITY_STYLE import
import PageHeader from '../components/PageHeader'
import EntityIcon from '../components/EntityIcon'
import EmptyState from '../components/EmptyState'
import { Search } from 'lucide-react'
import type { EntityType } from '../types'
import type { SearchEntityType } from '../lib/search'

const ENTITY_TYPES: Array<{ id: SearchEntityType; label: string }> = [
  { id: 'case', label: 'Cases' },
  { id: 'person', label: 'Persons' },
  { id: 'vehicle', label: 'Vehicles' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'incident', label: 'Incidents' },
  { id: 'location', label: 'Locations' },
]

export default function SearchPage() {
  const data = useInvestigationStore(s => s.data)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const query = params.get('q') ?? ''
  const typeFilter = params.get('type') ?? ''

  const graph = useMemo(() => buildGraph(data), [data])
  const allResults = useMemo(() => searchAll(data, graph, query), [data, graph, query])
  const results = typeFilter
    ? allResults.filter(r => r.entityType === typeFilter)
    : allResults

  function setTypeFilter(type: string) {
    const next = new URLSearchParams(params)
    if (type) next.set('type', type)
    else next.delete('type')
    navigate(`/search?${next.toString()}`, { replace: true })
  }

  // Group results by entity type
  const grouped = ENTITY_TYPES.map(et => ({
    ...et,
    items: results.filter(r => r.entityType === et.id),
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search results"
        description={query ? `Results for "${query}"` : 'Enter a query to search.'}
      />

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter('')}
          className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
            !typeFilter
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          All
        </button>
        {ENTITY_TYPES.map(et => (
          <button
            key={et.id}
            onClick={() => setTypeFilter(et.id)}
            className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
              typeFilter === et.id
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {query.length < 2 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Enter a search query"
          description="Type at least 2 characters. Try a vehicle plate, person name, phone number, or case id."
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={`No results for "${query}"`}
          description="Try a plate number, a name, a phone number or a case id."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.id}>
              <h2 className="mb-3 text-[17px] font-semibold text-slate-700">{group.label}</h2>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                {group.items.map(result => (
                  <button
                    key={result.id}
                    className="flex w-full items-start gap-4 px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                    onClick={() => navigate(getResultPath(result))}
                  >
                    <div className="mt-0.5 shrink-0">
                      {result.entityType !== 'case' ? (
                        <EntityIcon type={result.entityType as EntityType} className="h-5 w-5" />
                      ) : (
                        <div className="h-5 w-5 rounded bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold">C</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-slate-900">{result.title}</p>
                      <p className="text-[13px] text-slate-500">{result.subtitle}</p>
                      {/* Enrichment details */}
                      {result.entityType === 'vehicle' && (
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] text-slate-500">
                          {(result.enrichment.linkedCases as string[]).length > 0 && (
                            <span>Cases: {(result.enrichment.linkedCases as string[]).join(', ')}</span>
                          )}
                          {(result.enrichment.linkedPersons as string[]).length > 0 && (
                            <span>Persons: {(result.enrichment.linkedPersons as string[]).join(', ')}</span>
                          )}
                          {(result.enrichment.seenLocations as string[]).length > 0 && (
                            <span>Seen at: {(result.enrichment.seenLocations as string[]).join(', ')}</span>
                          )}
                        </div>
                      )}
                      {result.entityType === 'person' && (
                        <div className="mt-1 flex flex-wrap gap-x-4 text-[13px] text-slate-500">
                          {result.enrichment.phone ? <span>Phone: {String(result.enrichment.phone)}</span> : null}
                          {(result.enrichment.relatedCases as string[]).length > 0 ? (
                            <span>Cases: {(result.enrichment.relatedCases as string[]).join(', ')}</span>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[13px] text-slate-400">score {result.score}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

