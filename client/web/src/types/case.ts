export interface Case {
  id: string;
  title: string;
  description: string;
  type: 'theft' | 'fraud' | 'assault' | 'cybercrime' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'pending' | 'closed';
  leadInvestigator: string; // officer id e.g. "O-001"
  createdAt: string; // ISO string
  updatedAt: string;
}
