import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { ActivityLogEntry } from '../types'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { formatDate, formatTime } from '../lib/dates'
import { getOfficerName } from '../lib/lookup'
import {
  FilePlus,
  ArrowRightLeft,
  UserPlus,
  Car,
  FileSearch,
  ShieldAlert,
  StickyNote,
  SlidersHorizontal,
} from 'lucide-react'

const ACTION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'case-created': FilePlus,
  'priority-changed': SlidersHorizontal,
  'status-changed': ArrowRightLeft,
  'person-added': UserPlus,
  'vehicle-linked': Car,
  'evidence-uploaded': FileSearch,
  'custody-action': ShieldAlert,
  'note-added': StickyNote,
}

interface ActivityFeedProps {
  entries: ActivityLogEntry[]
  emptyMessage?: string
  showCaseLink?: boolean
}

export default function ActivityFeed({
  entries,
  emptyMessage = 'No recent activity recorded.',
  showCaseLink = false,
}: ActivityFeedProps) {
  const data = useInvestigationStore(s => s.data)

  // Group entries by date
  const grouped = useMemo(() => {
    // Sort descending by timestamp
    const sorted = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    const map = new Map<string, ActivityLogEntry[]>()
    for (const entry of sorted) {
      const dateKey = formatDate(entry.timestamp)
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(entry)
    }
    return map
  }, [entries])

  if (entries.length === 0) {
    return <p className="text-[14px] text-slate-500 py-4 text-center">{emptyMessage}</p>
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateStr, items]) => (
        <div key={dateStr} className="space-y-2.5">
          <div className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
            {dateStr}
          </div>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            {items.map(entry => {
              const Icon = ACTION_ICONS[entry.action] ?? ShieldAlert
              const officerName = getOfficerName(data, entry.officerId)

              return (
                <div key={entry.id} className="flex items-start gap-3 p-3 text-[14px] hover:bg-slate-50/60 transition-colors">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-slate-800">
                        <span className="font-semibold text-slate-900 mr-1.5">{officerName}</span>
                        {entry.description}
                      </p>
                      <span className="shrink-0 font-mono text-[13px] text-slate-400">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    {showCaseLink && entry.caseId && (
                      <div className="mt-1">
                        <Link
                          to={`/cases/${entry.caseId}`}
                          className="font-mono text-[12px] text-blue-600 hover:underline"
                        >
                          {entry.caseId}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
