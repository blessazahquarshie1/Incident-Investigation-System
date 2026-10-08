// Shows two person names, a large score number, level badge, and breakdown lines
import type { PairConnection, ConnectionLevel } from '../lib/connections'
import { describeScore } from '../lib/connections'

function LevelBadge({ level }: { level: ConnectionLevel }) {
  const colors: Record<ConnectionLevel, string> = {
    'WEAK': 'bg-slate-100 text-slate-600',
    'MODERATE': 'bg-blue-100 text-blue-700',
    'STRONG': 'bg-orange-100 text-orange-700',
    'VERY STRONG': 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${colors[level]}`}>
      {level}
    </span>
  )
}

interface Props {
  pair: PairConnection
  personAName: string
  personBName: string
}

export default function ConnectionScoreCard({ pair, personAName, personBName }: Props) {
  const lines = describeScore(pair)
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[15px] font-medium text-slate-900">
          {personAName} <span className="text-slate-400 mx-1">↔</span> {personBName}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-slate-900">{pair.score}</span>
          <LevelBadge level={pair.level} />
        </div>
      </div>
      {lines.length > 0 && (
        <ul className="space-y-1">
          {lines.map(line => (
            <li key={line} className="text-[14px] text-slate-600 font-mono">{line}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
