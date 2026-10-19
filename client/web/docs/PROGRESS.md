# Progress Tracking

## Step Completion Status

| Step | Title | Status | `npm run build` | `npm test` |
|------|-------|--------|-----------------|------------|
| 01 | Font size fix + shared components | done | pass | pass |
| 02 | Types, mock data, store | done | pass | pass |
| 03 | Dashboard | done | pass | pass |
| 04 | Lists, filters, search | done | pass | pass |
| 05 | Case details (9 tabs) | done | pass | pass |
| 05b | Add everything to a case | done | pass | pass |
| 06 | Algorithms | done | pass | pass |
| 07 | Timeline + conflicts | done | pass | pass |
| 08 | Relationship graph | done | pass | pass |
| 09 | Custody + activity log | done | pass | pass |
| 10 | Reports + polish | done | pass | pass |
| 11 | More cases mock data | done | pass | pass |
| 12 | Case comparison engine | done | pass | pass |
| 13 | Related cases screens | done | pass | pass |
| 14 | A simple Case map | done | pass | pass |

---

## Step 14 Existing Feature Check & Acceptance Verification

### 1. Existing Feature Verification (Section 1 Check)
- **"Related cases" list on a case's Connections tab (`CaseConnectionsTab.tsx`):** Checked — exists, functional, lists related cases ordered by strength with current/past badges. Added "See on map" deep-link per section 5.
- **Side-by-side Compare page (`/cases/:caseId/compare/:otherCaseId`):** Checked — exists, functional, compares cases side-by-side with shared entities, actionable leads, and synchronized dual timelines.
- **Cases mode of the graph (`RelationshipGraphPage.tsx`):** Checked — existing Cases mode cleanly replaced with the new, readable Case map.
- **Name search results (`SearchPage.tsx`, `nameSearch.ts`):** Checked — exists, functional, handles prefix matches, aliases, and 1-letter typo tolerance.

### 2. Automated Step 14 Acceptance Verification (`acceptanceStep14.test.ts` & `caseMap.test.ts`)
1. **Case Map Focus Mode (Default View):**
   - Focus on `CASE-00123` with default `minScore: 4` renders the chosen case in the centre as a larger highlighted circle (175px).
   - Surrounding cases (`CASE-00201`, `CASE-00203`, `CASE-00204`) placed evenly around it in a circle, strongest first.
   - Weak link `CASE-00202` (score 3) excluded by default.
2. **Connecting Link Lines & Plain-Word Labels:**
   - Link lines styled dynamically by level: WEAK 1px grey, MODERATE 2px blue, STRONG 4px orange, VERY STRONG 6px red.
   - Short labels in the middle formatted via `describeSharedShort`: e.g. `same person · same car · same method`.
   - Clicking line to `CASE-00201` opens interactive detail panel displaying:
     - Real names: Toyota Hilux `GT-4521-23`, suspect Kofi Boateng, and MO tag `grey-balaclava`.
     - First 3 actionable investigative leads with priority badges.
     - Direct "Compare" button opening `/cases/CASE-00123/compare/CASE-00201`.
3. **Show Weak Links Toggle:**
   - Checking "Show weak links" toggles `minScore: 0`, seamlessly placing `CASE-00202` on the radial circle.
4. **All Cases Mode:**
   - Positions every case evenly along one large perimeter circle using deterministic trigonometry.
   - Draws exactly one edge per link from `findAllCaseLinks(data, 4)` (no duplicate edges, no self-links).
   - Clicking any case highlights its lines and dims unconnected cases; side panel shows case details and short list of linked cases.
5. **Detailed Entity Graph Usability Polish:**
   - Removed "All Cases (Entire Network)" unreadable hairball; single-case picker only.
   - Unconnected nodes in the current view are hidden.
   - Edge labels displayed only for the active selected node's links, eliminating visual noise.
   - Collapsible floating "Legend" button replaces the intrusive overlay panel.
   - Force simulation tuned with link distance 180, charge repulsion -900, and collision radius 95 to prevent overlapping boxes.
6. **Case Detail Deep Link:**
   - On `CaseConnectionsTab.tsx`, added "See on map" link next to "Related cases" opening `/graph?case=<caseId>` in focus mode.
7. **Quality Gates:**
   - `npm run build` exits with code 0 (`tsc -b && vite build`).
   - `npm run lint` (`oxlint`) reports 0 warnings and 0 errors across 131 files.
   - `npm test` runs 101 passing unit and acceptance tests across 14 test suites.

