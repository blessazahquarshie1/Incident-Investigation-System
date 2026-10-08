import EmptyState from './EmptyState'

interface Props { caseId: string }
export default function CaseConnectionsTab({ caseId: _ }: Props) {
  return <EmptyState title="Connections" description="Connection analysis is built in Step 06." />
}
