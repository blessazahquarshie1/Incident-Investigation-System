import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useInvestigationStore } from '../store/useInvestigationStore'

/** Loads the investigation data from the API once, then renders the app. */
export default function DataGate({ children }: { children: ReactNode }) {
  const status = useInvestigationStore((s) => s.status)
  const error = useInvestigationStore((s) => s.error)
  const load = useInvestigationStore((s) => s.load)

  useEffect(() => {
    if (status === 'idle') void load()
  }, [status, load])

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-lg font-semibold">Can't reach the API</h1>
        <p className="max-w-md text-sm opacity-70">{error}</p>
        <p className="max-w-md text-xs opacity-60">Is the Rust server running? (cd api, then cargo run)</p>
        <button type="button" onClick={() => void load()} className="rounded-md border px-4 py-2 text-sm">
          Retry
        </button>
      </div>
    )
  }

  if (status !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm opacity-70">
        Loading investigation data…
      </div>
    )
  }

  return <>{children}</>
}