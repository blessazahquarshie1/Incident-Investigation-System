export interface Sighting {
  id: string;
  caseId: string;
  source: 'cctv' | 'patrol' | 'anpr' | 'informant';
  action: 'entered' | 'left' | 'seen';
  locationId: string;
  timestamp: string;
  description: string;
  vehicleId?: string;
  personId?: string;
}
