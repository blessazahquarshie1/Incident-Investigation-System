import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  useEffect(() => {
    document.title = '404 Not Found · Incident Investigation System'
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page not found"
        description="The requested investigation page or resource could not be found."
      />
      <EmptyState
        title="404 — Record or page not located"
        description="The path you navigated to does not exist or may have been relocated. Verify the case identifier or URL address."
        action={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Return to dashboard</span>
          </Link>
        }
      />
    </div>
  )
}
