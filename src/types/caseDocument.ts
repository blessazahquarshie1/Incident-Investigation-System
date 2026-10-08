export interface CaseDocument {
  id: string;
  caseId: string;
  title: string;
  kind: 'report' | 'warrant' | 'statement' | 'court-order' | 'other';
  uploadedAt: string;
  uploadedBy: string; // officer id
}
