# Specification Coverage Checklist

This checklist verifies every requirement from `docs/steps/10_reports_polish.md` Section 3 against the implemented codebase in the Incident Investigation and Case Intelligence Management System.

All features are tested, verified, and operational with zero TypeScript errors and 100% passing automated test suites.

---

## 1. Domain Models & TypeScript Schema

- [x] **Core Models (`Case`, `Person`, `Evidence`, `InvestigationNode`, `InvestigationEdge`)**
  - **Location:** `src/types/case.ts`, `src/types/person.ts`, `src/types/evidence.ts`, `src/types/graph.ts`
  - Exact property signatures matching specification (e.g., `leadInvestigator`, `relatedCases`, `custodyHistory`, `InvestigationEdge.relationship`).
- [x] **Auxiliary Models (`Incident`, `Vehicle`, `Location`, `Officer`, `CaseDocument`, `Note`, `WitnessStatement`, `Sighting`, `PhoneRecord`, `ActivityLogEntry`)**
  - **Location:** `src/types/incident.ts`, `src/types/vehicle.ts`, `src/types/location.ts`, `src/types/officer.ts`, `src/types/caseDocument.ts`, `src/types/note.ts`, `src/types/witnessStatement.ts`, `src/types/sighting.ts`, `src/types/phoneRecord.ts`, `src/types/activityLogEntry.ts`
- [x] **Master Schema Aggregator (`InvestigationData` & Re-exports)**
  - **Location:** `src/types/investigationData.ts`, `src/types/index.ts`
  - Re-exports all 15 entity types cleanly with zero implicit `any`.

---

## 2. Relational & Graph Connectivity

- [x] **Entity Inter-connectivity via Foreign Keys & Relationships**
  - **Location:** `src/lib/graph.ts` (`buildGraph`, `getNeighbors`, `getNodeEdges`, `getLinkedCaseIds`)
  - Synthesizes explicitly declared edges (`relationships.ts`) with foreign key links (Evidence `linkedPersons`, Evidence `locationId`, Incident `locationId`, Vehicle `ownerId`) into a cohesive undirected multi-type investigation network.

---

## 3. Application Pages & Routing

- [x] **Dashboard Page (`/`)**
  - **Location:** `src/pages/DashboardPage.tsx`
  - Displays high-level intelligence summaries, stat cards, distribution charts, urgent cases, and recent activity.
- [x] **Cases Page (`/cases`)**
  - **Location:** `src/pages/CasesPage.tsx`
  - Sortable/filterable table of cases with "New case" modal form triggering store mutations.
- [x] **Incidents Page (`/incidents`)**
  - **Location:** `src/pages/IncidentsPage.tsx`, `src/pages/IncidentDetailPage.tsx`
  - List of incidents with status filtering and detailed view with linked entities.
- [x] **Persons Page (`/persons`)**
  - **Location:** `src/pages/PersonsPage.tsx`, `src/pages/PersonDetailPage.tsx`
  - Person directory with role badges, aliases, and detail view featuring direct connections analysis.
- [x] **Evidence Page (`/evidence`)**
  - **Location:** `src/pages/EvidencePage.tsx`, `src/pages/EvidenceDetailPage.tsx`
  - Evidence catalog with status filtering and detail view with interactive custody workbench.
- [x] **Vehicles Page (`/vehicles`)**
  - **Location:** `src/pages/VehiclesPage.tsx`, `src/pages/VehicleDetailPage.tsx`
  - Registration lookup, ownership display, and detail view with sightings and linkages.
- [x] **Locations Page (`/locations`)**
  - **Location:** `src/pages/LocationsPage.tsx`, `src/pages/LocationDetailPage.tsx`
  - City/region directory with incident density counts and connected incident lists.
- [x] **Timeline Page (`/timeline`)**
  - **Location:** `src/pages/TimelinePage.tsx`, `src/components/TimelineView.tsx`
  - Chronological multi-source event stream with conflict detection banners.
- [x] **Relationship Graph Page (`/graph`)**
  - **Location:** `src/pages/RelationshipGraphPage.tsx`, `src/lib/graphLayout.ts`
  - Interactive React Flow canvas with deterministic d3-force layout, case selector, filter toggles, search focus, side panel, and path comparison tool.
- [x] **Investigators Page (`/investigators`)**
  - **Location:** `src/pages/InvestigatorsPage.tsx`
  - Officer directory with caseload, evidence collection counts, and operational activity summaries.
