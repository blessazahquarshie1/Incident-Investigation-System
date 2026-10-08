# Step 02 — TypeScript models, mock data, and the store

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
Define every entity as a TypeScript model, write realistic mock data that contains specific "stories" the later algorithms will find, and put it all in a Zustand store. This is the fake database the whole frontend runs on.

## 1. IDs
Every id is a string with a **prefix**, so an id alone tells you what it is and ids never clash between types:

`CASE-00123` (case) · `P-001` (person) · `I-004` (incident) · `E-024` (evidence) · `V-007` (vehicle) · `L-003` (location) · `O-001` (officer) · `D-001` (document) · `N-001` (note) · `WS-001` (witness statement) · `SG-001` (sighting) · `PR-001` (phone record) · `A-001` (activity entry)

## 2. Types (files in `src/types/`, re-exported from `src/types/index.ts`)

**Keep the supervisor's three models and the graph models EXACTLY as written below.** Fields marked "added" are extensions the spec implies but does not write out.

```ts
// case.ts  (exactly as in the spec; leadInvestigator holds an officer id such as "O-001")
export interface Case {
  id: string;
  title: string;
  description: string;
  type: "theft" | "fraud" | "assault" | "cybercrime" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "pending" | "closed";
  leadInvestigator: string;
  createdAt: string;   // ISO string
  updatedAt: string;
}

// person.ts  (exactly as in the spec)
export interface Person {
  id: string;
  fullName: string;
  type: "suspect" | "witness" | "victim" | "person-of-interest";
  phone?: string;
  address?: string;
  knownAliases?: string[];
  relatedCases: string[];   // case ids
}

// evidence.ts  (spec fields first, then "added" fields for chain of custody)
export interface Evidence {
  id: string;
  caseId: string;
  type: "document" | "photo" | "video" | "device" | "vehicle" | "digital";
  description: string;
  collectedAt: string;
  collectedBy: string;      // officer id
  locationId?: string;
  linkedPersons: string[];  // person ids
  // added:
  title: string;            // e.g. "Laptop"
  status: EvidenceStatus;   // always equals the status derived from custodyHistory
  custodyHistory: CustodyEntry[];
}
export type EvidenceStatus =
  | "collected" | "with-officer" | "in-evidence-room"
  | "under-analysis" | "analysed" | "released" | "destroyed";
export type CustodyAction =
  | "collected" | "transferred" | "submitted-to-evidence-room"
  | "analysis-started" | "analysis-completed" | "released" | "destroyed";
export interface CustodyEntry {
  id: string; action: CustodyAction; timestamp: string;
  officerId: string; toOfficerId?: string; note?: string;
}

// graph.ts  (exactly as in the spec)
export type EntityType = "person" | "incident" | "vehicle" | "evidence" | "location";
export interface InvestigationNode {
  id: string;
  type: EntityType;
  label: string;
}
export interface InvestigationEdge {
  source: string;
  target: string;
  relationship: "owns" | "visited" | "witnessed" | "involved-in" | "connected-to";
}
```

**Added models** (one file each; all fields below are required unless marked `?`):

| Model | Fields |
|---|---|
| `Incident` | `id, caseId, title, description, type` (same union as `Case["type"]`), `locationId, occurredAt, status: "unresolved" \| "resolved"` |
| `Vehicle` | `id, registration, make, model, color, ownerId?` (person id) |
| `Location` | `id, name, city, region` |
| `Officer` | `id, fullName, rank, badgeNumber, department` |
| `CaseDocument` | `id, caseId, title, kind: "report" \| "warrant" \| "statement" \| "court-order" \| "other", uploadedAt, uploadedBy` |
| `Note` | `id, caseId, authorId, createdAt, text` |
| `WitnessStatement` | `id, caseId, witnessId, subjectPersonId, locationId, claimedTime, recordedAt, text` (`claimedTime` = when the statement says the person was at that location) |
| `Sighting` | `id, caseId, source: "cctv" \| "patrol" \| "anpr" \| "informant", action: "entered" \| "left" \| "seen", locationId, timestamp, description, vehicleId?, personId?` |
| `PhoneRecord` | `id, caseId, personId, phoneNumber, kind: "call" \| "sms" \| "cell-tower", timestamp, locationId?` (tower location), `otherNumber?` |
| `ActivityLogEntry` | `id, caseId, officerId, timestamp, action: "case-created" \| "priority-changed" \| "status-changed" \| "person-added" \| "vehicle-linked" \| "evidence-uploaded" \| "custody-action" \| "note-added", description` |

