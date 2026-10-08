
import type { InvestigationData } from '../types';
import { officers } from './officers';
import { locations } from './locations';
import { cases } from './cases';
import { persons } from './persons';
import { incidents } from './incidents';
import { evidence } from './evidence';
import { vehicles } from './vehicles';
import { documents } from './documents';
import { notes } from './notes';
import { witnessStatements } from './witnessStatements';
import { sightings } from './sightings';
import { phoneRecords } from './phoneRecords';
import { activityLog } from './activityLog';
import { relationships } from './relationships';

export const mockData: InvestigationData = {
  officers,
  locations,
  cases,
  persons,
  incidents,
  evidence,
  vehicles,
  documents,
  notes,
  witnessStatements,
  sightings,
  phoneRecords,
  activityLog,
  relationships
};
