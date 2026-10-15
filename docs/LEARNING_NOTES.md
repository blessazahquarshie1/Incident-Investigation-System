# Learning Notes

## Table of Contents
- [Step 1 — Project setup and app shell](#step-1--project-setup-and-app-shell)
- [Step 01 — Font size fix + shared components](#step-01--font-size-fix--shared-components)
- [Step 02 — TypeScript models, mock data, store](#step-02--typescript-models-mock-data-store)
- [Step 03 — Dashboard](#step-03--dashboard)
- [Step 04 — Lists, filters, search](#step-04--lists-filters-search)
- [Step 05 — Case details (9 tabs)](#step-05--case-details-9-tabs)
- [Step 05b — Add everything to a case](#step-05b--add-everything-to-a-case)
- [Step 06 — Algorithms](#step-06--algorithms)
- [Step 07 — Timeline and conflicts](#step-07--timeline-and-conflicts)
- [Step 08 — Relationship graph](#step-08--relationship-graph)
- [Step 09 — Custody and activity log](#step-09--custody-and-activity-log)
- [Step 10 — Reports and polish](#step-10--reports-and-polish)

---

## Step 1 — Project setup and app shell

**What was built:** Vite + React + TypeScript project scaffolded using `npm create vite@latest`. Tailwind CSS (v4 Vite plugin), React Router, Zustand, @xyflow/react, Recharts, and lucide-react were installed. A sidebar with 11 navigation links, a top bar with the app name and search box, and 11 placeholder pages were created.

**How it works (plain English):** Think of this as building the shell of a house before putting in furniture. The sidebar is the hallway that lets you walk between rooms (pages). React Router is the "navigator" that shows you the right room depending on which link you clicked.

**Key concepts:**
- **Vite**: a fast build tool that bundles the app for the browser.
- **React Router**: maps URL paths to page components, so `/cases` shows the Cases page.
- **Zustand**: a lightweight state store — shared memory between components.
- **Tailwind CSS**: utility-class CSS framework; you style by adding class names instead of writing separate CSS rules.

**Files to open:**
- `src/App.tsx` — the router setup with all 11 routes.
- `src/components/AppShell.tsx` — the layout with sidebar, top bar, and content area.
- `src/pages/DashboardPage.tsx` — a sample placeholder page.
- `vite.config.ts` — the build configuration.
- `src/index.css` — global styles and Tailwind entry point.

**What I should see:** A left sidebar with 11 links, a top bar with the app name, and placeholder text when clicking any link. The active link is highlighted.

**I should be able to explain:**
1. What does React Router do, and how does a URL become a visible page?
2. Why does Tailwind use class names instead of a separate `.css` file?
3. What is a component, and how is `AppShell` different from a page?



## Step 01: Font size fix + shared components

**What was built:**
Updated the base font sizes in Tailwind to establish a clear typographic hierarchy and refreshed the layout components like the AppShell and shared components like PageHeader and Badge.

**How it works (plain English with an analogy):**
We've set a foundation for all the text on the site, like tuning a set of musical instruments to play in the right pitch before starting a concert. Then we built reusable LEGO blocks (badges, cards, headers) so that everything looks consistent when we build the larger pages.

**Key concepts:**
- Design tokens with CSS variables in Tailwind 4.
- Reusable React UI components without business logic.

**Files to open:**
- src/index.css
- src/components/AppShell.tsx
- src/components/PageHeader.tsx

**What I should see:**
- Clear, readable fonts using system fonts.
- A functional sidebar that collapses on smaller screens.
- Standardized headers on all pages.

**I should be able to explain:**
- Why using shared components makes application development faster and UI more consistent.

## Step 02: Types, mock data, and store setup

**What was built:**
Created comprehensive TypeScript models for all investigative entities, populated a complex mock database containing intertwined stories, and established a Zustand store to manage state.

**How it works (plain English with an analogy):**
We've set up the "rulebook" (TypeScript models) that tells us exactly what shape our data should take, like blueprints for a house. Then we filled the house with "furniture" (mock data) so it's not empty, and hired a "manager" (Zustand store) who keeps track of everything and knows where things are.

**Key concepts:**
- TypeScript strict types.
- Relational mock data structures.
- Zustand global state management.

**Files to open:**
- src/types/index.ts
- src/data/index.ts
- src/store/useInvestigationStore.ts

**What I should see:**
- Correct types checking and the dashboard displaying counts of all the mock data entities.
- Zero TypeScript errors.

**I should be able to explain:**
- Why using a global store is better than passing data down as props from the top app level.

## Step 03: Dashboard

**What was built:**
Implemented a comprehensive dashboard with key metrics, charts visualizing case distribution, and lists of urgent cases and recent activities.

**How it works (plain English with an analogy):**
We've built the "control center" or "mission control screen" that gives the investigator an immediate, at-a-glance summary of everything happening across all their cases without having to dig into filing cabinets.

**Key concepts:**
- Data derivation (calculating stats from raw data).
- Recharts integration for data visualization.
- Responsive CSS grid layouts.

**Files to open:**
- src/lib/dashboard.ts
- src/pages/DashboardPage.tsx

**What I should see:**
- Stat cards showing numerical summaries.
- A bar chart and a pie chart.
- A list of urgent cases and recent activities.

**I should be able to explain:**
- How data is aggregated from the global state and mapped into Recharts compatible formats.


## Step 04: Lists, filters, search

**What was built:**
Implemented extensive filtering logic, a global search function, list pages for all main entities (Cases, Incidents, Persons, etc.), and reusable UI components like DataTable and FilterBar.

**How it works (plain English with an analogy):**
We've built the "filing cabinets" and a powerful "magnifying glass" for the system. Instead of viewing raw data, investigators can now sort, filter, and search through records instantly, just like using an advanced library catalog to find exactly the book you need.

**Key concepts:**
- Advanced array filtering and mapping.
- Reusable, generic table components with sorting.
- Search indexing and string matching.

**Files to open:**
- src/lib/filters.ts
- src/lib/search.ts
- src/pages/SearchPage.tsx
- src/components/DataTable.tsx
- src/components/FilterBar.tsx

**What I should see:**
- Fully functional list pages for all tabs on the sidebar.
- A functional global search that categorizes results by type.
- Working filters and sorting on tables.

**I should be able to explain:**
- How generic types (`<T>`) allow a single DataTable component to render rows for Cases, Persons, and Vehicles without duplicating code.

## Step 05: Case details (9 tabs)

**What was built:**
Expanded the Zustand state store with case-management actions, built comprehensive scope utilities to fetch related records for a specific case, and created extensive detail pages, including a massive 9-tab Case Detail view.

**How it works (plain English with an analogy):**
We built the "case folder" that gathers everything related to a single investigation in one place. Instead of looking at a person or vehicle in isolation, the system now connects all the dots that belong to a specific case, and provides the forms (actions) to update priorities, link evidence, and write notes.

**Key concepts:**
- Complex data aggregation from normalized data structures.
- Immutable state updates in Zustand.
- React Router URL parameters and query strings (for tab navigation).

**Files to open:**
- src/store/useInvestigationStore.ts
- src/lib/caseScope.ts
- src/pages/CaseDetailPage.tsx
- src/pages/PersonDetailPage.tsx

**What I should see:**
- A detailed 9-tab view when clicking into any Case.
- Detail pages for Persons, Vehicles, Locations, Incidents, and Evidence showing linked entities.
- Working interactions like updating case priority and status.

**I should be able to explain:**
- How immutable state updates ensure React safely re-renders UI elements when new entities or relationships are added to the store.

## Step 05b — Add everything to a case

**What was built:**
Created all missing investigation intake forms and modal dialogues across the Case Details tabs, enabling investigators to build an entire investigation from scratch. Built reusable `FormField` and `EntityPicker` components alongside a comprehensive pure validation library (`src/lib/validation.ts`) with UTC date parsing and duplicate prevention. Integrated full reactive store actions for incidents, documents, lead investigator reassignment, visited locations, connected vehicles, entity links, witness statements, sightings, and phone records.

**How it works (plain English):**
Adding information is the first half of an investigation tool: the second half is what the computer does with it. Think of the Zustand store as a central whiteboard in a police precinct room: every form writes one small fact or sticky note onto that central board. Every other analyst tool in the building (the timeline board, the relationship pin-board, the suspect dossier, and the search catalog) is continuously watching that same central whiteboard. The moment a new sticky note is pinned, all the charts and scores update automatically without needing any special wires between the individual tools. **Validation** is like a sharp gatekeeper at the door who inspects every sticky note before it touches the board, checking that dates aren't in the future, license plates aren't registered twice, and required details aren't left blank. We also strictly **only add and never delete**, because a genuine police investigation ledger must preserve an unbroken audit trail of everything that was ever done or observed.

**Key concepts:**
- **Single Source of Truth**: When forms mutate central Zustand state, all derived views (graph, timeline, scoring, search) recompute reactively without bespoke glue code.
- **Pure Function Validation**: All validation logic lives in side-effect-free pure functions in `src/lib/validation.ts` that return field error maps, making them trivial to unit test.
- **Audit Integrity (Append-Only Architecture)**: Investigative records are added but never deleted or destructively mutated, preserving legal chain of custody and accountability.
- **UTC Time Standardization**: Date and time values are normalized to UTC (`:00Z`), reflecting standard Ghanaian time and preventing client-side timezone discrepancies.

**Files to open:**
- `src/lib/validation.ts` — pure validation rules for vehicle plates, duplicate locations, UTC timestamps, and all modal form payloads.
- `src/components/FormField.tsx` & `src/components/EntityPicker.tsx` — reusable form components with accessible labels, errors, and entity search dropdowns.
- `src/store/useInvestigationStore.ts` — store actions executing immutable append operations and generating chronological activity log entries.
- `src/pages/CaseDetailPage.tsx` — integration of all creation modals across Overview, People, Evidence, Locations, and Vehicles tabs.
- `src/components/CaseTimelineTab.tsx` — timeline creation controls for witness statements, CCTV/patrol sightings, and call/cell-tower phone records.
- `src/lib/__tests__/acceptanceStep05b.test.ts` — automated end-to-end acceptance test proving the full 7-step scenario.

**What I should see:**
A new case that I can fill with incidents, vehicles, locations, documents and timeline records, and that immediately gets scores, graph nodes, timeline events and conflict warnings from what I typed. All 56 tests pass with `npm test`, `npm run lint` reports 0 warnings, and `npm run build` bundles with 0 errors.

**I should be able to explain:**
1. Why do the graph, search and scores update by themselves when I add a vehicle?
2. Why must a new vehicle be connected to a person or an incident of the case?
3. Why can a user add records but not delete them?

## Step 06: Algorithms

**What was built:**
Implemented connection scoring algorithms and shortest path (BFS) algorithms to discover hidden links between individuals across locations, vehicles, incidents, evidence, and phone records. Vitest was integrated for robust unit testing of these logical functions. UI components were built to visualize connection strength and display paths.

**How it works (plain English with an analogy):**
We built the "detective's corkboard with red string". The system analyzes every entity to find where people's paths cross (scoring strength). If two people don't cross directly, it maps the shortest path of "friends of friends" (or shared vehicles/incidents) to show exactly how they are connected.

**Key concepts:**
- Graph algorithms (Breadth-First Search).
- Scoring logic and weighted connections.
- Unit testing with Vitest.

**Files to open:**
- src/lib/connections.ts
- src/lib/pathfinding.ts
- src/components/CaseConnectionsTab.tsx

**What I should see:**
- A pathfinding tool in the Connections tab that shows step-by-step links between people.
- Connection scores (e.g. 13 STRONG) visualizing shared items.
- Passing unit tests when running `npm test`.

**I should be able to explain:**
- Why Breadth-First Search (BFS) is the ideal algorithm to find the *shortest* number of degrees of separation between two people.

## Step 07: Timeline and conflicts

**What was built:**
Created a chronologically sorted global timeline aggregating data from evidence, incidents, locations, witness statements, and sightings. Implemented a timeline conflict detection engine that uses location travel times to flag physically impossible presence claims (e.g., someone spotted in Accra and Takoradi within 5 minutes).

**How it works (plain English with an analogy):**
We've built an automated "alibi checker". It lines up every single event in chronological order on a master timeline. Then it acts like a detective asking, "If you were seen in City A at 10:10, and someone claims you were in City B at 10:15, but it's a 4-hour drive... you have a conflict!" 

**Key concepts:**
- Timeline aggregation and sorting across heterogeneous data types.
- Conflict detection logic evaluating time/distance constraints.
- Iterating combinations using nested loops (O(n²) comparison per person).

**Files to open:**
- src/lib/timeline.ts
- src/lib/conflicts.ts
- src/components/TimelineView.tsx

**What I should see:**
- A unified timeline view in the UI showing all events.
- Conflict banners alerting the user to impossible timelines.

**I should be able to explain:**
- How grouping events by person before comparing pairs optimizes the conflict detection algorithm, avoiding unnecessary comparisons between completely unrelated events.

## Step 08 — Relationship graph

**What was built:**
An interactive graph visualization canvas powered by React Flow and d3-force. Features custom styled nodes by entity type, distinct relationship edge styles, a case picker, link expansion, node-type visibility toggles, node search with viewport focusing, an entity details side panel, and an integrated "Compare two people" tool that visually highlights shortest paths directly on the graph.

**How it works (plain English):**
Everything on the graph comes from data, not from drawing by hand: `buildGraph` makes the dots and lines, the **layout** step decides where each dot goes, and **React Flow** only paints them. The layout works like physics: dots push each other away and lines pull their ends together, and the picture settles where those forces balance. **Link expansion** lets an investigator start small and follow a lead outwards instead of staring at everything at once. Highlighting a path on the graph is the BFS result from Step 06 made visible.

**Key concepts:**
- **d3-force simulation**: synchronous physics calculation for deterministic, collision-free node coordinates.
- **React Flow (@xyflow/react)**: component-based canvas engine for interactive panning, zooming, minimap, and custom nodes/edges.
- **Link expansion**: progressively exploring a network from a focal node without overwhelming the investigator.
- **Path highlighting**: visual graph synchronization with Breadth-First Search algorithms.

**Files to open:**
- `src/lib/graphLayout.ts` — synchronous d3-force simulation engine.
- `src/pages/RelationshipGraphPage.tsx` — the full interactive graph workbench.
- `src/main.tsx` — React Flow global CSS styling integration.

**What I should see:**
A coloured network of people, vehicles, incidents, evidence, and places for the robbery case. Clicking a node shows its details and direct connections in the side panel. Comparing two people (e.g. Kwame Asante and P-006) draws their 5-node path directly on the graph in blue.

**I should be able to explain:**
1. Which parts of this page are my own logic and which part is React Flow's job?
2. What does the force layout do, and why is it computed once instead of animated?
3. Why do we show a single case first instead of the whole network?

## Step 09 — Evidence chain of custody and the activity log

**What was built:**
A finite state machine governing legal evidence custody statuses and transitions, complete with validation rejecting invalid actions (such as transferring destroyed evidence), an append-only custody history timeline with custodian tracking, a reusable ActivityFeed component, and unified activity logging across all data modifications in the system.

**How it works (plain English):**
A **state machine** is a set of states (collected, in the evidence room, destroyed…) and strict rules about which move is allowed from each state. Writing the rules as a table means a rule can be read, checked and changed without hunting through the code. The app **refuses** an invalid move instead of trusting the user, which is how real systems protect important records. The **chain of custody** is an append-only history: entries are added, never edited, so the record of who held the evidence is trustworthy.

**Key concepts:**
- **Finite State Machine (FSM)**: lookup table of allowed transitions between discrete states.
- **Derived status**: deriving item status dynamically from the tail of an append-only log rather than manual user input.
- **Append-only audit trail**: guaranteeing legal evidentiary integrity by only adding new records and never editing old ones.
- **Unified activity logging**: capturing all user operations (case creation, priority shifts, evidence uploads, custody handovers) in a chronological activity log.

**Files to open:**
- `src/lib/custody.ts` — state machine rules, validation, and transition application.
- `src/lib/__tests__/custody.test.ts` — unit test suite for state transition rules.
- `src/components/CustodySection.tsx` — interactive custody workbench with disabled reasons and modals.
- `src/components/ActivityFeed.tsx` — reusable day-grouped activity feed.

**What I should see:**
A destroyed item (e.g. `E-031`) that cannot be touched and clearly explains why; an active item (`E-024`) whose history grows when an officer transfers it or starts analysis; and a case activity log that records every action.

**I should be able to explain:**
1. What is a state machine and where is it in this app?
2. Why is the status derived from the history rather than typed in separately?
3. Why does the history only ever add entries and never edit old ones?

---

## Step 10 — Reports and polish

**What was built:**
A comprehensive CID case briefing report generator (`/reports`) compiling 7 distinct analytical sections into an official intelligence dossier with print/PDF export styling. An application-wide polish pass was completed: wrapping all routes in a React `ErrorBoundary`, adding a friendly 404 `NotFoundPage`, enforcing dynamic `document.title` across all pages, auditing and fixing all typography so no element falls below 13px, removing all `any` types, ensuring 0 linter warnings across 98 files, creating the specification verification checklist (`docs/SPEC_CHECKLIST.md`), writing a 12-step supervisor demonstration script (`docs/DEMO_SCRIPT.md`), and documenting the system in the project root `README.md`.

**How it works (plain English):**
A **report** is the same data as the rest of the app, assembled into one readable document, so the report page adds no new logic: it reuses the functions from earlier steps. **Polish** is the work that makes software feel finished: what happens when something is missing, wrong or empty. The **checklist** turns the supervisor's spec into a list we can tick off, so nothing is forgotten.

Think of building the application like constructing and furnishing an intelligence operations center. Steps 01 through 09 built the command rooms, the specialized forensics tools, the timeline analysis room, and the evidence vault. Step 10 does two things: first, it creates the official briefing binder (the dossier report) that pulls together summary findings from every room when leadership needs a physical brief. Second, it does the final quality inspection: checking that every exit sign is lit (404 page), the fire extinguishers are tested (error boundary), every label is clearly legible (font size standards), and every procedure manual matches the operational blueprint (spec checklist).

**Key concepts:**
- **Report compilation via pure functional synthesis:** Rather than duplicating querying logic, `buildCaseReport` in `src/lib/report.ts` calls existing pure functions (`getCasePeople`, `buildTimeline`, `detectTimelineConflicts`, `calculateConnection`) to compile a single immutably structured report object.
- **Print media query styling (`@media print`):** Using Tailwind print utility variants (`print:hidden`, `print:bg-white`, `print:border-none`, `print:shadow-none`, `print:overflow-visible`) to selectively strip navigation sidebars, top bars, and buttons while preserving document headers, official mastheads, and high-contrast tables for paper or PDF export.
- **Class-based Error Boundary lifecycle:** Using `componentDidCatch` and `static getDerivedStateFromError` to catch uncaught JavaScript runtime exceptions anywhere in the React component tree and render a graceful recovery screen with a reload button rather than a blank white screen.
- **Graceful degradation and empty states:** Providing helpful guidance on missing IDs, empty search queries, or zero-item filter results rather than blank screens or null-pointer crashes.
- **Strict typography scale defense:** Ensuring that even tiny annotations, timestamps, and badges never drop below 13px (`text-[13px]`) to maintain accessibility and readability on desktop and tablet displays.

**Files to open:**
- `src/lib/report.ts` — pure data function assembling all 7 report sections.
- `src/pages/ReportsPage.tsx` — printable dossier view with CID masthead and print stylesheet.
- `src/components/ErrorBoundary.tsx` — crash recovery wrapper around route elements.
- `src/pages/NotFoundPage.tsx` — friendly 404 page with navigation link.
- `docs/SPEC_CHECKLIST.md` — itemized specification matrix verifying 100% feature coverage.
- `docs/DEMO_SCRIPT.md` — 12-step click-by-click walkthrough for supervisors.
- `README.md` — project overview, directory map, and page catalog.

**What I should see:**
A printable case report, no broken pages, and a ticked spec checklist. When visiting `/reports`, selecting any case displays its executive summary, subject directory, evidence custody status, chronological event sequence, alibi conflict audit, top 5 network connections, and recent activity log. Clicking "Print / Save as PDF" cleanly formats the page for paper output.

**I should be able to explain:**
1. **Why does the Reports page need almost no new logic?**
   Because every analytical insight displayed in the report — timeline events, alibi conflicts, connection scores, custody holders, and case associations — was already modeled and implemented as pure, modular utility functions in earlier steps (`buildTimeline`, `detectTimelineConflicts`, `calculateConnection`, `getCasePeople`, etc.). The Reports module simply acts as an orchestrator, invoking these existing functions and assembling their return values into one consolidated view model.

2. **Name three things the polish pass handles that users only notice when they go wrong:**
   - *Error recovery (Error Boundaries):* When an unexpected bug occurs, instead of rendering a broken, unresponsive white screen, the app catches the error and provides a clear explanation and a single-click "Reload page" button.
   - *Graceful navigation handling (404 & Empty States):* When a user visits a mistyped URL or an entity ID that doesn't exist, rather than failing silently or crashing on undefined properties, the system renders a friendly message explaining what is missing and offering a link back to safe ground.
   - *Legibility and print adaptability:* On screen, navigational chrome and buttons assist usability, but without print stylesheets, printing an investigation dossier produces clipped tables, messy sidebar links, and unreadable tiny fonts. The polish pass ensures printouts are crisp, official documents and screen typography is always at least 13px.

3. **Walk through the demo script and say which learning objective each step shows:**
   - *Step 1 (Dashboard metrics):* Demonstrates real-time state derivation and operational health visualization.
   - *Step 2 (License plate search):* Demonstrates fuzzy multi-entity search and cross-relational data enrichment.
   - *Step 3 (Vehicle profile & linkages):* Demonstrates bidirectional entity-graph navigation.
   - *Step 4 (Case container 9 tabs):* Demonstrates scoped domain filtering within a master case entity.
   - *Step 5 (Case timeline):* Demonstrates multi-source chronological event normalization.
   - *Step 6 (Alibi conflict detection):* Demonstrates algorithmic spatio-temporal validation using travel-time matrices.
   - *Step 7 (13 STRONG connection score):* Demonstrates weighted multi-factor associative link analysis.
   - *Step 8 (BFS 5-node pathfinding):* Demonstrates graph traversal discovering indirect relationships between suspects.
   - *Step 9 (React Flow relationship graph):* Demonstrates interactive physics-based network visualization with algorithmic path highlighting.
   - *Step 10 (Evidence custody lifecycle):* Demonstrates finite state machine verification of legal handling processes.
   - *Step 11 (Blocked destroyed evidence):* Demonstrates defensive state integrity enforcement preventing invalid operations.
   - *Step 12 (Case mutation & audit feed):* Demonstrates reactive immutable state management with automated audit logging.

---

## Step 11 — More cases that connect to the Accra Mall robbery

**What was built:**
Expanded the mock database with four new realistic investigation cases (`CASE-00201` to `CASE-00204`), ten new persons (`P-027` to `P-036`), new incidents, vehicles, phone records, evidence items, and activity log entries. Added an optional `tags` array to `Evidence` for matching methods and physical objects across cases. Tagged evidence in `CASE-00123` with `"grey-balaclava"` and `"crowbar-pry-marks"`.

**How it works (plain English):**
A system that finds links needs something to find. We are adding cases on purpose: one that shares a **car and a suspect** (strong), one that shares only a **place** (weak), one that shares a **phone number and similar names** (partly strong, partly unsure), and one **old closed case** that shares only the **method** (moderate). Real investigations look the same: sometimes the link is obvious, sometimes it is one small detail. **Tags** let evidence describe itself in a way that can be matched, like "pry marks from a crowbar".

**Key concepts:**
- **Evidence tags**: short descriptive labels (e.g., `"grey-balaclava"`, `"crowbar-pry-marks"`) allowing cross-case methodology matching.
- **Varying link strengths**: intentionally structuring data with varied overlap degrees (strong vehicle+person, weak location-only, alias/phone matches, and historical modus operandi).
- **Relational integrity**: ensuring all new records have consistent IDs, valid references, and updated activity logs without breaking prior tests.

**Files to open:**
- `src/types/evidence.ts` — updated `Evidence` type with `tags?: string[]`.
- `src/data/cases.ts` — four new case records (`CASE-00201` through `CASE-00204`).
- `src/data/evidence.ts` — tagged evidence items across current and past investigations.
- `src/data/persons.ts` — new persons with varied name overlaps and aliases.
- `src/data/relationships.ts` — graph edges connecting people, vehicles, locations, and incidents.

**What I should see:**
Four new cases in the Cases list, two of them closed (`CASE-00201` and `CASE-00204`), and the vehicle search for `GT-4521-23` showing `CASE-00201` in its linked cases. All existing tests pass.

**I should be able to explain:**
1. Why did we add a case that only shares a place with the main case?
2. What is an evidence tag and why does it help find links?
3. Why is the old closed case still useful to an investigator?

---

## Step 12 — The case comparison engine and the name search

**What was built:**
Implemented pure algorithmic engine functions in `src/lib/` to compare cases and detect cross-investigative links: `getCaseFingerprint` (extracting traces of people, vehicles, locations, phone numbers, evidence tags, and incident time of day), `compareCases` (evaluating weighted signal overlap with symmetric scoring and confidence levels), `generateLeads` (translating statistical matches into prioritized action instructions), `findRelatedCases`, `findAllCaseLinks`, and `searchByName` (fuzzy multi-entity search with Levenshtein typo tolerance and text mentions across all case materials).

**How it works (plain English):**
Each case leaves **traces**: people, cars, places, phone numbers, evidence, a time of day. The **fingerprint** is the list of those traces. To compare two cases, the computer lays the two lists side by side and counts what matches, with more points for traces that are harder to match by accident (a shared phone number is worth more than a shared place, because lots of cases happen in the same city). A **name match** between different records is only a *possibility*, so it gets few points and is labelled that way. The **leads** turn the numbers into sentences an investigator can act on. The **name search** matches the start of any word in a name or alias, forgives a one-letter typo, and also looks inside written text, so the name is found wherever it appears.

**Key concepts:**
- **Case fingerprinting**: consolidating heterogeneous entity IDs, normalized phone digits, tags, and minute-of-day offsets into a single queryable signature.
- **Weighted cross-case scoring**: assigning calibrated point weights (phones = 6, people/vehicles = 5, evidence tags = 4, locations = 2, time/type = 1) reflecting evidentiary rarity.
- **Speculative name matching**: detecting exact name, shared alias, and surname-only matches between separate records while capping influence to 5 points.
- **Investigative lead generation**: transforming mathematical intersections into actionable instructions with priority rankings.
- **Fuzzy name & text mention search**: tokenized prefix matching with Levenshtein distance fallback for typo-tolerant cross-case indexing.

**Files to open:**
- `src/lib/caseFingerprint.ts` — extracts case signatures from current state.
- `src/lib/caseComparison.ts` — comparison engine, symmetric scoring, and link finders.
- `src/lib/leads.ts` — prioritized investigative lead generator.
- `src/lib/nameSearch.ts` — fuzzy name search and document text mention scanner.
- `src/lib/__tests__/caseComparison.test.ts` — unit test suite for case comparisons.
- `src/lib/__tests__/nameSearch.test.ts` — unit test suite for name matching.

**What I should see:**
All 81 tests passing with `npm test`, zero linter errors, and clean builds. No visual screen changes yet (UI is built in Step 13).

**I should be able to explain:**
1. What is a case fingerprint?
2. Why is a shared phone number worth more points than a shared location?
3. Why does a name-only match get few points and a "possible" label?

---

## Step 13 — The screens for related cases and name search

**What was built:**
Implemented comprehensive UI screens and views connecting cases and individuals:
1. **Case Details Connections Tab (`src/components/CaseConnectionsTab.tsx`):** Organised into two clear sections: "Related cases" (at the top) displaying other cases with Current/Past badges, confidence score & level badges, shared entity chips with icons, and a Compare action; followed by "People in this case" preserving the pair connection scoring and BFS pathfinding tool.
2. **Side-by-Side Compare Page (`src/pages/CaseComparePage.tsx`):** Route `/cases/:caseId/compare/:otherCaseId` presenting both cases side by side with score and signal breakdown, prominent prioritized investigative leads ("Where to look") with direct entity links, categorized shared entity cards, side-by-side possible same person comparisons with calm advisory text, and synchronized side-by-side event timelines with shared location highlighting in UTC.
3. **Case Network Graph Mode (`src/pages/RelationshipGraphPage.tsx`):** Added a top-level toggle between "Entities" and "Cases". Cases mode renders every case as a node (blue for current, grey for past), links with score labels and thickness growing from WEAK (1.5px) to VERY STRONG (6px), a "Show weak links" toggle, interactive side panel with connection details, and dual-mode legend.
4. **Intelligent Name Search Screens (`src/pages/SearchPage.tsx`, `src/components/AppShell.tsx`, `src/pages/PersonDetailPage.tsx`):** Global search surfaces dedicated "People matching '<query>'" and "Cases where this name appears" sections with match reasons (`full name`, `first name`, `surname`, `alias`, `similar spelling`) and text snippets. Person detail page includes "Appears in cases" and "Possible same person in other records" cards.
5. **Dashboard Strongest Case Links (`src/pages/DashboardPage.tsx`):** Integrated top 5 strongest case links directly into the dashboard with links to their Compare pages.

**How it works (plain English):**
This is the main idea of the whole project. Instead of staring at one case, the investigator opens a case and sees a **ranked list of other cases that look similar**, with the reason written next to each. The **compare page** is a side-by-side table of two cases: what they share, what to check first, and the two timelines next to each other. The **case network** is the same information drawn as a map, where each dot is a case and a thick line means a strong link. The **name search** finds a person wherever the name shows up, even in a different spelling or only as an alias, and lists every case involved. All of it is **derived**: nothing is stored, so when the data changes, the links change.

**Key concepts:**
- **Dynamic Derived Intelligence:** No relational links or scores are permanently stored in the database. When the investigator adds a vehicle or a person to a case, the comparison engine recomputes fingerprints live, immediately surfacing links across the entire app.
- **Action-Oriented Investigative Leads:** Raw mathematical scores are translated into clear, prioritized instructions ("Where to look") highlighting specific shared vehicles, locations, or alibi check requirements.
- **Calm, Speculative Identity Management:** Distinguishing between confirmed identity links and speculative matches (e.g. matching surname or shared alias) with neutral wording: *"These are different records. Check whether they are the same person."*
- **Visual Network Hierarchy:** Dual-mode graph canvas allowing investigators to seamlessly toggle between microscopic entity relationships and macroscopic inter-case operational networks.

**Files to open:**
- `src/components/CaseConnectionsTab.tsx` — Related cases list and people connections.
- `src/pages/CaseComparePage.tsx` — Full side-by-side case comparison and timeline view.
- `src/pages/RelationshipGraphPage.tsx` — Entities vs Cases dual-mode network graph.
- `src/pages/SearchPage.tsx` — Specialized name search and case text mention results.
- `src/pages/PersonDetailPage.tsx` — Person profile with case affiliations and speculative identity check.
- `src/pages/DashboardPage.tsx` — Executive dashboard featuring strongest case links.
- `src/lib/__tests__/acceptanceStep13.test.ts` — Automated verification of all acceptance criteria.

**What I should see:**
Related cases listed on a case, a compare page with "where to look" leads, a map of linked cases, and a name search that lists every case a name appears in. All 87 unit and acceptance tests passing, 0 linter errors, and clean production builds.

**I should be able to explain:**
1. In one sentence, what does the system do for an investigator?
   *It automatically discovers, scores, and maps hidden connections between crimes, suspects, vehicles, and evidence across the entire department, showing investigators exactly where to look next.*
2. Why are the related cases calculated instead of stored?
   *Because investigation data is living and continuously changing; deriving links on-the-fly guarantees that the moment a detective links a new vehicle, logs a phone number, or adds a suspect, every related case updates instantly with zero stale data or manual re-indexing.*
3. Why does a name match say "check whether they are the same person" instead of "this is the same person"?
   *Because two records sharing a name, alias, or surname could be two different individuals (e.g. family members or unrelated namesakes); prematurely asserting they are identical could cause wrongful arrests or tainted evidence, so the system responsibly guides the human investigator to verify.*

---

## Step 14 — A simple Case map (make the graph page readable)

**What was built:**
Replaced the default view of `/graph` with an instantly readable, deterministic **Case map**. Cases are rendered as clean, non-draggable circles (blue border for current cases, grey border for past/closed cases, and a thicker highlighted border for the focused centre case) with a single-line legend underneath. Connection lines between cases communicate relationship strength through line thickness (1px WEAK, 2px MODERATE, 4px STRONG, 6px VERY STRONG), color, and a short label in plain words (`same person · same car · same method`). Clicking any line or case circle opens an interactive side panel showing exact shared entities with real names, the top 3 actionable investigative leads, and a direct button to the side-by-side Compare page. Added a "See on map" shortcut directly from a case's Connections tab (`/graph?case=<caseId>`). The detailed entity graph remains accessible under a top-level switch ("Case map" / "Detailed graph"), but is cleaned up: "All Cases" is removed, unconnected nodes in the current view are hidden, edge labels appear only for the selected node's links, the legend is collapsed into a non-intrusive button, and node spacing is substantially increased with stronger charge repulsion and collision radii so boxes never overlap.

**How it works (plain English):**
A graph is easy to read only when it shows **one kind of thing**. The old graph mixed five kinds (people, incidents, vehicles, evidence, locations), so nothing stood out. The Case map shows only cases, and uses **thickness** (how strong), **colour** (current or past) and a **short label** (why) to answer the three questions an investigator has: *which cases are linked, how strongly, and because of what.* The positions come from simple maths (an even circle), so the picture is the same every time and never overlaps. The detailed graph is the "zoom in" view for when you want to see the people and cars behind the link.

*Everyday analogy:*
Think of Google Maps. When you look at an entire country, you do not want to see every individual house, mailbox, and pedestrian — you just want to see major cities and the highways connecting them. The Case map is that country-level highway view, where each city is a case and the highways are the shared evidence linking them together. When an investigator wants to inspect the individual houses and mailboxes for a specific case, they zoom into the Detailed graph.

**Key concepts:**
- **Single-Entity Abstraction:** Presenting only case-level nodes so high-level investigative patterns and crime rings are immediately obvious within 5 seconds.
- **Deterministic Geometric Layout:** Replacing jittery physics simulations with clock-face radial circle mathematics, ensuring stable, neat, and non-overlapping layouts on every render.
- **Visual Encoding of Confidence:** Using thickness (1px–6px) and color (grey, blue, orange, red) to convey link strength, paired with plain-word summary labels (`same car · same person · same method`).
- **Focus vs. All Cases Navigation:** Allowing investigators to either orbit related cases around a single case of interest (`CASE-00123`) or view the macro circle of all department cases with interactive link highlighting.
- **Progressive Disclosure:** Keeping the Detailed graph available for deep entity inspection, but decluttering it by hiding unconnected nodes, collapsing the legend, and showing edge labels only for active selections.

**Files to open:**
- `src/lib/caseMap.ts` — pure data builder (`buildCaseMap`) and geometric circle layout (`layoutCaseMap`).
- `src/lib/caseComparison.ts` — added `describeSharedShort` helper returning ordered plain-word reasons.
- `src/pages/RelationshipGraphPage.tsx` — Case map with custom circle nodes and custom link edges, side panel, legend, and polished Detailed graph.
- `src/components/CaseConnectionsTab.tsx` — added "See on map" deep link next to Related cases heading.
- `src/lib/__tests__/caseMap.test.ts` — unit tests for focus mode, weak links, and geometric circle spacing.
- `src/lib/__tests__/acceptanceStep14.test.ts` — end-to-end acceptance tests verifying all Step 14 requirements.

**What I should see:**
A neat picture with the Accra Mall robbery in the middle and the other cases around it, joined by lines that say "same car · same person", and a panel that explains the link in plain words. In All cases mode, every case sits evenly on one big circle. The Detailed graph no longer has "All Cases", and nodes never overlap. All 101 tests pass, 0 linter errors, clean build.

**I should be able to explain:**
1. Why does the Case map only show cases and not people, cars and evidence?
   *Because mixing five different entity types simultaneously creates visual clutter where cases get lost in a sea of details. Showing only cases gives investigators an immediate, high-level map of how investigations interconnect, allowing them to grasp serial crime patterns in seconds before diving into specifics.*
2. What do the thickness, colour and label of a line tell you?
   *Thickness represents connection strength (from 1px for WEAK up to 6px for VERY STRONG). Colour indicates confidence level (grey, blue, orange, red). The label provides the plain-English evidentiary reason why the cases are linked (e.g. `same car · same person · same method`).*
3. Why is the layout a simple circle instead of a physics simulation?
   *Physics simulations are non-deterministic, jitter during rendering, and frequently pull nodes into overlapping clumps. Pure trigonometric circle maths places nodes at equal angular increments around the centre, guaranteeing a neat, consistent, stable picture with zero overlaps every single time.*

---

## Step 15 — Live updates, case order, and cross-case phone consistency

**What was built:**
- Fixed case list sorting: active cases (`investigating`, then `open`) appear first, ordered by priority (`critical` down to `low`) and newest update date; `pending` cases sit at the bottom.
- Live reactive updates: adding a person, linking a vehicle, or uploading evidence triggers instantaneous recalculation of case comparison fingerprints and people connection scores across all views without page reloads.
- Connection toast notifications: an 8-second toast banner alerts detectives whenever a new cross-case connection is uncovered or a connection level strengthens.
- Cross-case phone numbers and narrative consistency: populated unique, realistic Ghanaian phone numbers across persons in `src/data/persons.ts`. Clarified the storyline of MSISDN `0241111111` across `CASE-00123` and `CASE-00203` with case notes (`N-014`, `N-015`) and forensic documents (`D-007`, `D-008`), establishing that `0241111111` was an innocent civilian's registered number hijacked via SIM swap by the Osu syndicate and operated as an operational burner.

**How it works (plain English):**
Investigation systems need to react immediately as detectives enter clues from the field. When a phone number or vehicle is entered into one case, the system compares it against every other case in memory. Because phone numbers are registered to individuals, having full contact numbers for people allows investigators to spot shared communications, while background forensic notes explain why a cloned burner was used across two different robberies without falsely implicating innocent civilian owners.

**Key concepts:**
- **Dynamic in-memory diffing**: comparing before and after connection snapshots to generate friendly notifications (`Alice Mensah and Bob Asante now share a vehicle`).
- **Investigative realism**: distinguishing registered subscribers from unauthorized SIM swap perpetrators through linked intelligence notes and documents.
- **Deterministic ordering**: keeping high-priority, active cases at the top of the investigative queue while shelving pending cases at the bottom.
- **Narrative coherence in connection paths**: ensuring that when a civilian victim and a criminal suspect share a vehicle link (such as a vehicle reported stolen by the victim and later operated by the suspect), the UI explicitly presents the vehicle details, role tags (`victim` vs `suspect`), and background investigation notes instead of displaying an unhelpful abstract equation like `1 vehicle × 4 = 4`.


