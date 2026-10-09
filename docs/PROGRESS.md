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

---

## Step 05b Acceptance Test Verification

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
- **Quality Gates:** `npm run build` exits 0, `npm run lint` (`oxlint`) reports 0 warnings and 0 errors across 117 files, and all 63 Vitest unit tests pass.

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
