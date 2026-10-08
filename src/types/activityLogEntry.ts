export interface ActivityLogEntry {
  id: string;
  caseId: string;
  officerId: string;
  timestamp: string;
  action: 'case-created' | 'priority-changed' | 'status-changed' | 'person-added' | 'vehicle-linked' | 'evidence-uploaded' | 'custody-action' | 'note-added';
  description: string;
}