- [x] **Reports Page (`/reports`)**
  - **Location:** `src/pages/ReportsPage.tsx`, `src/lib/report.ts`
  - Printable CID intelligence dossier with 7 sections, case selector, and clean print stylesheet.

---

## 4. Key Performance Indicators & Dashboard Metrics

- [x] **Required Operational Counts**
  - **Location:** `src/lib/dashboard.ts` (`getDashboardStats`), `src/pages/DashboardPage.tsx`
  - Correctly calculates:
    - Open cases (`openCases`)
    - Critical cases (`criticalCases`)
    - Persons of interest (`personsOfInterest`)
    - Evidence items (`evidenceItems`)
    - Active investigations (`activeInvestigations`)
    - Unresolved incidents (`unresolvedIncidents`)
    - Suspects (`suspects`)
  - Visualized via 7 responsive `StatCard` components linked to pre-filtered list pages.

---

## 5. Comprehensive Case Detail (9 Tabs)

- [x] **Case Detail Workbench (`/cases/:caseId`)**
  - **Location:** `src/pages/CaseDetailPage.tsx`, `src/lib/caseScope.ts`
  - Includes all 9 specified tabs synchronized with URL query params (`?tab=...`):
    1. **Overview:** Case metadata, incident list, documents list, and forms to change priority and status.
    2. **People:** Grouped by type (suspects, witnesses, victims, POIs) with "Add person to case" modal (existing or new).
    3. **Evidence:** Item inventory with custody statuses and "Upload evidence" submission form.
    4. **Timeline:** Chronologically filtered event stream for the case with localized conflict alerts (`CaseTimelineTab.tsx`).
    5. **Locations:** Associated scenes and places with contextual "Connected via" explanations.
    6. **Vehicles:** Impounded and linked vehicles with "Link vehicle to person" form.
    7. **Connections:** Case network link analysis displaying scored pairs and BFS pathfinder (`CaseConnectionsTab.tsx`).
    8. **Notes:** Chronological investigator notes feed with "Add note" submission.
    9. **Activity Log:** Dedicated audit feed filtered to the current case with action-type dropdown.

---

## 6. Relationship Graph Visualization

- [x] **Interactive Canvas Engine**
  - **Location:** `src/pages/RelationshipGraphPage.tsx`, `src/lib/graphLayout.ts`
  - Built with `@xyflow/react` (React Flow v12) and `d3-force`.
  - Deterministic synchronous 300-tick force simulation prevents visual node jitter.
  - Custom nodes styled per entity type with entity badges and lucide icons (`ENTITY_STYLE`).
  - Styled relationship edges: `owns` (solid blue), `visited` (dashed pink), `witnessed` (dotted purple), `involved-in` (thick orange), `connected-to` (long-dash slate).
  - Features case filtering (`CASE-00123` default or entire network), entity type toggle pills, node search with zoom-in camera focus, side panel with neighbor exploration, and shortest path visualization.

---

## 7. Connection Strength & Scoring Algorithm

- [x] **Multi-factor Associative Weighting**
  - **Location:** `src/lib/connections.ts` (`SCORE_WEIGHTS`, `calculateConnection`, `classifyScore`)
  - Implements exact weights:
    - Shared visited location: **2 pts**
    - Shared owned/linked vehicle: **4 pts**
    - Shared incident: **5 pts**
    - Shared seized evidence: **5 pts**
    - Shared phone number: **6 pts**
  - Classifies scores into qualitative tiers:
    - `0–4`: **WEAK**
    - `5–9`: **MODERATE**
    - `10–15`: **STRONG**
    - `16+`: **VERY STRONG**
  - **Story 2 Verification:** Kwame Asante (`P-001`) and Kofi Mensah (`P-002`) score exactly **13 STRONG** (2 locations [4 pts] + 1 vehicle [4 pts] + 1 incident [5 pts]).
  - **Test Coverage:** `src/lib/__tests__/connections.test.ts` (11 passing tests).

---

## 8. Entity Footprint & Direct Associations

- [x] **Aggregated Connections API (`findConnections`)**
  - **Location:** `src/lib/connections.ts` (`findConnections`)
  - Matches spec output shape:
    - `sharedPeople: string[]`
    - `sharedVehicles: string[]`
    - `sharedLocations: string[]`
    - `sharedIncidents: string[]`
    - `sharedEvidence: string[]`
    - `connectionScore: number` (maximum single-pair score)
    - `connections: PairConnection[]` (sorted descending by score)
  - Integrated into `PersonDetailPage.tsx` and `CaseConnectionsTab.tsx`.

