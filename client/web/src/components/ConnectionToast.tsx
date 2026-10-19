import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInvestigationStore } from '../store/useInvestigationStore'
import { X, Network, CheckCircle2, ArrowRight } from 'lucide-react'

export default function ConnectionToast() {
  const toast = useInvestigationStore(s => s.toast)
  const dismissToast = useInvestigationStore(s => s.dismissToast)
  const navigate = useNavigate()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      dismissToast()
    }, 8000)

    return () => clearTimeout(timer)
  }, [toast, dismissToast])

  if (!toast) return null

  const hasConnections = toast.changes.length > 0

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl text-slate-900 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                hasConnections ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {hasConnections ? (
                <Network className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[14px] font-semibold text-slate-900 leading-tight">
                {toast.title}
              </p>
              {hasConnections && (
                <ul className="mt-1.5 space-y-1 text-[13px] text-slate-600">
                  {toast.changes.slice(0, 3).map((change, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 font-medium leading-snug">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Close message"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {hasConnections && toast.caseId && (
          <div className="mt-3 flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                const targetCase = toast.caseId
                dismissToast()
                navigate(`/cases/${targetCase}?tab=connections`)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[13px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <span>See connections</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

