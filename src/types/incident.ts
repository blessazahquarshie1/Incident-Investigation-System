export interface Incident {
  id: string;
  caseId: string;
  title: string;
  description: string;
  type: 'theft' | 'fraud' | 'assault' | 'cybercrime' | 'other';
  locationId: string;
  occurredAt: string;
  status: 'unresolved' | 'resolved';
}