---

## 9. Shortest Path Graph Traversal (BFS)

- [x] **Breadth-First Search Pathfinding**
  - **Location:** `src/lib/pathfinding.ts` (`findShortestConnection`)
  - Evaluates shortest degrees of separation across the multi-entity graph.
  - **Story 3 Verification:** Finds the 5-node, length 4 path:
    `P-001` → `V-007` → `P-003` → `I-004` → `P-006`
  - **Test Coverage:** `src/lib/__tests__/pathfinding.test.ts` (3 passing tests).
  - Visualized as node chip chains in `ConnectionPathView.tsx` and highlighted directly on the React Flow canvas.

---

## 10. Multi-source Timeline Synthesis

- [x] **Chronological Normalization Engine**
  - **Location:** `src/lib/timeline.ts` (`buildTimeline`)
  - Normalizes heterogeneous sources into a unified timestamped timeline:
    1. Evidence (`collectedAt`)
    2. Incidents (`occurredAt`)
    3. Location/Person CCTV sightings (`timestamp`)
    4. Vehicle ANPR sightings (`timestamp`)
    5. Witness statements (`recordedAt`)
    6. Phone records & cell-tower pings (`timestamp`)
  - **Story 5 Verification:** Armed robbery timeline on `2026-09-14` orders events precisely from 08:03 ANPR entry to 09:12 ANPR exit.
  - **Test Coverage:** `src/lib/__tests__/timeline.test.ts`.

---

## 11. Timeline Conflict & Alibi Detection

- [x] **Physical Impossibility Detection Engine**
  - **Location:** `src/lib/conflicts.ts` (`detectTimelineConflicts`), `src/data/travelTimes.ts`
  - Compares presence timestamps for the same person against physical travel times between cities.
  - **Story 6 Verification:**
    - Flags contradiction: Kwame Asante (`P-001`) at Takoradi (`L-005`) at 10:15 UTC (witness statement) vs Accra (`L-001`) at 10:10 UTC (CCTV sighting) — 5 minute gap vs 270 minute required travel time.
    - Confirms non-conflict: Accra at 10:10 UTC to Tema at 12:00 UTC (110 min gap vs 45 min travel time) is valid.
  - **Test Coverage:** `src/lib/__tests__/timeline.test.ts` (passing conflict and non-conflict assertions).

---

## 12. Evidence Chain of Custody & Rule Enforcement

- [x] **Finite State Machine & Custody Integrity**
  - **Location:** `src/lib/custody.ts` (`validateCustodyAction`, `deriveStatus`, `ALLOWED_ACTIONS`, `BLOCKED_REASONS`)
  - **Story 7 Verification:**
    - Laptop `E-024` custody chain derives status `under-analysis`.
    - Blocked action: Destroyed evidence (`E-031`) cannot be transferred or analysed; UI disables buttons and provides clear explanatory reasons.
    - Append-only audit history guarantees tamper resistance.
  - **Test Coverage:** `src/lib/__tests__/custody.test.ts` (8 passing unit tests).
  - Interactive modal UI in `src/components/CustodySection.tsx`.

---

## 13. Advanced Multi-entity Search

- [x] **Fast Global Search & Enrichment**
  - **Location:** `src/lib/search.ts` (`searchAll`, `getResultPath`), `src/pages/SearchPage.tsx`, `src/components/AppShell.tsx`
  - Normalized substring and prefix scoring across:
    - Person names, aliases, and phone numbers
    - Vehicle registration, make, model
    - Case IDs and titles
    - Evidence IDs, titles, and descriptions
    - Location names and cities
    - Incident IDs, titles, and descriptions
  - Top-bar quick lookup dropdown with debounce (200ms) and comprehensive `/search` results view with entity type filter chips.

---

## 14. Unified Operational Audit Logging

- [x] **Chronological Activity Feed**
  - **Location:** `src/store/useInvestigationStore.ts`, `src/components/ActivityFeed.tsx`, `src/data/activityLog.ts`
  - Tracks and records major state mutations:
    - Case creation
    - Priority adjustments
    - Status modifications
    - Person addition and linking
    - Vehicle linking
    - Evidence submission
    - Chain of custody handovers
    - Investigator notes
  - Formatted into day-grouped audit cards with relative time and direct case links.

