import { useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph } from '../lib/graph'
import { searchAll, getResultPath } from '../lib/search'
import { searchByName, type MatchedOnType } from '../lib/nameSearch'
import PageHeader from '../components/PageHeader'
import EntityIcon from '../components/EntityIcon'
import EntityTypeBadge from '../components/EntityTypeBadge'
import EmptyState from '../components/EmptyState'
import { Search, Briefcase, FileText } from 'lucide-react'
import type { EntityType } from '../types'
import type { SearchEntityType } from '../lib/search'

const ENTITY_TYPES: Array<{ id: SearchEntityType | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'person', label: 'Persons' },
  { id: 'case', label: 'Cases' },
  { id: 'vehicle', label: 'Vehicles' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'incident', label: 'Incidents' },
  { id: 'location', label: 'Locations' },
]

function MatchedOnBadge({ matchType }: { matchType: MatchedOnType }) {
  const styles: Record<MatchedOnType, string> = {
    'full name': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'first name': 'bg-blue-100 text-blue-800 border-blue-200',
    'surname': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'alias': 'bg-purple-100 text-purple-800 border-purple-200',
    'similar spelling': 'bg-amber-100 text-amber-800 border-amber-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-medium ${styles[matchType]}`}>
      {matchType}
    </span>
  )
}

function CurrentPastBadge({ isPast }: { isPast: boolean }) {
  return isPast ? (
    <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[13px] font-medium text-slate-600">
      Past
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[13px] font-medium text-emerald-800">
      Current
    </span>
  )
}

