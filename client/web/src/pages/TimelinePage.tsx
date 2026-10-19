import { useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import TimelineView from '../components/TimelineView'

export default function TimelinePage() {
  useEffect(() => {
    document.title = 'Timeline · Incident Investigation System'
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline"
        description="Chronological events across all cases — incidents, sightings, evidence, phone records, and witness statements."
      />
      <TimelineView showControls={true} />
    </div>
  )
}
