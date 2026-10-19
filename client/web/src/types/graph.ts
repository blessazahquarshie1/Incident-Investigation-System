export type EntityType = 'person' | 'incident' | 'vehicle' | 'evidence' | 'location';
export interface InvestigationNode {
  id: string;
  type: EntityType;
  label: string;
}
export interface InvestigationEdge {
  source: string;
  target: string;
  relationship: 'owns' | 'visited' | 'witnessed' | 'involved-in' | 'connected-to';
}