---

## Step 13 Acceptance Test Verification

Automated end-to-end verification executed via Vitest test suite (`src/lib/__tests__/acceptanceStep13.test.ts`):
1. **CASE-00123 Related Cases Workspace:**
   - Navigating to `CASE-00123` Connections tab surfaces all four new cases:
     - `CASE-00201` (Kasoa Fuel Station Robbery): **Past** (`closed`), **STRONG**, sharing vehicle `V-001`, suspect `P-002` (Kofi Boateng), and evidence tag `"grey-balaclava"`.
     - `CASE-00203` (Osu Mobile Money Fraud): **Current**, **STRONG**, sharing phone number `0241111111` with 3 speculative name/alias matches.
     - `CASE-00204` (Takoradi Market Theft - 2024): **Past** (`closed`), **MODERATE**, sharing MO evidence tag `"crowbar-pry-marks"`.
     - `CASE-00202` (Accra Mall Parking Vehicle Theft): **Current**, **WEAK**, sharing location `L-001` (Accra Mall).
2. **Side-by-Side Compare Page (`/cases/CASE-00123/compare/CASE-00201`):**
   - High-level score and level badge with exact breakdown: `1 vehicle × 5 = 5`, `1 person × 5 = 5`, `1 evidence tag × 4 = 4`, `similar time of day = 1`, `same case type = 1`.
   - Actionable **Where to look** block generates high-priority leads referencing Hilux `GT-4521-23` and suspect Kofi Boateng with direct clickable profile chips.
   - Categorized shared entity lists (people, vehicles, locations, phone numbers, evidence tags).
   - Side-by-side synchronized event streams highlighting events at shared locations in UTC.
3. **Fuzzy, Typo-Tolerant & Alias Name Search:**
   - Query `asante`: surfaces both Kwame Asante records (`P-001` in `CASE-00123` and `P-031` in `CASE-00203`), as well as Esi Asante (`P-032`).
   - Query `kwame`: returns Kwame Asante records matching first name.
   - Query `kojo b`: resolves via alias for Kofi Boateng (`P-002`) and Daniel Cudjoe (`P-033`).
   - Query `ashante`: matches Kwame Asante with the explicit badge `"similar spelling"` via 1-letter Levenshtein edit distance.
4. **Case Network Graph (`/graph` Cases Mode):**
   - Renders all cases as blue (current) or grey (past) nodes.
   - Edges labeled with scores, with stroke width dynamically scaled by confidence tier (WEAK: 1.5px, MODERATE: 2.5px, STRONG: 4px, VERY STRONG: 6px).
   - Clicking an edge or node reveals connection details and direct "Compare cases" action.
5. **Live Dynamic Reactivity:**
   - Dynamically created a new case in the store, added a new person with surname "Asante", and linked vehicle `GT-4521-23` (`V-001`).
   - The comparison engine recalculated immediately: `CASE-00123` appeared as a related case with score >= 7 (shared vehicle + surname match) with zero page reloads.
6. **Dashboard Strongest Case Links:**
   - Dashboard cleanly renders the top 5 case links from `findAllCaseLinks(data, 4)` with Current/Past badges, scores, and Compare links.
7. **Quality Gates:**
   - `npm run build` exits with code 0 (`tsc -b && vite build`).
   - `npm run lint` (`oxlint`) reports 0 warnings and 0 errors across 128 files.
   - `npm test` runs 87 passing unit and acceptance tests across 12 test suites.

Automated end-to-end verification executed via Vitest test suite (`src/lib/__tests__/acceptanceStep05b.test.ts`):
1. **Case & People Creation:** Created new case with lead `O-001` and added two suspects ("Acceptance Suspect Alpha" and "Acceptance Suspect Beta").
2. **New Location & Incident:** Created location "Adabraka Warehouse Complex" (`Accra`) and added incident "Warehouse Vault Forced Entry" linked to this location.
3. **New Vehicle Creation:** Created vehicle `ER-8877-26` (Nissan Navara) with Alpha `owns`, Beta `connected-to`, and vehicle `involved-in` incident. Set `Vehicle.ownerId` to Alpha.
4. **Connections & Location Visits:** Linked both suspects `involved-in` incident and both `visited` the new location.
5. **Shared Evidence:** Uploaded evidence "Crowbar and Acetylene Torch Kit" linked to both Alpha and Beta.
6. **Case Document:** Added "Forensic Toolmark Impression Report" (kind `report`).
7. **Timeline Claims & Conflict Generation:** Added witness statement placing Alpha in Takoradi (`L-005`) at 10:15 UTC, and CCTV sighting placing Alpha in Accra (`L-001`) at 10:10 UTC.