Finally the whole dataset:

```ts
export interface InvestigationData {
  cases: Case[]; persons: Person[]; incidents: Incident[]; evidence: Evidence[];
  vehicles: Vehicle[]; locations: Location[]; officers: Officer[];
  documents: CaseDocument[]; notes: Note[]; witnessStatements: WitnessStatement[];
  sightings: Sighting[]; phoneRecords: PhoneRecord[]; activityLog: ActivityLogEntry[];
  relationships: InvestigationEdge[];   // the stored links between entities
}
```

### How "everything connects to everything" works
Two kinds of links, both stored in the data:
1. **Foreign keys on the entities themselves** (an `Evidence` has `caseId`, `locationId`, `linkedPersons`; an `Incident` has `caseId` and `locationId`; a `Vehicle` has `ownerId?`).
2. **The `relationships` list** of `InvestigationEdge` records for links that have no home field: person → vehicle (`owns`, `connected-to`), person → location (`visited`), person → incident (`involved-in`, `witnessed`). Both ids in an edge are the prefixed ids, so `source` and `target` can be any entity type.
In Step 4 a function merges both kinds into one graph.

## 3. Mock data (files in `src/data/`, one file per entity, plus `src/data/index.ts`)

Use **fictional Ghanaian-style names and real Ghanaian place names** (Accra, Tema, Kasoa, Takoradi, Kumasi, Cape Coast, and neighbourhoods). Timestamps are ISO strings ending in `Z` (Ghana uses GMT all year, so `Z` is correct and avoids timezone bugs). Use the day `2026-09-14` for the main story.

Minimum sizes: 6 officers, 10 locations, 12 cases, 26 persons, 14 incidents, 30 evidence items, 10 vehicles, 8 documents, 15 notes, 8 witness statements, 20 sightings, 16 phone records, 30 activity entries, about 80 relationships. Spread case types, priorities and statuses so the dashboard shows interesting numbers (at least 4 critical cases, every status used, every person type used, several unresolved incidents).

### The stories the algorithms must be able to find (hand-write these exactly)

**Story 1: main case.** `CASE-00123` "Armed Robbery Investigation", type `theft`, priority `high`, status `investigating`, lead investigator Officer Mensah (`O-001`). The robbery itself is incident `I-023`, which belongs to this case (it is used again in Stories 2, 5 and 6).

**Story 2: score example (13 points).** Persons `P-001` (suspect, "Person A") and `P-002` (suspect, "Person B"). They share **exactly**:
- 2 locations: both have a `visited` edge to `L-001` (Accra) and to `L-002` (Tema), and to no other common location;
- 1 vehicle: `V-001` (Toyota Hilux, registration `GT-4521-23`), `P-001` `owns` it and `P-002` is `connected-to` it;
- 1 incident: both `involved-in` `I-023` (belongs to `CASE-00123`), and no other common incident;
- 0 shared evidence, 0 shared phone numbers (different phones, no common phone record numbers).
Score = 2×2 + 1×4 + 1×5 = **13 (STRONG)**. `V-001` must also be linked to `CASE-00022` and `CASE-00031` (through persons or incidents of those cases) and to a person `P-004` ("Person D"), and be sighted at Accra, Tema and Kasoa.

