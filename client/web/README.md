# Incident Investigation and Case Intelligence Management System

A web-based intelligence workbench and case management application designed for investigative teams and crime analysts. The system enables investigators to organize cases, track suspects, evaluate associative link strength, analyze chronologies for alibi contradictions, visualize multi-entity networks with force-directed graphs, enforce evidence custody integrity, and compile intelligence dossiers.

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)

### Installation
Clone or navigate to the project directory and install dependencies:
```bash
npm install
```

### Development Server
Run the local Vite development server with Hot Module Replacement:
```bash
npm run dev
```
The app will be accessible at `http://localhost:5173/`.

### Run Automated Tests
Execute the Vitest test suite covering custody rules, connection scoring, pathfinding, and timeline conflict detection:
```bash
npm test
```

### Production Build & Linting
Verify TypeScript compilation, asset bundling, and code quality:
```bash
npm run lint    # Runs oxlint static analysis (0 warnings, 0 errors)
npm run build   # Runs tsc -b and vite production build
```

---

## Folder Structure

```
incident-investigation-system/
├── docs/                      # Architectural specifications & learning documentation
│   ├── steps/                 # Detailed step-by-step build plans (01–10)
│   ├── SPEC_CHECKLIST.md      # Full specification verification matrix
│   ├── DEMO_SCRIPT.md         # 12-step evaluator demonstration walkthrough
│   ├── LEARNING_NOTES.md      # Plain-language concept guides & architectural notes
│   └── PROGRESS.md            # Build logs, verification metrics & status tracking
├── src/
│   ├── components/            # Reusable UI components & domain-specific widgets
│   │   ├── ActivityFeed.tsx   # Day-grouped operational audit timeline
│   │   ├── AppShell.tsx       # Main layout with responsive sidebar and top-bar search
│   │   ├── Badge.tsx          # Base pill badge component (min 13px typography)
│   │   ├── Card.tsx           # Standard white rounded card container
│   │   ├── CaseConnectionsTab.tsx # Case link analysis and pathfinding tab
│   │   ├── CaseTimelineTab.tsx    # Scoped case timeline with conflict alerts
│   │   ├── ConnectionPathView.tsx # Visual node chip chain for BFS paths
│   │   ├── ConnectionScoreCard.tsx# Associative score card with level badge and formula breakdown
│   │   ├── CustodySection.tsx # State machine-driven evidence custody workbench
│   │   ├── DataTable.tsx      # Sortable, responsive table component
│   │   ├── EmptyState.tsx     # Standard empty/zero state placeholder
│   │   ├── EntityIcon.tsx     # Standardized Lucide icon per entity type
│   │   ├── EntityTypeBadge.tsx# Colored badge matching entity type style
│   │   ├── ErrorBoundary.tsx  # React component crash handler with reload prompt
│   │   ├── FilterBar.tsx      # Multi-field search and filter control bar
│   │   ├── Modal.tsx          # Accessible modal dialog with backdrop
│   │   ├── PageHeader.tsx     # Standard page title and action header
│   │   ├── PriorityBadge.tsx  # Priority pill badge (low, medium, high, critical)
│   │   ├── StatCard.tsx       # Key metric stat card with direct navigation links
│   │   ├── StatusBadge.tsx    # Status badge for cases, incidents, and evidence
│   │   ├── Tabs.tsx           # Accessible tab navigation component
│   │   └── TimelineView.tsx   # Chronological event sequence with conflict banners
│   ├── data/                  # Realistic mock database (7 interconnected investigation stories)
│   │   ├── activityLog.ts     # System audit trail records
│   │   ├── cases.ts           # Case records (including Armed Robbery CASE-00123)
│   │   ├── documents.ts       # Warrants, reports, and court orders
│   │   ├── evidence.ts        # Physical, digital, and forensic items
│   │   ├── incidents.ts       # Crime incident reports
│   │   ├── locations.ts       # Ghanaian cities and operational facilities
│   │   ├── notes.ts           # Investigator case notes
│   │   ├── officers.ts        # CID investigators and forensic specialists
│   │   ├── persons.ts         # Suspects, witnesses, victims, and POIs
│   │   ├── phoneRecords.ts    # Call logs, SMS records, and cell-tower telemetry
│   │   ├── relationships.ts   # Explicit entity association edges
│   │   ├── sightings.ts       # CCTV, patrol, and ANPR surveillance sightings
│   │   ├── travelTimes.ts     # City-to-city transit durations for alibi validation
│   │   ├── vehicles.ts        # Registered and impounded vehicles
│   │   ├── witnessStatements.ts # Recorded witness depositions and presence claims
│   │   └── index.ts           # Mock database assembler
│   ├── lib/                   # Algorithmic engines and pure business logic
│   │   ├── __tests__/         # Vitest unit test suites
│   │   │   ├── connections.test.ts # Connection strength scoring tests
│   │   │   ├── custody.test.ts     # Finite state machine custody tests
│   │   │   ├── pathfinding.test.ts # Breadth-First Search (BFS) path tests
│   │   │   └── timeline.test.ts    # Event sorting and conflict detection tests
│   │   ├── caseScope.ts       # Data scoping functions per case container
│   │   ├── conflicts.ts       # Travel time-based alibi contradiction engine
│   │   ├── connections.ts     # Weighted multi-factor connection scoring (2/4/5/5/6)
│   │   ├── custody.ts         # Finite state machine enforcing evidence transitions
│   │   ├── dashboard.ts       # High-level operational KPI aggregation
│   │   ├── dates.ts           # UTC timestamp and British English date formatters
│   │   ├── entityStyle.ts     # Canonical color, badge, and icon mappings per entity
│   │   ├── filters.ts         # Generic pure filtering functions for list views
│   │   ├── graph.ts           # Undirected multi-type investigation graph synthesis
│   │   ├── graphLayout.ts     # Deterministic synchronous d3-force physics layout
│   │   ├── ids.ts             # Sequential ID generation utilities
│   │   ├── lookup.ts          # Entity name and reference resolution helpers
│   │   ├── pathfinding.ts     # Breadth-First Search (BFS) shortest pathfinder
│   │   ├── report.ts          # 7-section intelligence dossier compiler
│   │   ├── search.ts          # Multi-entity fuzzy substring search & ranking
│   │   └── timeline.ts        # Multi-source timeline normalization engine
│   ├── pages/                 # Route page components
│   │   ├── CaseDetailPage.tsx # Comprehensive 9-tab case investigation view
│   │   ├── CasesPage.tsx      # Case directory and creation workbench
│   │   ├── DashboardPage.tsx  # Executive operational overview and analytics
│   │   ├── EvidenceDetailPage.tsx # Evidence inspection and custody log view
│   │   ├── EvidencePage.tsx   # Evidence inventory with status filtering
│   │   ├── IncidentDetailPage.tsx # Incident report view with connected entities
│   │   ├── IncidentsPage.tsx  # Incident log and crime category breakdown
│   │   ├── InvestigatorsPage.tsx # Officer roster with caseload and metrics
│   │   ├── LocationDetailPage.tsx # Location dossier and crime incident history
│   │   ├── LocationsPage.tsx  # City directory and incident density tracking
│   │   ├── NotFoundPage.tsx   # 404 error page for unmatched routes
│   │   ├── PersonDetailPage.tsx # Subject dossier and direct connection analysis
│   │   ├── PersonsPage.tsx    # Person directory with classification filters
│   │   ├── RelationshipGraphPage.tsx # React Flow network graph with pathfinder
│   │   ├── ReportsPage.tsx    # Printable CID case intelligence dossier
│   │   ├── SearchPage.tsx     # Global multi-entity search results page
│   │   ├── TimelinePage.tsx   # Master investigation event timeline and alibi audit
│   │   ├── VehicleDetailPage.tsx # Vehicle profile, ownership, and sighting links
│   │   └── VehiclesPage.tsx   # Vehicle registry and ANPR lookup
│   ├── store/                 # Global state management
│   │   └── useInvestigationStore.ts # Zustand reactive store with mutation audit logging
│   ├── types/                 # Strict TypeScript domain interfaces
│   │   └── ... (15 type files re-exported in index.ts)
│   ├── App.tsx                # Master routing configuration and ErrorBoundary wrapper
│   ├── index.css              # Tailwind CSS v4 design tokens and base typography (>=13px)
│   └── main.tsx               # React application entry point
```