export default function SearchPage() {
  const data = useInvestigationStore(s => s.data)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const query = params.get('q') ?? ''
  const typeFilter = params.get('type') ?? 'all'

  useEffect(() => {
    document.title = query ? `Search: "${query}" · Incident Investigation System` : 'Search · Incident Investigation System'
  }, [query])

  const graph = useMemo(() => buildGraph(data), [data])

  // Name search engine (Step 12/13)
  const nameResults = useMemo(() => {
    return searchByName(data, query)
  }, [data, query])

  // General search engine (plates, ids, locations, evidence, cases)
  const generalResults = useMemo(() => {
    return searchAll(data, graph, query)
  }, [data, graph, query])

  function setTypeFilter(type: string) {
    const next = new URLSearchParams(params)
    if (type && type !== 'all') next.set('type', type)
    else next.delete('type')
    navigate(`/search?${next.toString()}`, { replace: true })
  }

  // Filter other non-person entities
  const otherEntities = useMemo(() => {
    return generalResults.filter(r => r.entityType !== 'person')
  }, [generalResults])

  const filteredOtherEntities = useMemo(() => {
    if (typeFilter === 'all') return otherEntities
    return otherEntities.filter(r => r.entityType === typeFilter)
  }, [otherEntities, typeFilter])

  const showPeopleSection = (typeFilter === 'all' || typeFilter === 'person') && nameResults.people.length > 0
  const showCasesSection = (typeFilter === 'all' || typeFilter === 'case') && nameResults.cases.length > 0
  const showOtherSection = (typeFilter !== 'person') && filteredOtherEntities.length > 0

  const hasAnyResults = showPeopleSection || showCasesSection || showOtherSection

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search results"
        description={query ? `Results for "${query}"` : 'Enter a query to search.'}
      />

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {ENTITY_TYPES.map(et => (
          <button
            key={et.id}
            onClick={() => setTypeFilter(et.id)}
            className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
              typeFilter === et.id || (et.id === 'all' && (!typeFilter || typeFilter === 'all'))
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Search Input Notice */}
      {query.length < 2 ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Enter a search query"
          description="Type at least 2 characters. Try a vehicle plate, person name, phone number, or case id."
        />
      ) : !hasAnyResults ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={`No results for "${query}"`}
          description={`No one matches '${query}'. Try just the surname or a different spelling.`}
        />
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: PEOPLE MATCHING '<QUERY>' */}
          {showPeopleSection && (
            <div className="space-y-3">
              <div>
                <h2 className="text-[20px] font-bold text-slate-900">
                  People matching &lsquo;{query}&rsquo; ({nameResults.people.length})
                </h2>
                <p className="text-[14px] text-slate-500">
                  Matches any first name, surname or alias. Similar spellings are included and labelled.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nameResults.people.map(pm => {
                  return (
                    <div
                      key={pm.person.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/persons/${pm.person.id}`}
                              className="text-[17px] font-semibold text-blue-600 hover:underline"
                            >
                              {pm.person.fullName}
                            </Link>
                            <EntityTypeBadge type={pm.person.type} />
                            <MatchedOnBadge matchType={pm.matchedOn} />
                          </div>
                          {pm.person.phone && (
                            <p className="text-[13px] text-slate-600 font-mono">
                              Phone: {pm.person.phone}
                            </p>
                          )}
                          {pm.person.knownAliases && pm.person.knownAliases.length > 0 && (
                            <p className="text-[13px] text-slate-500">
                              Aliases: {pm.person.knownAliases.join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-[13px] text-slate-400">{pm.person.id}</span>
                      </div>

                      {/* Cases they appear in */}
                      <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                        <span className="text-[13px] font-semibold text-slate-700 block">
                          Appears in {pm.caseIds.length} case{pm.caseIds.length === 1 ? '' : 's'}:
                        </span>
                        {pm.caseIds.length === 0 ? (
                          <span className="text-[13px] text-slate-400 italic">No assigned cases</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {pm.caseIds.map(cid => {
                              const kase = data.cases.find(c => c.id === cid)
                              const isPast = kase?.status === 'closed'
                              return (
                                <Link
                                  key={cid}
                                  to={`/cases/${cid}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[13px] font-medium text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                >
                                  <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="font-mono font-bold">{cid}</span>
                                  {kase && <span className="max-w-[150px] truncate text-slate-600">· {kase.title}</span>}
                                  <CurrentPastBadge isPast={isPast} />
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: CASES WHERE THIS NAME APPEARS */}
          {showCasesSection && (
            <div className="space-y-3">
              <div>
                <h2 className="text-[20px] font-bold text-slate-900">
                  Cases where this name appears ({nameResults.cases.length})
                </h2>
                <p className="text-[14px] text-slate-500">
                  Cases linked to matching individuals or containing full-text name mentions in witness statements, notes, or evidence.
                </p>
              </div>

              <div className="space-y-3">
                {nameResults.cases.map(cMatch => {
                  const kase = data.cases.find(c => c.id === cMatch.caseId)
                  return (
                    <div
                      key={cMatch.caseId}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/cases/${cMatch.caseId}`}
                              className="text-[17px] font-semibold text-blue-600 hover:underline"
                            >
                              {cMatch.caseId}
                            </Link>
                            <span className="text-slate-400">·</span>
                            <span className="text-[16px] font-medium text-slate-900">
                              {kase?.title ?? cMatch.caseId}
                            </span>
                            <CurrentPastBadge isPast={cMatch.isPast} />
                          </div>
                          {kase && (
                            <p className="text-[13px] text-slate-600 line-clamp-2">
                              {kase.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Matching people in this case */}
                      {cMatch.people.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                          <span className="text-[13px] font-semibold text-slate-600">Matching individuals:</span>
                          {cMatch.people.map(p => {
                            const personObj = data.persons.find(x => x.id === p.personId)
                            return (
                              <Link
                                key={p.personId}
                                to={`/persons/${p.personId}`}
                                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[13px] font-medium text-slate-800 hover:bg-slate-200"
                              >
                                <span>{personObj?.fullName ?? p.personId}</span>
                                <span className="text-slate-400">({p.matchedOn})</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}

                      {/* Text mentions in this case */}
                      {cMatch.mentions.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          <span className="text-[13px] font-semibold text-slate-600">Text mentions:</span>
                          <div className="space-y-1">
                            {cMatch.mentions.map((mention, mIdx) => (
                              <div
                                key={mIdx}
                                className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-100 p-2 text-[13px]"
                              >
                                <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-slate-500 shrink-0 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[13px]">
                                  <FileText className="h-3 w-3" />
                                  {mention.where}
                                </span>
                                <span className="text-slate-700 italic font-sans">{mention.snippet}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: OTHER ENTITY RESULTS (VEHICLES, PLATES, LOCATIONS, EVIDENCE) */}
          {showOtherSection && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h2 className="text-[18px] font-semibold text-slate-800">
                Other investigative results ({filteredOtherEntities.length})
              </h2>

              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                {filteredOtherEntities.map(result => (
                  <button
                    key={`${result.entityType}-${result.id}`}
                    className="flex w-full items-start gap-4 px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                    onClick={() => navigate(getResultPath(result))}
                  >
                    <div className="mt-0.5 shrink-0">
                      {result.entityType !== 'case' ? (
                        <EntityIcon type={result.entityType as EntityType} className="h-5 w-5" />
                      ) : (
                        <Briefcase className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-slate-900">{result.title}</p>
                      <p className="text-[13px] text-slate-500">{result.subtitle}</p>
                      {result.entityType === 'vehicle' && (
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] text-slate-500">
                          {(result.enrichment.linkedCases as string[])?.length > 0 && (
                            <span>Cases: {(result.enrichment.linkedCases as string[]).join(', ')}</span>
                          )}
                          {(result.enrichment.seenLocations as string[])?.length > 0 && (
                            <span>Seen at: {(result.enrichment.seenLocations as string[]).join(', ')}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[13px] text-slate-400">score {result.score}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
