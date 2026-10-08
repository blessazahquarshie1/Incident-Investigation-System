import type { Case } from './case';
import type { Person } from './person';
import type { Incident } from './incident';
import type { Evidence } from './evidence';
import type { Vehicle } from './vehicle';
import type { Location } from './location';
import type { Officer } from './officer';
import type { CaseDocument } from './caseDocument';
import type { Note } from './note';
import type { WitnessStatement } from './witnessStatement';
import type { Sighting } from './sighting';
import type { PhoneRecord } from './phoneRecord';
import type { ActivityLogEntry } from './activityLogEntry';
import type { InvestigationEdge } from './graph';

export interface InvestigationData {
  cases: Case[];
  persons: Person[];
  incidents: Incident[];
  evidence: Evidence[];
  vehicles: Vehicle[];
  locations: Location[];
  officers: Officer[];
  documents: CaseDocument[];
  notes: Note[];
  witnessStatements: WitnessStatement[];
  sightings: Sighting[];
  phoneRecords: PhoneRecord[];
  activityLog: ActivityLogEntry[];
  relationships: InvestigationEdge[];
}
