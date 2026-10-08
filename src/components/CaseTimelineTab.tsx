import EmptyState from './EmptyState'

interface Props { caseId: string }
export default function CaseTimelineTab({ caseId: _ }: Props) {
  return <EmptyState title="Timeline" description="The case timeline is built in Step 07." />
}
