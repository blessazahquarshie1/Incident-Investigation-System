export interface Person {
  id: string;
  fullName: string;
  type: 'suspect' | 'witness' | 'victim' | 'person-of-interest';
  phone?: string;
  address?: string;
  knownAliases?: string[];
  relatedCases: string[]; // case ids
}
