import { useState } from 'react'
import { Plus, MessageSquare, Eye, Phone } from 'lucide-react'
import TimelineView from './TimelineView'
import AddWitnessStatementModal from './AddWitnessStatementModal'
import AddSightingModal from './AddSightingModal'
import AddPhoneRecordModal from './AddPhoneRecordModal'

interface Props { caseId: string }

// Shows the full timeline for a single case, scoped to that case's events only,
// with controls to add new timeline records (witness statements, sightings, phone records).
export default function CaseTimelineTab({ caseId }: Props) {
  const [isWsOpen, setIsWsOpen] = useState(false)
  const [isSightingOpen, setIsSightingOpen] = useState(false)
  const [isPhoneOpen, setIsPhoneOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-slate-900">Case Timeline</h2>
          <p className="text-[14px] text-slate-500">Chronological chain of events, presence claims, and conflict checks.</p>
        </div>

        <div className="relative inline-block text-left">
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWsOpen(true)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
            >
              <MessageSquare className="h-4 w-4 text-violet-600" />
              Witness statement
            </button>
            <button
              type="button"
              onClick={() => setIsSightingOpen(true)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
            >
              <Eye className="h-4 w-4 text-slate-600" />
              Sighting
            </button>
            <button
              type="button"
              onClick={() => setIsPhoneOpen(true)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
            >
              <Phone className="h-4 w-4 text-rose-600" />
              Phone record
            </button>
          </div>

          <div className="sm:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add timeline record
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 p-1">
                <button
                  type="button"
                  onClick={() => { setIsWsOpen(true); setIsMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-[14px] text-slate-700 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4 text-violet-600" />
                  Witness statement
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSightingOpen(true); setIsMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-[14px] text-slate-700 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <Eye className="h-4 w-4 text-slate-600" />
                  Sighting
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPhoneOpen(true); setIsMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-[14px] text-slate-700 hover:bg-slate-100 rounded flex items-center gap-2"
                >
                  <Phone className="h-4 w-4 text-rose-600" />
                  Phone record
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddWitnessStatementModal
        isOpen={isWsOpen}
        onClose={() => setIsWsOpen(false)}
        caseId={caseId}
      />

      <AddSightingModal
        isOpen={isSightingOpen}
        onClose={() => setIsSightingOpen(false)}
        caseId={caseId}
      />

      <AddPhoneRecordModal
        isOpen={isPhoneOpen}
        onClose={() => setIsPhoneOpen(false)}
        caseId={caseId}
      />

      <TimelineView caseId={caseId} showControls={false} />
    </div>
  )
}
