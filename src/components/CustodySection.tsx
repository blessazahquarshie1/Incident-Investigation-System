import { useState } from 'react'
import type { Evidence, CustodyAction } from '../types'
import { useInvestigationStore } from '../store/useInvestigationStore'
import {
  deriveStatus,
  getAllowedActions,
  getCurrentHolderId,
} from '../lib/custody'
import { getOfficerName } from '../lib/lookup'
import { formatDate, formatTime } from '../lib/dates'
import StatusBadge from './StatusBadge'
import Card from './Card'
import Modal from './Modal'
import {
  ArrowRightLeft,
  Archive,
  FlaskConical,
  CheckCircle,
  FileText,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

const ALL_CUSTODY_ACTIONS: Array<{ action: CustodyAction; label: string; icon: React.FC<{ className?: string }> }> = [
  { action: 'transferred', label: 'Transfer', icon: ArrowRightLeft },
  { action: 'submitted-to-evidence-room', label: 'Submit to room', icon: Archive },
  { action: 'analysis-started', label: 'Start analysis', icon: FlaskConical },
  { action: 'analysis-completed', label: 'Complete analysis', icon: CheckCircle },
  { action: 'released', label: 'Release', icon: FileText },
  { action: 'destroyed', label: 'Destroy', icon: Trash2 },
]

interface CustodySectionProps {
  evidence: Evidence
}

export default function CustodySection({ evidence }: CustodySectionProps) {
  const data = useInvestigationStore(s => s.data)
  const currentOfficerId = useInvestigationStore(s => s.currentOfficerId)
  const applyCustodyAction = useInvestigationStore(s => s.applyEvidenceCustodyAction)

  const currentHolderId = getCurrentHolderId(evidence)
  const currentHolderName = getOfficerName(data, currentHolderId)
  const currentStatus = deriveStatus(evidence.custodyHistory)
  const allowedActions = getAllowedActions(evidence)

  // Modals & form state
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferToOfficerId, setTransferToOfficerId] = useState('')
  const [transferNote, setTransferNote] = useState('')

  const [confirmAction, setConfirmAction] = useState<CustodyAction | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Group history entries by day
  const groupedHistory = evidence.custodyHistory.reduce((acc, entry) => {
    const day = formatDate(entry.timestamp)
    if (!acc[day]) acc[day] = []
    acc[day].push(entry)
    return acc
  }, {} as Record<string, typeof evidence.custodyHistory>)

  function handleActionClick(action: CustodyAction) {
    setErrorMessage(null)

    if (action === 'transferred') {
      // Find default other officer
      const otherOfficer = data.officers.find(o => o.id !== currentHolderId)
      setTransferToOfficerId(otherOfficer?.id ?? '')
      setTransferNote('')
      setTransferModalOpen(true)
      return
    }

    if (action === 'destroyed' || action === 'released') {
      setConfirmAction(action)
      return
    }

    // Direct actions: submitted-to-evidence-room, analysis-started, analysis-completed
    const res = applyCustodyAction(evidence.id, action)
    if (!res.ok) {
      setErrorMessage(res.reason)
    }
  }

  function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!transferToOfficerId) return

    const res = applyCustodyAction(evidence.id, 'transferred', {
      toOfficerId: transferToOfficerId,
      note: transferNote || undefined,
    })

    if (!res.ok) {
      setErrorMessage(res.reason)
    } else {
      setTransferModalOpen(false)
      setTransferNote('')
    }
  }

  function handleConfirmExecute() {
    if (!confirmAction) return
    const res = applyCustodyAction(evidence.id, confirmAction)
    if (!res.ok) {
      setErrorMessage(res.reason)
    }
    setConfirmAction(null)
  }

  // Get reason why an action is blocked
  function getActionDisabledReason(action: CustodyAction): string | null {
    if (allowedActions.includes(action)) return null

    if (currentStatus === 'destroyed') {
      return `Evidence ${evidence.id} cannot be ${action}: it has already been marked destroyed.`
    }
    if (currentStatus === 'released') {
      return `Evidence ${evidence.id} cannot be ${action}: it has already been released.`
    }
    return `Not permitted while status is '${currentStatus}'. Allowed: ${allowedActions.join(', ') || 'none'}.`
  }

  return (
    <div id="custody-section" className="space-y-6">
      <Card title="Chain of custody">
        {/* Status & Custodian Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4 border border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide block">Current status</span>
              <div className="mt-1">
                <StatusBadge status={currentStatus} />
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div>
              <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide block">Current custodian</span>
              <span className="text-[14px] font-medium text-slate-900 mt-1 block">
                {currentHolderName} <span className="font-mono text-slate-400 text-[13px]">({currentHolderId})</span>
              </span>
            </div>
          </div>
          <div className="text-[13px] text-slate-500">
            Active logged-in officer: <span className="font-semibold text-slate-700">{getOfficerName(data, currentOfficerId)}</span>
          </div>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-[13px] text-red-700 border border-red-200 mb-4">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Custody History Log */}
        <div className="space-y-4 mb-6">
          <h4 className="text-[14px] font-semibold text-slate-800">Handling history</h4>
          <div className="space-y-6 border-l-2 border-slate-200 ml-4 pl-4">
            {Object.entries(groupedHistory).map(([dateStr, entries]) => (
              <div key={dateStr} className="space-y-3">
                <div className="text-[13px] font-bold text-slate-500 uppercase tracking-wider -ml-8 bg-white pr-2 inline-block">
                  {dateStr}
                </div>
                {entries.map(entry => {
                  const officer = getOfficerName(data, entry.officerId)
                  const toOfficer = entry.toOfficerId ? getOfficerName(data, entry.toOfficerId) : ''

                  let actionText = ''
                  if (entry.action === 'collected') {
                    actionText = `Collected by ${officer}`
                  } else if (entry.action === 'transferred') {
                    actionText = `Transferred to ${toOfficer}`
                  } else if (entry.action === 'submitted-to-evidence-room') {
                    actionText = `Submitted to evidence room by ${officer}`
                  } else if (entry.action === 'analysis-started') {
                    actionText = `Digital analysis started by ${officer}`
                  } else if (entry.action === 'analysis-completed') {
                    actionText = `Analysis completed by ${officer}`
                  } else if (entry.action === 'released') {
                    actionText = `Released by ${officer}`
                  } else if (entry.action === 'destroyed') {
                    actionText = `Destroyed by ${officer}`
                  }

                  return (
                    <div key={entry.id} className="relative pb-2">
                      <div className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[13px] font-semibold text-slate-500">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className="text-[14px] font-medium text-slate-900">
                          {actionText}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="mt-0.5 text-[13px] text-slate-500 italic">Note: {entry.note}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Grid with Visible Blocked Reasons */}
        <div className="border-t border-slate-100 pt-5">
          <h4 className="text-[14px] font-semibold text-slate-800 mb-3">Custody actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_CUSTODY_ACTIONS.map(({ action, label, icon: Icon }) => {
              const disabledReason = getActionDisabledReason(action)
              const isAllowed = !disabledReason

              return (
                <div
                  key={action}
                  className={`flex flex-col justify-between rounded-lg border p-3 transition-colors ${
                    isAllowed
                      ? 'border-slate-300 bg-white hover:border-blue-400 hover:shadow-sm'
                      : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isAllowed ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-[14px] font-semibold ${isAllowed ? 'text-slate-800' : 'text-slate-500'}`}>
                        {label}
                      </span>
                    </div>
                    <button
                      onClick={() => handleActionClick(action)}
                      disabled={!isAllowed}
                      className={`rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
                        isAllowed
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Execute
                    </button>
                  </div>
                  {disabledReason && (
                    <p className="text-[13px] text-red-600 font-medium leading-tight">
                      {disabledReason}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Transfer Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer evidence custody"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <p className="text-[13px] text-slate-600">
            Transfer responsibility for <strong>{evidence.title} ({evidence.id})</strong> to another sworn officer.
          </p>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">
              Receiving officer
            </label>
            <select
              value={transferToOfficerId}
              onChange={e => setTransferToOfficerId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-[14px] focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select receiving officer…</option>
              {data.officers
                .filter(o => o.id !== currentHolderId)
                .map(o => (
                  <option key={o.id} value={o.id}>
                    {o.fullName} ({o.rank} — {o.badgeNumber})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">
              Transfer note (optional)
            </label>
            <input
              type="text"
              value={transferNote}
              onChange={e => setTransferNote(e.target.value)}
              placeholder="e.g. Handover for forensic lab inspection"
              className="w-full rounded-lg border border-slate-300 p-2 text-[14px] focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
            >
              Confirm transfer
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Destroy or Release */}
      <Modal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'destroyed' ? 'Confirm destruction of evidence' : 'Confirm release of evidence'}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[13px] text-amber-800">
              <p className="font-semibold mb-1">Warning: Irreversible action</p>
              <p>
                {confirmAction === 'destroyed'
                  ? `Marking ${evidence.id} as DESTROYED is permanent. Once destroyed, no further transfers or analysis can ever be performed.`
                  : `Releasing ${evidence.id} completes its active investigation custody cycle.`}
              </p>
            </div>
          </div>
          <p className="text-[13px] text-slate-600">
            Are you sure you want to mark <strong>{evidence.title} ({evidence.id})</strong> as{' '}
            <strong className="uppercase">{confirmAction}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmExecute}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium text-white ${
                confirmAction === 'destroyed' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Yes, proceed
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