---

## 15. Cross-Case Comparison Engine & Lead Generation

- [x] **Case Fingerprinting & Symmetric Pairwise Scoring**
  - **Location:** `src/lib/caseFingerprint.ts`, `src/lib/caseComparison.ts`, `src/lib/leads.ts`
  - Extracts case operational fingerprints (normalized phones, lowercase evidence tags, locations, vehicles, persons, incident minutes of day).
  - Implements exact signal weights:
    - Shared phone number: **6 pts**
    - Shared person: **5 pts**
    - Shared vehicle: **5 pts**
    - Shared evidence tag: **4 pts**
    - Shared location: **2 pts**
    - Similar time of day (within 90 min): **1 pt**
    - Same case type: **1 pt**
    - Speculative name matches (exact name: 3, shared alias: 3, surname: 1): capped at **5 pts**
  - Classifies comparison score into tiers: `0–3`: **WEAK**, `4–9`: **MODERATE**, `10–17`: **STRONG**, `18+`: **VERY STRONG**.
  - Generates prioritized investigative leads (`high` -> `medium` -> `low`) with clickable entity links.
  - **Test Coverage:** `src/lib/__tests__/caseComparison.test.ts` (9 tests passing).

---

## 16. Related Cases Workspace & Side-by-Side Comparison

- [x] **Case Details Related Cases Section**
  - **Location:** `src/components/CaseConnectionsTab.tsx`
  - Organised into two clear sections: **Related cases** (top) and **People in this case** (Step 06 content).
  - Related cases table displays case ID/title, Current/Past badge (`closed` = Past), score, level badge, shared item chips (`people`, `vehicles`, `phones`, `evidence tags`, `places`, `possible name match`), and a Compare button.
  - Interactive filter: "All / Current only / Past only".
- [x] **Side-by-Side Compare Page (`/cases/:caseId/compare/:otherCaseId`)**
  - **Location:** `src/pages/CaseComparePage.tsx`
  - Side-by-side header with large numerical score, level badge, and mathematical breakdown.
  - **Where to look:** Prominent prioritized investigative leads with direct entity links.
  - **What they share:** Categorized cards for shared people, vehicles, locations, phones, and evidence tags.
  - **Possible same person:** Side-by-side records with `Exact name`, `Shared alias`, or `Surname only` labels and careful notice: *"These are different records. Check whether they are the same person."*
  - **Side-by-side timelines:** Chronological event streams for both cases highlighting events at shared locations in UTC.
  - Handles self-comparison redirects and missing case error states.

---

## 17. Case Network Map & Intelligent Name Search

- [x] **Case Network on Relationship Graph Page**
  - **Location:** `src/pages/RelationshipGraphPage.tsx`
  - Two-option top toggle: **Entities** (Step 08 view) vs **Cases**.
  - Cases mode: each case is a node colored blue (current) or grey (past). Edges from `findAllCaseLinks` labeled with score.
  - Stroke width reflects level: WEAK (1.5px), MODERATE (2.5px), STRONG (4px), VERY STRONG (6px).
  - "Show weak links" checkbox (default off).
  - Clicking node or edge opens side drawer with score, level, shared summary, and Compare button.
  - Dual-mode legend explains current/past status and line thickness.
- [x] **Fuzzy, Typo-Tolerant & Full-Text Name Search**
  - **Location:** `src/lib/nameSearch.ts`, `src/pages/SearchPage.tsx`, `src/components/AppShell.tsx`, `src/pages/PersonDetailPage.tsx`
  - Matches first names, surnames, aliases, and 1-letter edit distance typos on words >= 5 characters (`similar spelling`).
  - Search page features dedicated **"People matching '<query>'"** and **"Cases where this name appears"** sections with snippets.
  - Person detail page features **"Appears in cases"** and **"Possible same person in other records"** cards.
  - Live search bar in AppShell merges name search matches with typo tolerance.
- [x] **Dashboard Strongest Case Links**
  - **Location:** `src/pages/DashboardPage.tsx`
  - Top 5 strongest case links displayed with Current/Past badges, scores, and Compare buttons.
- [x] **Automated Acceptance Verification:**
  - `src/lib/__tests__/acceptanceStep13.test.ts` (6 automated tests verifying all criteria).