**Story 3: shortest connection.** `P-001` → `V-007` → `P-003` → `I-004` → `P-006` must be the **only** path of length 4 from `P-001` to `P-006`, and there must be no shorter path. So: `P-001` and `P-003` both have an edge to `V-007`; `P-003` and `P-006` are both `involved-in` `I-004`; `P-001` is not linked to `I-004`; `P-006` visits none of the locations `P-001` visits and shares no vehicle or evidence with `P-001`.

**Story 4: shared phone.** `P-004` and `P-005` share a phone number (for example `P-005` appears in phone records using `P-004`'s number). This gives the +6 case.

**Story 5: timeline of the robbery (`CASE-00123`, 2026-09-14).** Records that sort into exactly this order:
08:03 vehicle `V-001` **entered** a location (sighting) · 08:14 phone of `P-001` **cell-tower** record · 08:20 `P-001` detected on **CCTV** (sighting with `personId`) · 08:31 incident `I-023` **occurred** · 08:45 a witness's **emergency call** to `191` (phone record, `kind: "call"`) · 09:12 vehicle `V-001` **left** the location. Also add evidence collected later that day.

**Story 6: timeline conflict.** In `CASE-00123`: a witness statement says `P-001` was in **Takoradi at 10:15**; a CCTV sighting puts `P-001` in **Accra at 10:10**. Also add one pair that must **not** conflict (`P-001` in Accra 10:10 and in Tema at 12:00).

**Story 7: chain of custody.** `E-024` "Laptop" (type `device`, `CASE-00123`) with history: 09:30 collected by Officer A → 10:45 transferred to Officer B → 14:12 submitted to evidence room → 16:00 analysis started. Also `E-031` with status `destroyed` (to prove transfers get blocked), and a few items in other statuses.

Every evidence item's `status` must equal the status that its `custodyHistory` produces (the rules are in Step 09).

## 4. Travel times (`src/data/travelTimes.ts`)
Minutes of travel between the cities used (symmetric lookup), for example Accra–Tema 45, Accra–Kasoa 50, Accra–Takoradi 270, Accra–Kumasi 300, Accra–Cape Coast 150. Export `getTravelMinutes(cityA, cityB)`: 0 for the same city, otherwise the table value, otherwise a fallback of 90.

## 5. Store and helpers
- `src/store/useInvestigationStore.ts` (Zustand): state `data: InvestigationData` (initialised from the mock data) and `currentOfficerId: "O-001"` (the pretend logged-in officer). Actions for now: `addActivity(entry)` which creates an `ActivityLogEntry` (new id, current time, current officer). More actions arrive in later steps.
- `src/lib/dates.ts`: `formatDate`, `formatTime`, `formatDateTime`, always displayed in UTC.
- `src/lib/ids.ts`: `nextId(prefix, existingIds)` that returns the next free id, for example `P-027`.
- `src/lib/lookup.ts`: small helpers like `getOfficerName(data, id)`, `getLocationName(data, id)`, `getPersonName(data, id)`.

## 6. Temporary proof on the dashboard
Until Step 03, the Dashboard page shows a simple table of how many records of each kind were loaded.

## Done when
- [ ] `npm run build` passes, no `any` anywhere.
- [ ] Dashboard placeholder shows the record counts, all at or above the minimums.
- [ ] All seven stories exist in the data exactly as described.

## Plain-language explanation (copy into LEARNING_NOTES.md)
An **interface** is a blueprint: it says what fields a thing must have. A **foreign key** is an id that points to another record (`caseId: "CASE-00123"` instead of copying the whole case). That is how **relational data** works: each fact is stored once and referenced by id. Prefixed ids mean one id string tells you the type. The **store** is the single shared place where the app's data lives so every page sees the same data.

## What I should see
The Dashboard placeholder listing the counts of cases, persons, incidents and so on.

## I should be able to explain
1. What is a foreign key, and why does `Person.relatedCases` store ids and not whole cases?
2. Why do ids have prefixes like `P-` and `V-`?
3. What are the two ways entities are connected in the data?
