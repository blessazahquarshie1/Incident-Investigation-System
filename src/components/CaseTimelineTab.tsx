import TimelineView from './TimelineView'

interface Props { caseId: string }

// Shows the full timeline for a single case, scoped to that case's events only
export default function CaseTimelineTab({ caseId }: Props) {
  return <TimelineView caseId={caseId} showControls={false} />
}
