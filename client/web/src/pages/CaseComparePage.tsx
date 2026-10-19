import { useMemo, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { compareCases, type ComparisonLevel } from '../lib/caseComparison'
import { buildTimeline } from '../lib/timeline'
import { getLocationName } from '../lib/lookup'
import { formatDateTime } from '../lib/dates'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import EntityIcon from '../components/EntityIcon'
import {
  Users, Car, MapPin, Phone, Tag, ArrowLeft, GitCompare,
  AlertCircle, Info,
} from 'lucide-react'

function ComparisonBadge({ level }: { level: ComparisonLevel }) {
  const colors: Record<ComparisonLevel, string> = {
    'WEAK': 'bg-slate-100 text-slate-700 border-slate-200',
    'MODERATE': 'bg-blue-100 text-blue-800 border-blue-200',
    'STRONG': 'bg-orange-100 text-orange-800 border-orange-200',
    'VERY STRONG': 'bg-red-100 text-red-800 border-red-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[14px] font-bold ${colors[level]}`}>
      {level}
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

export default function CaseComparePage() {
  const { caseId, otherCaseId } = useParams<{ caseId: string; otherCaseId: string }>()
  const data = useInvestigationStore(s => s.data)

  useEffect(() => {
    document.title = `Compare ${caseId} vs ${otherCaseId} · Incident Investigation System`
  }, [caseId, otherCaseId])

  const caseA = data.cases.find(c => c.id === caseId)
  const caseB = data.cases.find(c => c.id === otherCaseId)

  const comparison = useMemo(() => {
    if (!caseA || !caseB) return null
    return compareCases(data, caseA.id, caseB.id)
  }, [data, caseA, caseB])

  const timelineA = useMemo(() => (caseA ? buildTimeline(data, caseA.id) : []), [data, caseA])
  const timelineB = useMemo(() => (caseB ? buildTimeline(data, caseB.id) : []), [data, caseB])
  const sharedLocationSet = useMemo(() => new Set(comparison?.sharedLocationIds ?? []), [comparison])

  // Redirect if comparing a case with itself
  if (caseId && otherCaseId && caseId === otherCaseId) {
    return <Navigate to={`/cases/${caseId}`} replace />
  }

  if (!caseA || !caseB || !comparison) {
    return (
      <div className="space-y-6">
        <PageHeader title="Case Comparison" description="Compare two cases side by side." />
        <EmptyState
          title="Case not found"
          description="One or both of the specified cases could not be found."
          action={
            <Link to="/cases" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4" />
              Back to cases
            </Link>
          }
        />
      </div>
    )
  }

  const nameMatchLabel = (kind: string) => {
    if (kind === 'exact-name') return 'Exact name'
    if (kind === 'shared-alias') return 'Shared alias'
    if (kind === 'surname-only') return 'Surname only'
    return 'Name match'
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="mb-2">
          <Link
            to={`/cases/${caseA.id}?tab=connections`}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {caseA.id} connections
          </Link>
        </div>
        <PageHeader
          title={`Case Comparison: ${caseA.id} vs ${caseB.id}`}
          description="Comparative analysis of shared evidence, subjects, vehicles, timelines, and operational leads."
        />
      </div>

      {/* 1. HEADER: BOTH CASES SIDE BY SIDE WITH SCORE & BREAKDOWN */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Case A Info */}
          <div className="lg:col-span-4 rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Link to={`/cases/${caseA.id}`} className="text-[17px] font-bold text-blue-600 hover:underline">
                {caseA.id}
              </Link>
              <CurrentPastBadge isPast={caseA.status === 'closed'} />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-900 leading-snug">{caseA.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-slate-500">Status:</span>
              <StatusBadge status={caseA.status} />
              <span className="text-[13px] text-slate-400 capitalize">({caseA.type})</span>
            </div>
          </div>

          {/* Center: Big Score, Level Badge & Breakdown */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center px-2 py-2">
            <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <GitCompare className="h-4 w-4" />
              Connection Strength
            </div>
            <div className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">
              {comparison.score}
            </div>
            <ComparisonBadge level={comparison.level} />

            {/* Score Breakdown Lines */}
            {comparison.breakdown.length > 0 && (
              <div className="mt-3 w-full rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-left space-y-1">
                <p className="text-[13px] font-semibold text-slate-600 border-b border-slate-200 pb-1">
                  Signal breakdown:
                </p>
                {comparison.breakdown.map((line, idx) => (
                  <p key={idx} className="font-mono text-[13px] text-slate-700 leading-tight">
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Case B Info */}
          <div className="lg:col-span-4 rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Link to={`/cases/${caseB.id}`} className="text-[17px] font-bold text-blue-600 hover:underline">
                {caseB.id}
              </Link>
              <CurrentPastBadge isPast={caseB.status === 'closed'} />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-900 leading-snug">{caseB.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-slate-500">Status:</span>
              <StatusBadge status={caseB.status} />
              <span className="text-[13px] text-slate-400 capitalize">({caseB.type})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. WHERE TO LOOK: THE LEADS (MOST PROMINENT BLOCK) */}
      <div className="rounded-xl border-2 border-blue-500 bg-blue-50/40 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-slate-900">Where to look (Investigative leads)</h2>
            <p className="text-[14px] text-slate-600">
              High-priority instructions generated from cross-case signals. Follow these leads first.
            </p>
          </div>
        </div>

        {comparison.leads.length === 0 ? (
          <div className="rounded-lg bg-white border border-slate-200 p-4 text-[14px] text-slate-600">
            No specific operational leads generated between these two cases.
          </div>
        ) : (
          <div className="space-y-3">
            {comparison.leads.map((lead, idx) => {
              const priorityStyles =
                lead.priority === 'high'
                  ? 'bg-orange-100 text-orange-900 border-orange-300'
                  : lead.priority === 'medium'
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : 'bg-slate-100 text-slate-800 border-slate-300'

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-bold uppercase tracking-wide ${priorityStyles}`}>
                      {lead.priority} priority
                    </span>
                  </div>

                  <p className="text-[15px] font-medium text-slate-900 leading-relaxed">
                    {lead.text}
                  </p>

                  {/* Entities mentioned with direct clickable links */}
                  {lead.entityIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <span className="text-[13px] font-medium text-slate-500">Related records:</span>
                      {lead.entityIds.map(entId => {
                        let entType: 'person' | 'vehicle' | 'location' | 'evidence' | 'incident' = 'person'
                        let label = entId
                        let targetPath = `/persons/${entId}`

                        if (entId.startsWith('P-')) {
                          entType = 'person'
                          label = data.persons.find(p => p.id === entId)?.fullName ?? entId
                          targetPath = `/persons/${entId}`
                        } else if (entId.startsWith('V-')) {
                          entType = 'vehicle'
                          label = data.vehicles.find(v => v.id === entId)?.registration ?? entId
                          targetPath = `/vehicles/${entId}`
                        } else if (entId.startsWith('L-')) {
                          entType = 'location'
                          label = data.locations.find(l => l.id === entId)?.name ?? entId
                          targetPath = `/locations/${entId}`
                        } else if (entId.startsWith('E-')) {
                          entType = 'evidence'
                          label = data.evidence.find(e => e.id === entId)?.title ?? entId
                          targetPath = `/evidence/${entId}`
                        } else if (entId.startsWith('I-')) {
                          entType = 'incident'
                          label = data.incidents.find(i => i.id === entId)?.title ?? entId
                          targetPath = `/incidents/${entId}`
                        }

                        return (
                          <Link
                            key={entId}
                            to={targetPath}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[13px] font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <EntityIcon type={entType} className="h-3.5 w-3.5" />
                            <span>{label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. WHAT THEY SHARE */}
      <Card title="What they share">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Shared People */}
          <div className="space-y-2 rounded-lg bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              <Users className="h-4 w-4 text-violet-600" />
              <span>People ({comparison.sharedPersonIds.length})</span>
            </div>
            {comparison.sharedPersonIds.length === 0 ? (
              <p className="text-[14px] text-slate-500">None</p>
            ) : (
              <ul className="space-y-1.5">
                {comparison.sharedPersonIds.map(pid => {
                  const p = data.persons.find(x => x.id === pid)
                  return (
                    <li key={pid} className="flex items-center justify-between text-[14px]">
                      <Link to={`/persons/${pid}`} className="font-medium text-blue-600 hover:underline">
                        {p?.fullName ?? pid}
                      </Link>
                      <span className="text-[13px] text-slate-500 capitalize">{p?.type}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Shared Vehicles */}
          <div className="space-y-2 rounded-lg bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              <Car className="h-4 w-4 text-blue-600" />
              <span>Vehicles ({comparison.sharedVehicleIds.length})</span>
            </div>
            {comparison.sharedVehicleIds.length === 0 ? (
              <p className="text-[14px] text-slate-500">None</p>
            ) : (
              <ul className="space-y-1.5">
                {comparison.sharedVehicleIds.map(vid => {
                  const v = data.vehicles.find(x => x.id === vid)
                  return (
                    <li key={vid} className="flex items-center justify-between text-[14px]">
                      <Link to={`/vehicles/${vid}`} className="font-medium text-blue-600 hover:underline">
                        {v?.registration ?? vid}
                      </Link>
                      <span className="text-[13px] text-slate-500">{v?.make} {v?.model}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Shared Locations */}
          <div className="space-y-2 rounded-lg bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              <MapPin className="h-4 w-4 text-rose-600" />
              <span>Places ({comparison.sharedLocationIds.length})</span>
            </div>
            {comparison.sharedLocationIds.length === 0 ? (
              <p className="text-[14px] text-slate-500">None</p>
            ) : (
              <ul className="space-y-1.5">
                {comparison.sharedLocationIds.map(lid => {
                  const loc = data.locations.find(x => x.id === lid)
                  return (
                    <li key={lid} className="flex items-center justify-between text-[14px]">
                      <Link to={`/locations/${lid}`} className="font-medium text-blue-600 hover:underline">
                        {loc?.name ?? lid}
                      </Link>
                      <span className="text-[13px] text-slate-500">{loc?.city}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Shared Phone Numbers */}
          <div className="space-y-2 rounded-lg bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              <Phone className="h-4 w-4 text-emerald-600" />
              <span>Phone numbers ({comparison.sharedPhoneNumbers.length})</span>
            </div>
            {comparison.sharedPhoneNumbers.length === 0 ? (
              <p className="text-[14px] text-slate-500">None</p>
            ) : (
              <ul className="space-y-1.5">
                {comparison.sharedPhoneNumbers.map(ph => (
                  <li key={ph} className="font-mono text-[14px] font-medium text-slate-800">
                    {ph}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Shared Evidence Tags */}
          <div className="space-y-2 rounded-lg bg-slate-50 border border-slate-200 p-4 md:col-span-2">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
              <Tag className="h-4 w-4 text-amber-600" />
              <span>Evidence tags ({comparison.sharedEvidenceTags.length})</span>
            </div>
            {comparison.sharedEvidenceTags.length === 0 ? (
              <p className="text-[14px] text-slate-500">None</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {comparison.sharedEvidenceTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-mono text-[13px] font-semibold text-amber-800"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 4. POSSIBLE SAME PERSON (NAMES) */}
      <Card title="Possible same person (names)">
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 flex items-start gap-2.5">
            <Info className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[14px] text-slate-700 leading-relaxed">
              These are different records. Check whether they are the same person.
            </p>
          </div>

          {comparison.nameMatches.length === 0 ? (
            <p className="text-[14px] text-slate-500">
              No speculative name or alias similarities detected between different person profiles in these cases.
            </p>
          ) : (
            <div className="space-y-3">
              {comparison.nameMatches.map((nm, idx) => {
                const personA = data.persons.find(p => p.id === nm.personAId)
                const personB = data.persons.find(p => p.id === nm.personBId)

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Person A record */}
                      <div className="md:col-span-5 rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <Link to={`/persons/${nm.personAId}`} className="text-[15px] font-semibold text-blue-600 hover:underline">
                            {personA?.fullName ?? nm.personAId}
                          </Link>
                          <span className="font-mono text-[13px] text-slate-400">{nm.personAId}</span>
                        </div>
                        <p className="text-[13px] text-slate-600 capitalize">Role: {personA?.type}</p>
                        {personA?.knownAliases && personA.knownAliases.length > 0 && (
                          <p className="text-[13px] text-slate-500">Aliases: {personA.knownAliases.join(', ')}</p>
                        )}
                      </div>

                      {/* Middle match badge */}
                      <div className="md:col-span-2 flex flex-col items-center justify-center text-center">
                        <span className="inline-flex items-center rounded-full bg-purple-100 border border-purple-200 px-3 py-1 text-[13px] font-bold text-purple-800">
                          {nameMatchLabel(nm.kind)}
                        </span>
                        <span className="mt-1 font-mono text-[13px] text-slate-500">
                          &ldquo;{nm.matchedTerm}&rdquo;
                        </span>
                      </div>

                      {/* Person B record */}
                      <div className="md:col-span-5 rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <Link to={`/persons/${nm.personBId}`} className="text-[15px] font-semibold text-blue-600 hover:underline">
                            {personB?.fullName ?? nm.personBId}
                          </Link>
                          <span className="font-mono text-[13px] text-slate-400">{nm.personBId}</span>
                        </div>
                        <p className="text-[13px] text-slate-600 capitalize">Role: {personB?.type}</p>
                        {personB?.knownAliases && personB.knownAliases.length > 0 && (
                          <p className="text-[13px] text-slate-500">Aliases: {personB.knownAliases.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* 5. TIMELINES SIDE BY SIDE */}
      <Card title="Timelines side by side">
        <p className="text-[14px] text-slate-600 mb-4">
          Chronological events for each case. Events occurring at a <span className="font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">shared place</span> are highlighted in both columns. All timestamps in UTC.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Case A Timeline */}
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-100 p-3 font-semibold text-slate-800 text-[15px] flex items-center justify-between">
              <span>{caseA.id} — {caseA.title}</span>
              <span className="text-[13px] font-normal text-slate-500">{timelineA.length} event(s)</span>
            </div>

            {timelineA.length === 0 ? (
              <p className="text-[14px] text-slate-500 py-4 text-center">No timeline events recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {timelineA.map(evt => {
                  const isSharedLocation = evt.locationId && sharedLocationSet.has(evt.locationId)
                  return (
                    <div
                      key={evt.id}
                      className={`rounded-lg border p-3.5 space-y-1.5 transition-colors ${
                        isSharedLocation
                          ? 'border-amber-300 bg-amber-50/80 shadow-sm'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[13px] font-semibold text-slate-600">
                          {formatDateTime(evt.timestamp)}
                        </span>
                        {isSharedLocation && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2 py-0.5 text-[13px] font-bold text-amber-900">
                            <MapPin className="h-3 w-3" />
                            Shared place
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] font-semibold text-slate-900">{evt.title}</p>
                      <p className="text-[13px] text-slate-600">{evt.description}</p>
                      {evt.locationId && (
                        <p className="text-[13px] text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getLocationName(data, evt.locationId)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Column 2: Case B Timeline */}
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-100 p-3 font-semibold text-slate-800 text-[15px] flex items-center justify-between">
              <span>{caseB.id} — {caseB.title}</span>
              <span className="text-[13px] font-normal text-slate-500">{timelineB.length} event(s)</span>
            </div>

            {timelineB.length === 0 ? (
              <p className="text-[14px] text-slate-500 py-4 text-center">No timeline events recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {timelineB.map(evt => {
                  const isSharedLocation = evt.locationId && sharedLocationSet.has(evt.locationId)
                  return (
                    <div
                      key={evt.id}
                      className={`rounded-lg border p-3.5 space-y-1.5 transition-colors ${
                        isSharedLocation
                          ? 'border-amber-300 bg-amber-50/80 shadow-sm'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[13px] font-semibold text-slate-600">
                          {formatDateTime(evt.timestamp)}
                        </span>
                        {isSharedLocation && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2 py-0.5 text-[13px] font-bold text-amber-900">
                            <MapPin className="h-3 w-3" />
                            Shared place
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] font-semibold text-slate-900">{evt.title}</p>
                      <p className="text-[13px] text-slate-600">{evt.description}</p>
                      {evt.locationId && (
                        <p className="text-[13px] text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getLocationName(data, evt.locationId)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
