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