---

## Application Pages Overview

1. **Dashboard (`/`)**: Executive intelligence summary displaying 7 key operational counts, case status and type distribution charts, urgent cases, and recent audit activity.
2. **Cases (`/cases`)**: Master case directory with multi-field filtering, status tracking, and modal for creating new case files.
3. **Incidents (`/incidents`)**: Catalogue of reported criminal incidents filterable by category, resolution status, and associated case.
4. **Persons (`/persons`)**: Comprehensive registry of suspects, witnesses, victims, and persons of interest with alias and case tracking.
5. **Evidence (`/evidence`)**: Forensic and physical property catalog tracking item types, collection dates, and current custody statuses.
6. **Vehicles (`/vehicles`)**: Automotive registry tracking license plates, ownership linkages, and surveillance sightings.
7. **Locations (`/locations`)**: Directory of cities, operational facilities, and crime scenes tracking incident density.
8. **Timeline (`/timeline`)**: Chronologically normalized master event stream synthesizing 6 disparate telemetry sources with automated travel-time alibi conflict detection.
9. **Relationship Graph (`/graph`)**: Interactive React Flow visual canvas with deterministic d3-force positioning, case filtering, node search camera focus, and shortest-path visual highlighting.
10. **Investigators (`/investigators`)**: CID officer directory detailing active caseloads, evidence collected, and administrative actions logged.
11. **Reports (`/reports`)**: Official 7-section printable intelligence dossier with print-optimized styling for physical handover or PDF export.
