export type ActivityAction =
  | 'case-created'
  | 'priority-changed'
  | 'status-changed'
  | 'person-added'
  | 'vehicle-linked'
  | 'evidence-uploaded'
  | 'custody-action'
  | 'note-added'
  | 'incident-added'
  | 'location-added'
  | 'vehicle-added'
  | 'document-added'
  | 'link-added'
  | 'lead-changed'
  | 'timeline-record-added';

export interface ActivityLogEntry {
  id: string;
  caseId: string;
  officerId: string;
  timestamp: string;
  action: ActivityAction;
  description: string;
}
