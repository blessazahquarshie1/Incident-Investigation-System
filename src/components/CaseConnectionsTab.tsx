import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { getCasePeople } from '../lib/caseScope'
import { calculateConnection } from '../lib/connections'
import { findShortestConnection } from '../lib/pathfinding'
import { getPersonName } from '../lib/lookup'
import { findRelatedCases, type ComparisonLevel } from '../lib/caseComparison'
import {
  Plus, Users, Car, Phone, Tag, MapPin, UserCheck, GitCompare,
} from 'lucide-react'
import ConnectionScoreCard from './ConnectionScoreCard'
import ConnectionPathView from './ConnectionPathView'
import EmptyState from './EmptyState'
import Card from './Card'
import AddConnectionModal from './AddConnectionModal'

interface Props { caseId: string }

function ComparisonBadge({ level }: { level: ComparisonLevel }) {
  const colors: Record<ComparisonLevel, string> = {
    'WEAK': 'bg-slate-100 text-slate-700 border-slate-200',
    'MODERATE': 'bg-blue-100 text-blue-800 border-blue-200',
    'STRONG': 'bg-orange-100 text-orange-800 border-orange-200',
    'VERY STRONG': 'bg-red-100 text-red-800 border-red-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-semibold ${colors[level]}`}>
      {level}
    </span>
  )
}