**Verified Outcomes:**
- **Locations, Vehicles, Evidence, Documents tabs:** All new records appear scoped to the case.
- **Connection Score:** Exactly **16, VERY STRONG** (1 location × 2 = 2, 1 vehicle × 4 = 4, 1 incident × 5 = 5, 1 evidence × 5 = 5; total = 16).
- **Timeline Conflict:** Correctly flags Alpha's presence conflict between Accra and Takoradi (gap 5 mins < required 270 mins).
- **Relationship Graph:** New nodes and connecting edges populated in `buildGraph()`.
- **Plate Search:** Querying `ER-8877-26` (and `er887726`) instantly returns the vehicle in `searchAll()`.
- **Activity Log:** All 8 case actions recorded in chronological sequence in `activityLog`.
- **Quality Gates:** `npm run build` exits 0, `npm run lint` (`oxlint`) reports 0 warnings and 0 errors across 120 files, and all 67 Vitest unit tests across 9 test suites pass.

---

## Assumptions & Design Decisions

1. **Linting Engine:** `npm run lint` executes `oxlint`. All code conforms to strict linting rules with 0 warnings and 0 errors across 115 files.
2. **Responsive Navigation:** The sidebar collapses to icon-only mode (`w-14`) below 1024px (`lg` breakpoint) to maximize data canvas width on tablets.
3. **Tailwind CSS v4 Configuration:** Tailwind v4 uses CSS-first token configuration in `src/index.css` via `@theme` with strict font scales enforcing a minimum size of 13px across all components.
4. **Design Palette:** The primary accent color is standard intelligence navy/blue (`#2563eb` / `blue-600`), set against a neutral slate background (`#f8fafc`).
5. **Testing Framework:** Vitest is configured with `@vitejs/plugin-react` and `vitest/config`. All 56 tests across 6 test suites pass deterministically.
6. **Timezone Standardization:** Ghana operates on Greenwich Mean Time (GMT / UTC) year-round without daylight saving time. All timestamps are ISO 8601 strings ending in `Z` and formatted in British English. Form inputs for dates parse as UTC (`:00Z`) and reject future timestamps.
7. **Graph Layout Stability:** Force-directed graph positioning in `RelationshipGraphPage.tsx` uses deterministic synchronous 300-tick simulation via `d3-force` to prevent node jitter during render.
8. **Routing Architecture:** Global search (`/search`), catch-all 404 (`*`), and individual entity detail pages are cleanly routed within `src/App.tsx` wrapped in an accessible `ErrorBoundary`.
9. **Print Styling:** Reports page uses `@media print` utility classes (`print:hidden`, `print:bg-white`, `print:border-none`) to suppress web chrome and produce clean multi-page document dossiers.
10. **Version Control Constraint:** As instructed by the absolute project rule, **zero git commands were executed** at any time.
11. **Vehicle Ownership in Creation:** When creating a vehicle with multiple case links, any person assigned the `owns` relationship is recorded as the primary `Vehicle.ownerId`.
12. **Duplicate Location Safeguard:** Duplicate locations with identical name and city (case-insensitive) are intercepted; user is informed and the existing location entity is selected without creating duplicate records.
13. **Audit Trail Immutability:** Records are added append-only without delete/edit mutations to ensure complete chronological investigative integrity.
14. **Timestamp Precision & Automatic Real-Time Clock:** Last Updated and Created At timestamps across the Cases table and Case Details Overview render exact date and 12-hour time (e.g. `15 Sep 2026 at 5:30pm`). All case creations and edits automatically capture `new Date().toISOString()` in real time with zero external API dependencies.
15. **Person Address Visibility:** Added an Address column to the Persons directory (`/persons`) and Case Details People tab with sortable columns, full-text address search/filtering support, and realistic addresses for all mock person profiles.
16. **Case-Scoped Dropdowns & Empty Initial Selection:** The "Link Existing Vehicle to Person" form starts with empty dropdown fields (`Select a vehicle…` / `Select a person…`) and restricts available options exclusively to vehicles and people associated with the active case.
17. **In-App Confirmation Dialog & Backdrop Auto-Cancel:** Entity removals (Persons, Locations, Vehicles) use an in-app modal ([`ConfirmDeleteModal.tsx`](file:///c:/Users/engho/incident-investigation-system/src/components/ConfirmDeleteModal.tsx)) with a warning message, Cancel, and red Confirm action. Clicking the backdrop or empty space outside the modal automatically cancels and dismisses it.
18. **Person Editing & Case Entity Removals:** Added inline `Edit` action and red `Remove` action beside persons on the People tab, locations on the Locations tab, and vehicles on the Vehicles tab, accompanied by complete audit logging and relationship pruning in [`useInvestigationStore.ts`](file:///c:/Users/engho/incident-investigation-system/src/store/useInvestigationStore.ts).
19. **Step 11 Mock Data Expansion (Connected Cases):**
    - **CASE-00201 (Kasoa Fuel Station Robbery):** `closed` (past, March 2026), type `theft`, lead `O-002`. Shares vehicle `V-001` (Hilux `GT-4521-23` seen leaving in sighting `SG-021`), suspect `P-002` (Kofi Boateng), and evidence tag `"grey-balaclava"` (`E-032`). Incident `I-024` at `L-003` at 08:50 UTC (~same time of day as `CASE-00123`). People: `P-002`, `P-027` (Kweku Baah, victim), `P-028` (Emmanuel Tetteh, witness).
    - **CASE-00202 (Accra Mall Parking Vehicle Theft):** `investigating`, type `theft`, lead `O-004`. Shares only location `L-001` (Accra Mall, incident `I-025`). Zero shared people, vehicles, or phone numbers. Zero name or alias overlap with `CASE-00123`. People: `P-029` (Selorm Agbenu), `P-030` (Fafali Dogbe). Vehicle `V-011` (Hyundai Elantra `GS-3311-24`). Evidence `E-033` tagged `"broken-glass"`.
    - **CASE-00203 (Osu Mobile Money Fraud):** `investigating`, type `fraud`, lead `O-006`. Phone record `PR-017` shares phone number `0241111111` with `P-004`. Contains 3 name match archetypes: exact name `P-031` ("Kwame Asante"), surname-only `P-032` ("Esi Asante"), and shared alias `P-033` ("Daniel Cudjoe", alias `"Kojo B"` matching `P-002`). Incident `I-026` at `L-007`. Evidence `E-034` tagged `"burner-phone"`.
    - **CASE-00204 (Takoradi Market Theft - 2024):** `closed` (past, 2024), type `theft`, lead `O-004`. Shares only method tag `"crowbar-pry-marks"` via evidence `E-035`. Incident `I-027` at `L-005`. People: `P-035` (Fiifi Quaye), `P-036` (Araba Hanson). Zero shared entities.
    - Added tags `"grey-balaclava"` (`E-029`) and `"crowbar-pry-marks"` (`E-030`) to `CASE-00123`.
    - Maintained existing `CASE-00022` and `CASE-00031` links to `V-001`.
20. **Step 12 Case Comparison Engine & Name Search:**
    - Fingerprints (`caseFingerprint.ts`) extract all operational traces (normalized phone numbers, evidence tags, locations, vehicles, persons, incident minutes of day).
    - Symmetric pairwise comparison (`caseComparison.ts`) computes weighted link scores: shared phones (6), persons/vehicles (5), evidence tags (4), locations (2), time/type (1), with speculative name matches capped at 5 points.
    - Generates actionable investigative leads (`leads.ts`) sorted strictly by priority (`high` -> `medium` -> `low`).
    - Name search engine (`nameSearch.ts`) supports multi-word prefix matching, alias searching, 1-letter edit distance typo tolerance on words >= 5 characters, and full-text mention scanning across case descriptions, incidents, notes, witness statements, and evidence.
21. **Step 14 Case Map & Graph Usability:**
    - Case map layout uses pure deterministic clock-face trigonometry (`layoutCaseMap`) in `src/lib/caseMap.ts` instead of unstable physics simulation, placing the centre case at (400, 300) and surrounding cases at equal angle increments to guarantee zero node overlaps.
    - Custom React Flow case nodes are rendered as clean circles (175px diameter for centre case, 155px for surrounding cases) with hidden centered handles to ensure clean straight-line edge routing.
    - Detailed entity graph spacing was resolved by setting link distance to 180, charge repulsion to -900, and collision radius to 95 in `graphLayout.ts`, preventing entity box collisions without altering domain graph topology.
22. **Cross-Case Phone Consistency & Narrative Realignment:**
    - Populated unique, realistic Ghanaian phone numbers (MTN `024`/`054`/`055` and Telecel `020`) across person profiles in `src/data/persons.ts` so the directory and case tables display complete contact records rather than unpopulated dashes (`—`).
    - Resolved the `0241111111` cross-case storyline: clarified via case notes `N-014` and `N-015` as well as investigative reports `D-007` and `D-008` that `0241111111` is an innocent civilian's registered SIM cloned by the syndicate and operated as an illicit burner in both the Accra Mall robbery (`CASE-00123`) and Osu SIM swap fraud (`CASE-00203`). Ama Boateng (`P-004`) has zero criminal ties to Kofi Boateng or the robbery suspects.
    - Kept suspect `P-002` without a phone on record to ensure `CASE-00201` maintains its exact prescribed signal profile (sharing vehicle, suspect, and method tags only, without an unintended phone match).
23. **Ama Boateng Victim Alignment & Vehicle Linkage Clarification:**
    - **CASE-00203 Victim Linkage:** Updated `P-004` (Ama Boateng) in `src/data/persons.ts` with `type: 'victim'` and `relatedCases: ['CASE-00203']`. She now immediately renders under **Victims** on `/cases/CASE-00203?tab=people` with phone `0241111111` and Cantonments address, matching case note `N-015` (unauthorized SIM swap victim).
    - **Vehicle Link Story Alignment:** Clarified why Ama Boateng and Kofi Boateng connect via vehicle `V-001` (`GT-4521-23` White Toyota Hilux): Ama Boateng reported this family vehicle stolen from Cantonments in `CASE-00022` (Vehicle Theft). The vehicle was subsequently operated by suspect Kofi Boateng (`P-002`) and registered under gang leader Kwame Asante (`P-001`) during armed robbery operations (`CASE-00123`, `CASE-00201`).
    - **UI Transparency & Rich Badges:** Enhanced `ConnectionScoreCard.tsx` and `describeScore`:
      - Shows person role badges (`(victim)` vs `(suspect)`).
      - Replaced cryptic `1 vehicle × 4 = 4` with exact registration and make/model: `1 vehicle × 4 = 4 (GT-4521-23 Toyota Hilux)`.
      - Added dedicated contextual callout explaining the victim/stolen vehicle vs suspect operator relationship.
    - **Vehicle & Person Detail Page Annotations:** Updated `VehicleDetailPage.tsx` and `PersonDetailPage.tsx` with investigation background notes explaining the stolen report (`CASE-00022`) vs suspect operator (`CASE-00123`).
    - **Store Cache Upgrade:** Bumped Zustand storage key to `iis-investigation-data-v3` and added legacy cache eviction in `safeLocalStorage` so browser reloads immediately fetch updated case people and contact records.

---

## Blockers

*(None. All 10 steps are complete, fully verified, and operational.)*

---

## First Things to Check in the Morning

1. **Run Unit Tests:** Execute `npm test` to verify all 28 automated tests across custody rules, connection scoring, BFS pathfinding, and timeline conflict detection pass in <1 second.
2. **Verify Production Build:** Run `npm run build` to confirm strict TypeScript compilation (`tsc -b`) and Vite bundling exit with code 0.
3. **Run Static Linter:** Execute `npm run lint` to confirm `oxlint` reports 0 errors and 0 warnings across all 98 project files.
4. **Start Development Server:** Run `npm run dev` and open `http://localhost:5173/` in Chrome to verify the live executive dashboard, responsive charts, and operational stat cards.
5. **Walk Through the Demo Script:** Follow `docs/DEMO_SCRIPT.md` to execute the 12-step presentation (e.g., search `GT-4521-23`, review `CASE-00123`, inspect the 13 STRONG score, test BFS pathfinding, and demonstrate the blocked destroyed evidence).
6. **Test Printable Reports:** Navigate to `http://localhost:5173/reports`, verify the 7 compiled dossier sections for `CASE-00123`, and click "Print / Save as PDF" to preview clean paper output without navigation bars.
7. **Inspect Specification Matrix:** Review `docs/SPEC_CHECKLIST.md` to confirm every supervisor requirement is mapped to its exact implementing source file.
