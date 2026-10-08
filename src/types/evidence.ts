export type EvidenceStatus =
  | 'collected' | 'with-officer' | 'in-evidence-room'
  | 'under-analysis' | 'analysed' | 'released' | 'destroyed';
export type CustodyAction =
  | 'collected' | 'transferred' | 'submitted-to-evidence-room'
  | 'analysis-started' | 'analysis-completed' | 'released' | 'destroyed';
export interface CustodyEntry {
  id: string;
  action: CustodyAction;
  timestamp: string;
  officerId: string;
  toOfficerId?: string;
  note?: string;
}
export interface Evidence {
  id: string;
  caseId: string;
  type: 'document' | 'photo' | 'video' | 'device' | 'vehicle' | 'digital';
  description: string;
  collectedAt: string;
  collectedBy: string; // officer id
  locationId?: string;
  linkedPersons: string[]; // person ids
  title: string;
  status: EvidenceStatus;
  custodyHistory: CustodyEntry[];
}
