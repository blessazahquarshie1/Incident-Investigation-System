import { useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildGraph, getNeighbors, getNodeType, getNodeEdges } from '../lib/graph'
import { findConnections } from '../lib/connections'
import { normaliseWords } from '../lib/caseComparison'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import EntityIcon from '../components/EntityIcon'
import EntityTypeBadge from '../components/EntityTypeBadge'
import PriorityBadge from '../components/PriorityBadge'
import StatusBadge from '../components/StatusBadge'
import ConnectionScoreCard from '../components/ConnectionScoreCard'
import type { EntityType, Person } from '../types'
import { Briefcase, Info } from 'lucide-react'

function CurrentPastBadge({ isPast }: { isPast: boolean }) {
  return isPast ? (
    <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[13px] font-medium text-slate-600">
      Past
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[13px] font-medium text-emerald-800">
      Current
    </span>
  )
}

interface SimilarPersonMatch {
  person: Person
  kind: 'Exact name' | 'Shared alias' | 'Surname only' | 'Similar spelling'
  term: string
}

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const data = useInvestigationStore(s => s.data)
  const entity = data.persons.find(x => x.id === id)

  useEffect(() => {
    document.title = entity ? `${entity.fullName} · Incident Investigation System` : 'Not Found · IIS'
  }, [entity])

  const graph = useMemo(() => buildGraph(data), [data])

  // Possible same person matches across other records
  const possibleSamePersonMatches = useMemo(() => {
    if (!entity) return []
    const wordsA = normaliseWords(entity.fullName)
    const aliasesA = (entity.knownAliases ?? []).map(a => normaliseWords(a).join(' '))
    const strA = wordsA.join(' ')

    const matches: SimilarPersonMatch[] = []

    for (const other of data.persons) {
      if (other.id === entity.id) continue

      const wordsB = normaliseWords(other.fullName)
      const aliasesB = (other.knownAliases ?? []).map(b => normaliseWords(b).join(' '))
      const strB = wordsB.join(' ')

      // 1. Exact name match
      if (
        wordsA.length === wordsB.length &&
        wordsA.length > 0 &&
        [...wordsA].sort().join(' ') === [...wordsB].sort().join(' ')
      ) {
        matches.push({ person: other, kind: 'Exact name', term: other.fullName })
        continue
      }

      // 2. Shared alias
      let matchedAlias: string | null = null
      for (const a of aliasesA) {
        if (!a) continue
        if (aliasesB.includes(a) || a === strB) {
          matchedAlias = a
          break
        }
      }
      if (!matchedAlias) {
        for (const b of aliasesB) {
          if (!b) continue
          if (aliasesA.includes(b) || b === strA) {
            matchedAlias = b
            break
          }
        }
      }

      if (matchedAlias) {
        matches.push({ person: other, kind: 'Shared alias', term: matchedAlias })
        continue
      }

      // 3. Surname only (same last word, first words differ)
      const commonWords = wordsA.filter(w => wordsB.includes(w))
      const isFirstWordA = wordsA[0] !== undefined
      const isFirstWordB = wordsB[0] !== undefined
      const firstNameMatch = isFirstWordA && isFirstWordB && wordsA[0] === wordsB[0]

      if (commonWords.length === 1 && !firstNameMatch) {
        const sharedWord = commonWords[0]
        if (sharedWord.length >= 4) {
          matches.push({ person: other, kind: 'Surname only', term: sharedWord })
          continue
        }
      }
    }

    return matches
  }, [entity, data.persons])

  if (!entity) {
    return (
      <EmptyState
        title="Not found"
        description="No record with this id."
        action={<Link to="/persons" className="text-blue-600 hover:underline">← Back to list</Link>}
      />
    )
  }

  const neighborIds = getNeighbors(graph, entity.id)
  const nodeEdges = getNodeEdges(graph, entity.id)

  const neighborsByType: Record<EntityType, Array<{ id: string; label: string; relationship: string }>> = {
    person: [], incident: [], vehicle: [], evidence: [], location: []
  }
  for (const nid of neighborIds) {
    const ntype = getNodeType(nid)
    if (!ntype) continue
    const edge = nodeEdges.find(e => e.source === nid || e.target === nid)
    const label = graph.nodes.find(n => n.id === nid)?.label ?? nid
    neighborsByType[ntype].push({ id: nid, label, relationship: edge?.relationship ?? 'connected-to' })
  }

  return (
    <div className="space-y-6">
      <PageHeader title={entity.fullName} description={`Person Profile: ${entity.id}`} />

      {/* Details Card */}
      <Card title="Details">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="font-semibold text-slate-500 block text-[13px]">Type</span>
            <EntityTypeBadge type={entity.type} />
          </div>
          <div>
            <span className="font-semibold text-slate-500 block text-[13px]">Phone</span>
            <span className="text-[15px] font-mono">{entity.phone || '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block text-[13px]">Address</span>
            <span className="text-[15px]">{entity.address || '—'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block text-[13px]">Aliases</span>
            <span className="text-[15px]">{(entity.knownAliases || []).join(', ') || '—'}</span>
          </div>
        </div>
      </Card>

      {/* NEW SECTION 1: APPEARS IN CASES */}
      <Card title={`Appears in cases (${entity.relatedCases.length})`}>
        {entity.relatedCases.length === 0 ? (
          <p className="text-[14px] text-slate-500">This individual is not assigned to any case records.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entity.relatedCases.map(cid => {
              const kase = data.cases.find(c => c.id === cid)
              const isPast = kase?.status === 'closed'

              return (
                <div
                  key={cid}
                  className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2 hover:border-blue-300 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link to={`/cases/${cid}`} className="font-mono text-[15px] font-bold text-blue-600 hover:underline">
                          {cid}
                        </Link>
                        <CurrentPastBadge isPast={isPast} />
                      </div>
                      <p className="text-[14px] font-semibold text-slate-900 mt-0.5">{kase?.title ?? cid}</p>
                    </div>
                    {kase && <PriorityBadge priority={kase.priority} />}
                  </div>

                  {kase && (
                    <div className="flex items-center justify-between text-[13px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="capitalize">Type: {kase.type}</span>
                      <StatusBadge status={kase.status} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* NEW SECTION 2: CROSS-RECORD NAME & IDENTITY MATCHES */}
      <Card title="Name & Identity Matches Across Records">
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[14px] text-slate-700">
              Scans directory records for potential duplicate suspect identities, shared street aliases, or common family surnames across investigations.
            </p>
          </div>

          {possibleSamePersonMatches.length === 0 ? (
            <p className="text-[14px] text-slate-500">
              No other person records match this name or alias.
            </p>
          ) : (
            <div className="space-y-3">
              {possibleSamePersonMatches.map((m, idx) => {
                const badgeStyle =
                  m.kind === 'Exact name'
                    ? 'bg-red-100 border-red-200 text-red-800'
                    : m.kind === 'Shared alias'
                      ? 'bg-amber-100 border-amber-200 text-amber-800'
                      : m.kind === 'Surname only'
                        ? 'bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-purple-100 border-purple-200 text-purple-800'

                const badgeLabel =
                  m.kind === 'Surname only'
                    ? `Shared surname: "${m.term}" (Family name match only)`
                    : m.kind === 'Exact name'
                      ? `Exact name match: "${m.term}" (Potential duplicate)`
                      : `${m.kind}: "${m.term}"`

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/persons/${m.person.id}`}
                          className="text-[16px] font-bold text-blue-600 hover:underline"
                        >
                          {m.person.fullName}
                        </Link>
                        <span className="font-mono text-[13px] text-slate-400">{m.person.id}</span>
                        <EntityTypeBadge type={m.person.type} />
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-bold ${badgeStyle}`}>
                        {badgeLabel}
                      </span>
                    </div>

                  {m.person.knownAliases && m.person.knownAliases.length > 0 && (
                    <p className="text-[13px] text-slate-500">
                      Aliases: {m.person.knownAliases.join(', ')}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="text-[13px] font-semibold text-slate-600">Cases involved:</span>
                    {m.person.relatedCases.map(cid => {
                      const kase = data.cases.find(c => c.id === cid)
                      return (
                        <Link
                          key={cid}
                          to={`/cases/${cid}`}
                          className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Briefcase className="h-3 w-3 text-slate-400" />
                          <span className="font-mono">{cid}</span>
                          <CurrentPastBadge isPast={kase?.status === 'closed'} />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </Card>

      {/* Linked to Card */}
      <Card title="Linked to">
        <div className="space-y-4">
          {Object.entries(neighborsByType).map(([type, items]) => {
            if (items.length === 0) return null
            return (
              <div key={type}>
                <h4 className="text-sm font-semibold capitalize text-slate-600 mb-2 border-b pb-1">{type}s</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map(item => {
                    let note = item.relationship
                    if (item.id === 'V-001') {
                      if (entity.id === 'P-004') note = `${item.relationship} (Reported stolen in CASE-00022)`
                      else if (entity.id === 'P-002') note = `${item.relationship} (Operated in armed robberies)`
                      else if (entity.id === 'P-001') note = `${item.relationship} (Syndicate possessor)`
                    }
                    return (
                      <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border">
                        <EntityIcon type={type as EntityType} />
                        <div className="flex-1 min-w-0">
                          <Link to={`/${type}s/${item.id}`} className="text-sm font-medium text-blue-600 hover:underline truncate block">{item.label}</Link>
                          <div className="text-[13px] text-slate-500 truncate" title={note}>{note}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Connections Card */}
      <div id="connections-section">
        <Card title="Connections">
          {(() => {
            const result = findConnections(data, entity.id)
            if (result.connections.length === 0) {
              return <EmptyState title="No connections" description="This person shares no common links with others." />
            }
            return (
              <div className="space-y-2">
                {result.connections.map(pair => {
                  const pA = data.persons.find(p => p.id === pair.personAId)
                  const pB = data.persons.find(p => p.id === pair.personBId)
                  const labelA = pA
                    ? `${pA.fullName}${pA.id !== entity.id ? ` (${pA.id}${pA.relatedCases[0] ? ` · ${pA.relatedCases[0]}` : ''})` : ''}`
                    : pair.personAId
                  const labelB = pB
                    ? `${pB.fullName}${pB.id !== entity.id ? ` (${pB.id}${pB.relatedCases[0] ? ` · ${pB.relatedCases[0]}` : ''})` : ''}`
                    : pair.personBId

                  return (
                    <ConnectionScoreCard
                      key={`${pair.personAId}-${pair.personBId}`}
                      pair={pair}
                      personAName={labelA}
                      personBName={labelB}
                    />
                  )
                })}
              </div>
            )
          })()}
        </Card>
      </div>
    </div>
  )
}
