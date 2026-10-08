export interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  color: string;
  ownerId?: string; // person id
}
