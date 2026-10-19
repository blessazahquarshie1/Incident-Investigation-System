export interface PhoneRecord {
  id: string;
  caseId: string;
  personId: string;
  phoneNumber: string;
  kind: 'call' | 'sms' | 'cell-tower';
  timestamp: string;
  locationId?: string; // cell tower location
  otherNumber?: string;
}
