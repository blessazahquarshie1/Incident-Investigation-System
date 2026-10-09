import { useMemo, useState } from 'react'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { getCasePeople } from '../lib/caseScope'
import { calculateConnection } from '../lib/connections'
import { findShortestConnection } from '../lib/pathfinding'
import { getPersonName } from '../lib/lookup'
import { Plus } from 'lucide-react'
import ConnectionScoreCard from './ConnectionScoreCard'
import ConnectionPathView from './ConnectionPathView'
import EmptyState from './EmptyState'
import Card from './Card'
import AddConnectionModal from './AddConnectionModal'

interface Props { caseId: string }

export default function CaseConnectionsTab({ caseId }: Props) {
  const data = useInvestigationStore(s => s.data)
  const people = useMemo(() => getCasePeople(data, caseId), [data, caseId])
  const [isAddOpen, setIsAddOpen] = useState(false)

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[20px] font-semibold text-slate-900">Connections</h2>
          <p className="text-[14px] text-slate-500">Analyze links, scoring, and paths between people connected to this case.</p>
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
          <EmptyState title="No connections found" description="None of the people in this case share locations, vehicles, incidents, evidence, or phone numbers." />
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
    </div>
  )
}
