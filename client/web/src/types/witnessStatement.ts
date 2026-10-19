export interface WitnessStatement {
  id: string;
  caseId: string;
  witnessId: string; // person id
  subjectPersonId: string; // person id of person being described
  locationId: string;
  claimedTime: string; // ISO - when the witness says the subject was there
  recordedAt: string;
  text: string;
}