function StatusTypeBadge({ isPast }: { isPast: boolean }) {
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

export default function CaseConnectionsTab({ caseId }: Props) {
  const data = useInvestigationStore(s => s.data)
  const people = useMemo(() => getCasePeople(data, caseId), [data, caseId])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [caseFilter, setCaseFilter] = useState<'all' | 'current' | 'past'>('all')

  // Related cases from comparison engine
  const allRelatedCases = useMemo(() => {
    return findRelatedCases(data, caseId)
  }, [data, caseId])

  const filteredRelatedCases = useMemo(() => {
    return allRelatedCases.filter(rc => {
      if (caseFilter === 'current') return !rc.otherCaseIsPast
      if (caseFilter === 'past') return !!rc.otherCaseIsPast
      return true
    })
  }, [allRelatedCases, caseFilter])

  // All pairs with score > 0
  const pairs = useMemo(() => {
    const result = []
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const pair = calculateConnection(data, people[i].id, people[j].id)
        if (pair.score > 0) result.push(pair)
      }
    }
    return result.sort((a, b) => b.score - a.score)
  }, [data, people])

  // BFS path tool
  const [personA, setPersonA] = useState('')
  const [personB, setPersonB] = useState('')
  const [pathResult, setPathResult] = useState<ReturnType<typeof findShortestConnection> | undefined>(undefined)
  const [scoreResult, setScoreResult] = useState<ReturnType<typeof calculateConnection> | undefined>(undefined)

  function runAnalysis() {
    if (!personA || !personB) return
    setPathResult(findShortestConnection(data, personA, personB))
    setScoreResult(calculateConnection(data, personA, personB))
  }

  const allPeople = data.persons

  return (
    <div className="space-y-8">
      {/* SECTION 1: RELATED CASES */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-[20px] font-bold text-slate-900">Related cases</h2>
            <p className="text-[14px] text-slate-500">
              Other cases sharing suspect footprints, vehicles, locations, phone numbers, or evidence tags.
            </p>
          </div>

          {/* Filter: All / Current only / Past only */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setCaseFilter('all')}
              className={`rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
                caseFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allRelatedCases.length})
            </button>
            <button
              type="button"
              onClick={() => setCaseFilter('current')}
              className={`rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
                caseFilter === 'current'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current only ({allRelatedCases.filter(r => !r.otherCaseIsPast).length})
            </button>
            <button
              type="button"
              onClick={() => setCaseFilter('past')}
              className={`rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
                caseFilter === 'past'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past only ({allRelatedCases.filter(r => r.otherCaseIsPast).length})
            </button>
          </div>
        </div>

        {filteredRelatedCases.length === 0 ? (
          <EmptyState
            title="No related cases found yet"
            description="No related cases found yet. This is not proof that none exist, only that no shared details are recorded."
          />
        ) : (
          <div className="space-y-3">
            {filteredRelatedCases.map(rel => {
              const otherCase = data.cases.find(c => c.id === rel.caseBId)
              return (
                <div
                  key={rel.caseBId}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/cases/${rel.caseBId}`}
                          className="text-[17px] font-semibold text-blue-600 hover:underline"
                        >
                          {rel.caseBId}
                        </Link>
                        <span className="text-slate-400">·</span>
                        <span className="text-[15px] font-medium text-slate-900">
                          {otherCase?.title ?? rel.caseBId}
                        </span>
                        <StatusTypeBadge isPast={!!rel.otherCaseIsPast} />
                      </div>
                      <p className="text-[13px] text-slate-500 line-clamp-1">
                        {otherCase?.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-slate-900">{rel.score}</span>
                        <ComparisonBadge level={rel.level} />
                      </div>
                      <Link
                        to={`/cases/${caseId}/compare/${rel.caseBId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-1.5 text-[14px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <GitCompare className="h-4 w-4" />
                        Compare
                      </Link>
                    </div>
                  </div>

                  {/* Shared chips with icons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                    <span className="text-[13px] font-medium text-slate-500">Shared:</span>

                    {rel.sharedPersonIds.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[13px] font-medium text-violet-700 border border-violet-100">
                        <Users className="h-3.5 w-3.5" />
                        {rel.sharedPersonIds.length} person{rel.sharedPersonIds.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {rel.sharedVehicleIds.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[13px] font-medium text-blue-700 border border-blue-100">
                        <Car className="h-3.5 w-3.5" />
                        {rel.sharedVehicleIds.length} vehicle{rel.sharedVehicleIds.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {rel.sharedPhoneNumbers.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[13px] font-medium text-emerald-700 border border-emerald-100">
                        <Phone className="h-3.5 w-3.5" />
                        {rel.sharedPhoneNumbers.length} phone number{rel.sharedPhoneNumbers.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {rel.sharedEvidenceTags.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[13px] font-medium text-amber-700 border border-amber-100">
                        <Tag className="h-3.5 w-3.5" />
                        {rel.sharedEvidenceTags.length} evidence tag{rel.sharedEvidenceTags.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {rel.sharedLocationIds.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[13px] font-medium text-rose-700 border border-rose-100">
                        <MapPin className="h-3.5 w-3.5" />
                        {rel.sharedLocationIds.length} place{rel.sharedLocationIds.length > 1 ? 's' : ''}
                      </span>
                    )}

                    {rel.nameMatches.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[13px] font-medium text-purple-700 border border-purple-100">
                        <UserCheck className="h-3.5 w-3.5" />
                        possible name match
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: PEOPLE IN THIS CASE */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-slate-900">People in this case</h2>
            <p className="text-[14px] text-slate-500">
              Analyze direct links, shared footprints, and BFS connection paths between individuals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add connection
          </button>
        </div>

        <AddConnectionModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          caseId={caseId}
        />

        {/* Pair table */}
        <Card title="Connection pairs">
          {pairs.length === 0 ? (
            <EmptyState
              title="No connections found"
              description="None of the people in this case share locations, vehicles, incidents, evidence, or phone numbers."
            />
          ) : (
            <div className="space-y-2">
              {pairs.map(pair => (
                <ConnectionScoreCard
                  key={`${pair.personAId}-${pair.personBId}`}
                  pair={pair}
                  personAName={getPersonName(data, pair.personAId)}
                  personBName={getPersonName(data, pair.personBId)}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Path-finding tool */}
        <Card title="How are these two people connected?">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-slate-600">Person A</label>
              <select
                value={personA}
                onChange={e => setPersonA(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a person…</option>
                {allPeople.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-slate-600">Person B</label>
              <select
                value={personB}
                onChange={e => setPersonB(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a person…</option>
                {allPeople.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            </div>
            <button
              onClick={runAnalysis}
              disabled={!personA || !personB}
              className="rounded-lg bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Find connection
            </button>
          </div>

          {pathResult !== undefined && (
            <div className="mt-4 space-y-3">
              {pathResult === null ? (
                <p className="text-[15px] text-slate-600">No connection found between these two people.</p>
              ) : (
                <>
                  <p className="text-[14px] text-slate-500">Path length: {pathResult.length} steps</p>
                  <ConnectionPathView path={pathResult} />
                </>
              )}
              {scoreResult && scoreResult.score > 0 && (
                <ConnectionScoreCard
                  pair={scoreResult}
                  personAName={getPersonName(data, personA)}
                  personBName={getPersonName(data, personB)}
                />
              )}
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}
