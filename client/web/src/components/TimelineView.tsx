import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { buildTimeline } from '../lib/timeline'
import { detectTimelineConflicts } from '../lib/conflicts'
import { getPersonName, getLocationName } from '../lib/lookup'
import { formatTime, formatDate } from '../lib/dates'
import type { TimelineSource, TimelineEvent } from '../lib/timeline'
import type { TimelineConflict } from '../lib/conflicts'
import { AlertTriangle, FileSearch, MapPin, MessageSquare, Car, Phone } from 'lucide-react'

const SOURCE_STYLES: Record<TimelineSource, { icon: React.FC<{className?: string}>; color: string; label: string }> = {
  'evidence': { icon: FileSearch, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Evidence' },
  'incident': { icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'Incident' },
  'location': { icon: MapPin, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Location' },
  'witness-statement': { icon: MessageSquare, color: 'text-violet-600 bg-violet-50 border-violet-200', label: 'Witness' },
  'vehicle-sighting': { icon: Car, color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Vehicle' },
  'phone-record': { icon: Phone, color: 'text-rose-600 bg-rose-50 border-rose-200', label: 'Phone' },
}

const ALL_SOURCES: TimelineSource[] = [
  'evidence', 'incident', 'location', 'witness-statement', 'vehicle-sighting', 'phone-record'
]

interface Props {
  caseId?: string
  showControls?: boolean
}

export default function TimelineView({ caseId, showControls = false }: Props) {
  const data = useInvestigationStore(s => s.data)
  const [activeSources, setActiveSources] = useState<Set<TimelineSource>>(new Set(ALL_SOURCES))
  const [selectedCase, setSelectedCase] = useState(caseId ?? 'CASE-00123')

  const effectiveCaseId = caseId ?? (selectedCase === 'all' ? undefined : selectedCase)
  const events = useMemo(() => buildTimeline(data, effectiveCaseId), [data, effectiveCaseId])
  const conflicts = useMemo(() => detectTimelineConflicts(data, effectiveCaseId), [data, effectiveCaseId])

  const conflictSourceIds = useMemo(() => {
    const ids = new Set<string>()
    for (const c of conflicts) {
      ids.add(c.claimA.sourceId)
      ids.add(c.claimB.sourceId)
    }
    return ids
  }, [conflicts])

  const filtered = events.filter(e => activeSources.has(e.source))

  function toggleSource(source: TimelineSource) {
    setActiveSources(prev => {
      const next = new Set(prev)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return next
    })
  }

  // Group by date
  const byDate = new Map<string, TimelineEvent[]>()
  for (const ev of filtered) {
    const date = formatDate(ev.timestamp)
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date)!.push(ev)
  }

  return (
    <div className="space-y-6">
      {/* Conflict banner */}
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="text-[15px] font-semibold text-orange-800">
              ⚠ POSSIBLE TIMELINE CONFLICT — {conflicts.length} found
            </span>
          </div>
          <div className="space-y-3">
            {conflicts.map(c => <ConflictCard key={c.id} conflict={c} data={data} />)}
          </div>
        </div>
      )}
      {conflicts.length === 0 && (
        <p className="text-[14px] text-slate-500">No timeline conflicts found.</p>
      )}

      {/* Controls */}
      {showControls && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCase}
            onChange={e => setSelectedCase(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
          >
            <option value="CASE-00123">CASE-00123</option>
            <option value="all">All cases</option>
            {data.cases.filter(c => c.id !== 'CASE-00123').map(c => (
              <option key={c.id} value={c.id}>{c.id}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {ALL_SOURCES.map(src => {
              const style = SOURCE_STYLES[src]
              return (
                <button
                  key={src}
                  onClick={() => toggleSource(src)}
                  className={`rounded-full border px-3 py-1 text-[13px] font-medium transition-colors ${
                    activeSources.has(src)
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 text-slate-500 hover:border-blue-400'
                  }`}
                >
                  {style.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {[...byDate.entries()].map(([date, dayEvents]) => (
          <div key={date}>
            <h3 className="mb-3 text-[15px] font-semibold text-slate-500">{date}</h3>
            <div className="space-y-2">
              {dayEvents.map(ev => {
                const style = SOURCE_STYLES[ev.source]
                const Icon = style.icon
                const hasConflict = conflictSourceIds.has(ev.sourceRecordId)
                return (
                  <div
                    key={ev.id}
                    className={`flex gap-3 rounded-lg border p-3 ${
                      hasConflict ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${style.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-medium text-slate-900">
                          {ev.title}
                          {hasConflict && <span className="ml-2 text-[13px] text-orange-600">⚠</span>}
                        </p>
                        <span className="shrink-0 font-mono text-[13px] text-slate-400">{formatTime(ev.timestamp)}</span>
                      </div>
                      <p className="mt-0.5 text-[14px] text-slate-600">{ev.description}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {ev.personIds.slice(0, 3).map(pid => (
                          <Link key={pid} to={`/persons/${pid}`} className="rounded-full bg-violet-50 px-2 py-0.5 text-[13px] text-violet-700 hover:bg-violet-100">
                            {getPersonName(data, pid)}
                          </Link>
                        ))}
                        {ev.locationId && (
                          <Link to={`/locations/${ev.locationId}`} className="rounded-full bg-rose-50 px-2 py-0.5 text-[13px] text-rose-700 hover:bg-rose-100">
                            {getLocationName(data, ev.locationId)}
                          </Link>
                        )}
                        {ev.vehicleId && (
                          <Link to={`/vehicles/${ev.vehicleId}`} className="rounded-full bg-blue-50 px-2 py-0.5 text-[13px] text-blue-700 hover:bg-blue-100">
                            {ev.vehicleId}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-[15px] text-slate-500">No events match the current filters.</p>
        )}
      </div>
    </div>
  )
}

function ConflictCard({ conflict, data }: { conflict: TimelineConflict; data: Parameters<typeof getPersonName>[0] }) {
  return (
    <div className="rounded-lg border border-orange-300 bg-white p-3">
      <p className="text-[14px] font-medium text-orange-800 mb-2">{getPersonName(data, conflict.personId)}</p>
      <div className="grid grid-cols-2 gap-3 mb-2 text-[13px]">
        <div className="rounded bg-orange-50 p-2">
          <p className="font-mono text-orange-900">{new Date(conflict.claimA.timestamp).toISOString().substring(11, 16)} UTC</p>
          <p className="text-slate-600">{getLocationName(data, conflict.claimA.locationId)}</p>
          <p className="text-slate-500 capitalize">{conflict.claimA.sourceType}</p>
        </div>
        <div className="rounded bg-orange-50 p-2">
          <p className="font-mono text-orange-900">{new Date(conflict.claimB.timestamp).toISOString().substring(11, 16)} UTC</p>
          <p className="text-slate-600">{getLocationName(data, conflict.claimB.locationId)}</p>
          <p className="text-slate-500 capitalize">{conflict.claimB.sourceType}</p>
        </div>
      </div>
      <p className="text-[13px] text-orange-900">{conflict.explanation}</p>
    </div>
  )
}
