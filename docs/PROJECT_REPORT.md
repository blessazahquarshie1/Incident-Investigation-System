# Incident Investigation System — Project Report

This report provides a complete, plain-English overview of the Incident Investigation and Case Intelligence Management System codebase. It is written so that a beginner can easily follow every part of the architecture, data, logic, and operational health.

---

## 1. Folder Map

The application source code lives inside `src/`. Below is every folder and file, with a plain sentence describing what it does.

### Root Files in `src/`
- `src/App.css`: Contains default CSS styles, which are mostly overridden by our Tailwind design system.
- `src/App.tsx`: Sets up the page router, navigation layout shell, and global error safety screen.
- `src/index.css`: Defines our typography scale, colour tokens, and Tailwind CSS design rules.
- `src/main.tsx`: The starting entry point that loads React and mounts our app into the web browser.

### `src/assets/`
- `src/assets/hero.png`: An illustration graphic used on introductory banner cards.
- `src/assets/react.svg`: The standard React logo graphic from project setup.
- `src/assets/vite.svg`: The standard Vite tooling logo graphic from project setup.

### `src/components/`
- `src/components/ActivityFeed.tsx`: Renders a chronological list of recent detective actions taken on a case.
- `src/components/AddConnectionModal.tsx`: A popup dialog that lets investigators link a person to a vehicle, location, or incident.
- `src/components/AddDocumentModal.tsx`: A popup form to attach warrants, statements, or forensic reports to a case.
- `src/components/AddIncidentModal.tsx`: A popup form to log a new crime incident directly into a case.
- `src/components/AddLocationToCaseModal.tsx`: A popup dialog to mark that a suspect visited a known physical place.
- `src/components/AddNewVehicleModal.tsx`: A popup form to register a new automobile and link it to case people.
- `src/components/AddPersonModal.tsx`: A popup form to add an existing person or register a new suspect or witness.
- `src/components/AddPhoneRecordModal.tsx`: A popup dialog to log mobile phone calls, text messages, or cell-tower pings.
- `src/components/AddSightingModal.tsx`: A popup form to record CCTV, camera, or informant sightings.
- `src/components/AddWitnessStatementModal.tsx`: A popup form to record formal witness statements placing people at locations.
- `src/components/AppShell.tsx`: The main page frame containing the sidebar, search box, reset button, and toast alerts.
- `src/components/Badge.tsx`: A reusable rounded pill tag used for status labels and counts.
- `src/components/Card.tsx`: A clean white rectangular box with a light grey border used to group content.
- `src/components/CaseConnectionsTab.tsx`: Renders cross-case connection links, people pair scores, and the shortest connection finder.
- `src/components/CaseTimelineTab.tsx`: Shows the case-specific chronological timeline of incidents, statements, and sightings.
- `src/components/ChangeLeadInvestigatorModal.tsx`: A popup form to re-assign which detective leads an investigation.
- `src/components/ConfirmDeleteModal.tsx`: A warning popup asking the user to confirm before removing a person, vehicle, or place.
- `src/components/ConnectionPathView.tsx`: Displays a visual breadcrumb chain showing how two people connect step-by-step.
- `src/components/ConnectionScoreCard.tsx`: A card showing the connection score between two people and a breakdown of why they connect.
- `src/components/ConnectionToast.tsx`: An automatic popup notification that appears for 8 seconds to report newly discovered links.
- `src/components/CreateLocationModal.tsx`: A popup form to register a new physical location in Ghana.
- `src/components/CustodySection.tsx`: Manages the formal legal chain of custody for evidence and prevents invalid actions.
- `src/components/DataTable.tsx`: A table component that supports column sorting, row clicks, and empty messages.
- `src/components/EditPersonModal.tsx`: A popup dialog to update a person's name, phone number, address, or aliases.
- `src/components/EmptyState.tsx`: A friendly placeholder shown when a table or list has no records to display.
- `src/components/EntityIcon.tsx`: Displays the official colored icon representing a person, car, place, crime, or evidence.
- `src/components/EntityPicker.tsx`: A dropdown selector that lets investigators search and pick an entity.
- `src/components/EntityTypeBadge.tsx`: A badge colored according to whether an item is a suspect, victim, or witness.
- `src/components/ErrorBoundary.tsx`: A safety guard that catches unexpected screen crashes and shows a recovery button.
- `src/components/FilterBar.tsx`: A top toolbar with a search box, dropdown filters, and a clear button.
- `src/components/FormField.tsx`: Wraps form inputs with a clear label, required asterisk, and red error text.
- `src/components/Modal.tsx`: A generic popup window with a dark backdrop that closes when clicking outside.
- `src/components/PageHeader.tsx`: Shows the 28px page title, short description, and top action buttons.
- `src/components/PriorityBadge.tsx`: A color-coded pill showing priority levels from low to critical.
- `src/components/StatCard.tsx`: A summary metric card showing large numbers and link buttons.
- `src/components/StatusBadge.tsx`: A color-coded badge indicating case status or evidence custody stage.
- `src/components/Tabs.tsx`: A horizontal tab bar that lets investigators switch between views without leaving the page.
- `src/components/TimelineView.tsx`: Displays events chronologically and flags impossible travel times in red.
- `src/components/UploadEvidenceModal.tsx`: A popup form to log physical or digital evidence items and link them to people.

### `src/data/`
- `src/data/activityLog.ts`: Pre-loaded audit log entries tracking past investigative actions.
- `src/data/cases.ts`: Pre-loaded criminal cases with descriptions, priorities, and statuses.
- `src/data/documents.ts`: Pre-loaded case documents such as warrants, autopsy reports, and forensic logs.
- `src/data/evidence.ts`: Pre-loaded evidence items with chain-of-custody histories and forensic tags.
- `src/data/incidents.ts`: Pre-loaded crime events with exact dates, times, and locations.
- `src/data/index.ts`: Combines all mock data files into one single data object for the store.
- `src/data/locations.ts`: Pre-loaded physical places in Ghana with city and region names.
- `src/data/notes.ts`: Pre-loaded detective investigation notes for cases.
- `src/data/officers.ts`: Pre-loaded police officers with badge numbers, departments, and ranks.
- `src/data/persons.ts`: Pre-loaded suspect, witness, and victim profiles with phone numbers and addresses.
- `src/data/phoneRecords.ts`: Pre-loaded mobile call logs, text messages, and cell-tower records.
- `src/data/relationships.ts`: Pre-loaded connections linking people to cars, locations, and crimes.
- `src/data/sightings.ts`: Pre-loaded camera and witness sightings of vehicles and suspects.
- `src/data/travelTimes.ts`: Look-up table of driving durations in minutes between major Ghanaian cities.
- `src/data/vehicles.ts`: Pre-loaded automobile records with license plates, makes, and models.
- `src/data/witnessStatements.ts`: Pre-loaded statements where witnesses describe seeing suspects at places.

### `src/lib/`
- `src/lib/caseComparison.ts`: Mathematical comparison engine that scores how closely two criminal cases are linked.
- `src/lib/caseFingerprint.ts`: Gathers all phones, vehicles, places, and methods in a case into a single footprint.
- `src/lib/caseMap.ts`: Calculates the visual clock-face circle positions for the visual case network map.
- `src/lib/caseScope.ts`: Helper queries that return only the people, evidence, or cars belonging to one case.
- `src/lib/conflicts.ts`: Detective algorithm that detects impossible travel times between consecutive sightings.
- `src/lib/connectionDiff.ts`: Compares before-and-after snapshots to find new links created by an investigator.
- `src/lib/connections.ts`: Algorithms that calculate connection strength scores between two people.
- `src/lib/custody.ts`: Police logic enforcing evidence custody rules and preventing destroyed items from being moved.
- `src/lib/dashboard.ts`: Aggregates case totals, open investigations, and priority counts for the main dashboard.
- `src/lib/dates.ts`: Formats timestamps into British English dates and times in UTC.
- `src/lib/entityStyle.ts`: Stores the official colors, backgrounds, and icons for each entity category.
- `src/lib/filters.ts`: Pure filtering functions that narrow down tables by search text, status, and category.
- `src/lib/graph.ts`: Converts investigation records into mathematical dots (nodes) and lines (edges).
- `src/lib/graphLayout.ts`: Tunes the physics simulation so dots on the relationship graph do not overlap.
- `src/lib/ids.ts`: Generates next sequential IDs like P-037 or CASE-00205.
- `src/lib/leads.ts`: Generates actionable investigative advice based on clues shared between cases.
- `src/lib/lookup.ts`: Looks up human names for officer IDs, place IDs, person IDs, and vehicle owners.
- `src/lib/nameSearch.ts`: Performs typo-tolerant and alias-aware suspect name searches.
- `src/lib/pathfinding.ts`: Uses Breadth-First Search (BFS) to find the shortest connection between two individuals.
- `src/lib/report.ts`: Gathers all case data into a clean structure ready for printable dossiers.
- `src/lib/search.ts`: Multi-category search engine that scores and ranks results across the whole system.
- `src/lib/timeline.ts`: Merges incidents, sightings, and statements into a single ordered timeline.
- `src/lib/validation.ts`: Form validation rules preventing duplicate vehicles, duplicate places, and future dates.

### `src/lib/__tests__/`
- Contains 15 automated Vitest test suites verifying connection scoring, custody rules, timelines, and acceptance criteria.

### `src/pages/`
- `src/pages/CaseComparePage.tsx`: Side-by-side case comparison screen with shared clues and dual timelines.
- `src/pages/CaseDetailPage.tsx`: Complete case workbench featuring 9 specialized investigation tabs.
- `src/pages/CasesPage.tsx`: Searchable table of all cases with hierarchical status sorting.
- `src/pages/DashboardPage.tsx`: Command dashboard with executive metrics, priority lists, and charts.
- `src/pages/EvidenceDetailPage.tsx`: Detailed view of an evidence item and its legal custody trail.
- `src/pages/EvidencePage.tsx`: Directory of all collected evidence items with status filters.
- `src/pages/IncidentDetailPage.tsx`: Profile page for an individual crime incident.
- `src/pages/IncidentsPage.tsx`: Directory of all reported crime incidents across all cases.
- `src/pages/InvestigatorsPage.tsx`: Overview of investigating detectives and their workload.
- `src/pages/LocationDetailPage.tsx`: Profile page for a physical place showing crimes committed there.
- `src/pages/LocationsPage.tsx`: Directory of all tracked physical locations across Ghana.
- `src/pages/NotFoundPage.tsx`: Clean 404 page shown when navigating to an unknown address.
- `src/pages/PersonDetailPage.tsx`: Profile page for an individual showing their addresses, cars, and links.
- `src/pages/PersonsPage.tsx`: Master directory of all suspects, witnesses, and victims.
- `src/pages/RelationshipGraphPage.tsx`: Interactive network graph showing visual entity links and the Case Map.
- `src/pages/ReportsPage.tsx`: Clean printable case dossier generator formatted for PDF export.
- `src/pages/SearchPage.tsx`: Full-screen search results page grouped by category with typo tolerance.
- `src/pages/TimelinePage.tsx`: System-wide master timeline highlighting travel conflicts in red.
- `src/pages/VehicleDetailPage.tsx`: Vehicle profile page showing registered owner, model, and sightings.
- `src/pages/VehiclesPage.tsx`: Directory of all tracked vehicles with license plate search.

### `src/store/`
- `src/store/useInvestigationStore.ts`: Global reactive Zustand store holding the investigation data in browser memory.

### `src/types/`
- Contains TypeScript type declarations defining the shapes of cases, persons, evidence, incidents, locations, vehicles, officers, and graph edges.

---

## 2. Pages

Here is every web route in the app, and what that page shows to an investigator:

1. `/` (Dashboard): The executive command center. It shows 7 summary stat cards, bar and donut charts of case statuses and types, an urgent priority case queue, the strongest cross-case links, and a live activity feed.
2. `/cases` (Cases List): A filterable master directory of all criminal cases. It is ordered by status (investigating first, pending at the bottom), priority, and updated date, and includes a "New case" modal.
3. `/cases/:caseId` (Case Details): The central investigative workbench with 9 dedicated tabs:
   - Overview: Case description, dates, counts, incidents, documents, and priority/status changers.
   - People: Suspects, witnesses, and victims with quick actions to edit details, remove people, or add connections.
   - Evidence: Catalog of case evidence with an upload form.
   - Timeline: Case-specific chronological event stream with travel conflict detection.
   - Locations: Places connected to the case and why they are connected.
   - Vehicles: Automobiles connected to the case with ownership linking and conflict warnings.
   - Connections: Related cases ordered by link strength, people pair scores, and a shortest-path finder tool.
   - Notes: Detective notes ordered newest first with an "Add note" box.
   - Activity: Complete chronological audit trail of all changes made to the case.
4. `/cases/:caseId/compare/:otherCaseId` (Case Comparison): A side-by-side comparison screen between two cases. It calculates connection scores, lists shared clues (vehicles, phone numbers, suspects, modus operandi tags), generates actionable investigative leads, and aligns both case timelines side-by-side.
5. `/incidents` (Incidents List): Directory of all crimes across cases, showing crime type, location, date, and resolution status.
6. `/incidents/:id` (Incident Details): Detailed view of an individual incident with connected locations and parent case link.
7. `/persons` (Persons List): Master directory of all persons with category badges, phone numbers, known aliases, and residential addresses.
8. `/persons/:id` (Person Details): Deep profile of an individual displaying known aliases, addresses, owned vehicles, and connection strength cards to other suspects.
9. `/evidence` (Evidence List): Catalog of all evidence across the system with type, case, and custody status filters.
10. `/evidence/:id` (Evidence Details): Full evidence dossier showing collected officer, tags, linked suspects, and an interactive custody tracker that enforces legal chain-of-custody rules.
11. `/vehicles` (Vehicles List): Directory of all vehicles showing license plate, make, model, color, and verified owner.
12. `/vehicles/:id` (Vehicle Details): Vehicle profile displaying the master owner, associated cases, and camera sightings.
13. `/locations` (Locations List): Catalog of physical places in Ghana showing city, region, and total incidents recorded there.
14. `/locations/:id` (Location Details): Physical location profile showing linked incidents, camera sightings, and suspect visits.
15. `/timeline` (Master Timeline): Global investigation timeline merging events from all cases, with date filters and impossible travel speed warnings highlighted in red.
16. `/graph` (Relationship Graph & Case Map): Visual intelligence workspace featuring two modes:
   - Detailed Entity Network: Interactive force-directed network graph showing connections between people, cars, places, and evidence for a selected case.
   - Case Map: Radial clock-face map showing how whole cases connect to one another, with link thickness representing shared evidence.
17. `/investigators` (Investigators Directory): Overview of police officers showing badge numbers, ranks, departments, and caseloads.
18. `/reports` (Printable Reports): Formal printable case file generator that compiles suspect profiles, evidence logs, custody histories, and timelines into clean printer/PDF format.
19. `/search` (Search Results): Full-screen search page that surfaces people, vehicles, cases, and places with typo tolerance and category filters.
20. `*` (Not Found): A friendly 404 page providing quick navigation back to the dashboard.

---

## 3. Data

### Record Counts
The pre-loaded mock investigation dataset contains:
- Cases: **16**
- Persons: **36**
- Incidents: **17**
- Evidence items: **35**
- Vehicles: **11**
- Physical Locations: **10**
- Police Officers: **6**
- Legal Documents: **8**
- Detective Notes: **15**
- Witness Statements: **8**
- Camera & Sighting Logs: **22**
- Phone & Cell-Tower Records: **17**
- Activity Log Entries: **42**
- Graph Relationships: **105**

### Table of All Cases
Here is the complete inventory of all 16 cases currently in the system:

| Case ID | Title | Type | Status | Priority | People | Evidence | Incidents |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CASE-00123` | Armed Robbery Investigation | theft | investigating | high | 2 | 4 | 1 |
| `CASE-00022` | Vehicle Theft | theft | closed | medium | 0 | 0 | 0 |
| `CASE-00031` | Hit and Run | assault | open | critical | 0 | 0 | 0 |
| `CASE-00001` | Case 1 | other | pending | low | 0 | 27 | 2 |
| `CASE-00002` | Case 2 | other | pending | low | 0 | 0 | 2 |
| `CASE-00003` | Case 3 | other | pending | low | 0 | 0 | 2 |
| `CASE-00004` | Case 4 | other | pending | low | 0 | 0 | 2 |
| `CASE-00005` | Case 5 | other | pending | low | 0 | 0 | 0 |
| `CASE-00006` | Case 6 | other | pending | low | 0 | 0 | 1 |
| `CASE-00007` | Case 7 | other | pending | low | 0 | 0 | 1 |
| `CASE-00008` | Case 8 | other | pending | low | 0 | 0 | 1 |
| `CASE-00009` | Case 9 | other | pending | low | 0 | 0 | 1 |
| `CASE-00201` | Kasoa Fuel Station Robbery | theft | closed | high | 3 | 1 | 1 |
| `CASE-00202` | Accra Mall Parking Vehicle Theft | theft | investigating | low | 2 | 1 | 1 |
| `CASE-00203` | Osu Mobile Money Fraud | fraud | investigating | medium | 4 | 1 | 1 |
| `CASE-00204` | Takoradi Market Theft (2024) | theft | closed | medium | 2 | 1 | 1 |

---

## 4. Logic

All business logic and calculations live in pure helper functions inside `src/lib/`. Here is every function, its file, what it does, and where it is used:

### `caseComparison.ts`
- `classifyComparisonScore(score)`: Classifies a numeric case similarity score into WEAK, MODERATE, STRONG, or VERY STRONG. Used internally in comparison calculations.
- `normaliseWords(str)`: Breaks text into lowercase alphanumeric words for fair comparison. Used in comparison engine, name search, and `PersonDetailPage`.
- `findNameMatches(data, caseAId, caseBId)`: Identifies exact, surname-only, or alias name matches between two cases. Used internally in `compareCases`.
- `compareCases(data, caseAId, caseBId)`: Computes the full comparison score, shared entities, and similarity reasons between two cases. Used in `CaseComparePage`.
- `findRelatedCases(data, caseId)`: Finds and ranks all other cases connected to a given case, strongest first. Used in `CaseConnectionsTab`, `caseMap`, and `connectionDiff`.
- `findAllCaseLinks(data, minScore)`: Finds all connected case pairs across the entire system above a minimum score threshold. Used in `DashboardPage` and `caseMap`.
- `describeSharedShort(rel)`: Generates a short plain-English label describing shared links (e.g. `same person · same car`). Used in `caseMap`.

### `caseFingerprint.ts`
- `normalisePhoneNumber(phone)`: Cleans a telephone number by stripping spaces, symbols, and country codes. Used internally when extracting fingerprints.
- `getCaseFingerprint(data, caseId)`: Pulls together all suspects, cars, places, phones, evidence tags, and crime times for a case. Used in `caseComparison`.

### `caseMap.ts`
- `buildCaseMap(data, options)`: Assembles the circular node and edge data structure for the Case Map view. Used in `RelationshipGraphPage`.
- `layoutCaseMap(nodes, mode, width, height)`: Arranges case circles in an even clock-face geometry so that nodes never collide. Used in `RelationshipGraphPage`.

### `caseScope.ts`
- `getCasePeople(data, caseId)`: Returns all people linked to a specific case. Used in `CaseDetailPage`, `CaseConnectionsTab`, modals, and reports.
- `getCaseEvidence(data, caseId)`: Returns all evidence items collected for a case. Used in `CaseDetailPage`, reports, and fingerprints.
- `getCaseIncidents(data, caseId)`: Returns all crime incidents filed under a case. Used in `CaseDetailPage`, modals, and reports.
- `getCaseDocuments(data, caseId)`: Returns all legal documents attached to a case. Used in `CaseDetailPage`.
- `getCaseNotes(data, caseId)`: Returns all detective notes recorded for a case. Used in `CaseDetailPage`.
- `getCaseVehicles(data, caseId)`: Returns all vehicles associated with a case through suspects, incidents, or sightings. Used in `CaseDetailPage` and graph views.
- `getCaseLocations(data, caseId)`: Returns all physical locations connected to a case through crimes, visits, or sightings. Used in `CaseDetailPage` and modals.
- `getCaseActivity(data, caseId)`: Returns all audit activity log entries for a case sorted newest first. Used in `CaseDetailPage` and reports.

### `conflicts.ts`
- `detectTimelineConflicts(events)`: Inspects sequential sightings of a person to flag travel that is physically impossible in the time elapsed. Used in `TimelineView`, `TimelinePage`, and reports.

### `connectionDiff.ts`
- `getConnectionSnapshot(data, caseId)`: Takes a point-in-time snapshot of all person-pairs and related cases for a case. Used in `useInvestigationStore`.
- `diffSnapshots(before, after)`: Compares two snapshots to produce plain-English descriptions of newly discovered links. Used in `useInvestigationStore`.

### `connections.ts`
- `getPersonFootprint(data, personId)`: Gathers visited places, cars, incidents, evidence, and phones for a person. Used in connection calculations.
- `classifyScore(score)`: Maps a numeric person-connection score to WEAK, MODERATE, STRONG, or VERY STRONG. Used in connection scoring.
- `calculateConnection(data, personAId, personBId)`: Calculates the exact shared link score and level between two individuals. Used in `CaseConnectionsTab`, `PersonDetailPage`, and reports.
- `describeScore(pair)`: Produces plain-English arithmetic breakdown lines explaining a connection score. Used in `ConnectionScoreCard` and reports.
- `findConnections(data, personId)`: Finds all people connected to a given individual across the entire system. Used in `PersonDetailPage`.

### `custody.ts`
- `deriveStatus(custodyHistory)`: Derives the legal status of an evidence item from its most recent custody action. Used in `CustodySection` and reports.
- `getAllowedActions(currentStatus)`: Returns the valid next legal actions for an evidence item, blocking impossible transitions. Used in `CustodySection`.
- `getCurrentHolderId(custodyHistory)`: Returns the ID of the officer or facility currently holding the evidence item. Used in `CustodySection` and reports.
- `validateCustodyAction(evidence, action, options)`: Checks whether a requested custody transfer obeys police regulations. Used internally in custody actions.
- `applyCustodyAction(evidence, action, officerId, options)`: Appends an authorized custody entry and updates the evidence item's status. Used in `useInvestigationStore` and `CustodySection`.

### `dashboard.ts`
- `getDashboardStats(data)`: Calculates counts of open cases, critical cases, unresolved crimes, and recent activity for the dashboard. Used in `DashboardPage`.

### `dates.ts`
- `formatDate(iso)`: Formats an ISO date into clean British English (e.g., `14 Sep 2026`). Used across almost all pages and tables.
- `formatTime(iso)`: Formats an ISO timestamp into clean 24-hour or 12-hour UTC time. Used in timeline and report components.
- `formatDateTime(iso)`: Formats an ISO timestamp into date and time with 12-hour clock (e.g., `15 Sep 2026 at 5:30pm`). Used across tables and details.

### `entityStyle.ts`
- Exports fixed visual styling tokens (Lucide icon, text color, background pill color) for each entity category. Used across badges and graph nodes.

### `filters.ts`
- `sortCasesDefault(cases)`: Sorts cases strictly by status (investigating > open > closed > pending), priority, and updated date. Used in `CasesPage`.
- `filterCases(cases, filters)`: Filters case records by text, crime type, priority, and status. Used in `CasesPage`.
- `filterPersons(persons, filters)`: Filters person records by name, role, phone, or address. Used in `PersonsPage`.
- `filterEvidence(evidence, filters)`: Filters evidence items by text, category, and custody status. Used in `EvidencePage`.
- `filterIncidents(incidents, filters)`: Filters incident records by text, type, and status. Used in `IncidentsPage`.
- `filterVehicles(vehicles, filters)`: Filters vehicle records by plate, make, or model. Used in `VehiclesPage`.
- `filterLocations(locations, filters)`: Filters physical places by name or city. Used in `LocationsPage`.
- `filterOfficers(officers, filters)`: Filters police officers by name or rank. Used in `InvestigatorsPage`.

### `graph.ts`
- `getNodeType(id)`: Determines an entity category (person, vehicle, place, etc.) from its ID prefix. Used across detail pages and search.
- `buildGraph(data)`: Builds a complete network graph of nodes and relationship edges from all investigation entities. Used in `RelationshipGraphPage` and detail pages.
- `getNeighbors(graph, nodeId)`: Returns all entities directly connected to a given item. Used across detail pages.
- `getNodeEdges(graph, nodeId)`: Returns all relationship lines touching a specific entity. Used in detail pages.
- `getLinkedCaseIds(data, graph, nodeId)`: Returns all case IDs connected to an entity directly or via immediate neighbors. Used in search.

### `graphLayout.ts`
- `computeLayout(nodes, edges, width, height)`: Runs a deterministic 300-tick D3 force simulation to space out nodes without overlapping. Used in `RelationshipGraphPage`.

### `ids.ts`
- `nextId(prefix, existingIds)`: Calculates the next sequential identifier (e.g. `P-037` from existing `P-036`). Used in store creation actions.

### `leads.ts`
- `generateLeads(comparison, caseA, caseB, data)`: Produces prioritized investigative advice based on cross-case connections. Used in `CaseComparePage`.

### `lookup.ts`
- `getOfficerName(data, id)`: Looks up an officer's full name from their ID. Used in case views, activity feeds, and custody views.
- `getLocationName(data, id)`: Looks up a location's name and city from its ID. Used in timelines and incident pages.
- `getPersonName(data, id)`: Looks up a person's full name from their ID. Used in connections tabs and timelines.
- `getVehicleOwner(data, vehicleId)`: Master lookup resolving a vehicle's owner from the `owns` relationship edge with fallback. Used in vehicle and case pages.
- `getEntityLabel(data, id)`: Looks up a human-readable title for any entity ID. Used in store activity logging.

### `nameSearch.ts`
- `searchByName(data, query)`: Performs typo-tolerant and alias-aware name matching across persons and full-text case documents. Used in `AppShell` and `SearchPage`.

### `pathfinding.ts`
- `findShortestConnection(data, startId, targetId)`: Runs Breadth-First Search (BFS) to find the shortest chain of connections between two people. Used in `CaseConnectionsTab` and `RelationshipGraphPage`.

### `report.ts`
- `buildCaseReport(data, caseId)`: Compiles all case intelligence into structured sections for printable PDF dossiers. Used in `ReportsPage`.

### `search.ts`
- `searchAll(data, graph, query)`: Multi-entity search engine that scores matches across persons, vehicles, cases, evidence, and places. Used in `AppShell` and `SearchPage`.
- `getResultPath(result)`: Returns the browser URL path for any search result item. Used in `AppShell` and `SearchPage`.

### `timeline.ts`
- `buildTimeline(data, caseId?)`: Merges incidents, sightings, statements, and phone records into a unified chronological sequence. Used in `TimelineView`, `TimelinePage`, and `CaseComparePage`.

### `validation.ts`
- `normalisePlate(plate)`: Removes spaces and hyphens from license plates for duplicate checking. Used internally.
- `isDuplicateVehicle(vehicles, plate)`: Checks if a license plate already exists in the system. Used in vehicle creation.
- `isDuplicateLocation(locations, name, city)`: Checks if a location name and city already exist. Used in location creation.
- `findExistingLocation(locations, name, city)`: Finds an existing location matching a name and city. Used in modals.
- `parseInputAsUtc(date, time)`: Safely parses date and time inputs into a standardized UTC timestamp. Used in modals.
- `isFutureDateTime(iso)`: Checks if a timestamp lies in the future. Used in validation.
- `validateIncidentInput`, `validateDocumentInput`, `validateLeadInvestigatorInput`, `validateLocationInput`, `validateVehicleInput`, `validateConnectionInput`, `validateWitnessStatementInput`, `validateSightingInput`, `validatePhoneRecordInput`: Validate required fields and formats for user forms. Used across modal components.

---

## 5. Store

The Zustand store in `src/store/useInvestigationStore.ts` holds all live investigation data in memory and persists it to browser `localStorage` under the key `iis-investigation-data-v1`. Here is every action and what it modifies:

1. `showToast({ caseId, title, changes })`: Displays an 8-second toast alert informing the investigator of changes and newly discovered links.
2. `dismissToast()`: Clears and closes the currently active toast notification.
3. `resetDemoData()`: Restores the store's data back to the original pre-loaded mock dataset.
4. `addActivity(entry)`: Appends an audit log entry tracking an investigator's action with timestamps and officer ID.
5. `createCase(input)`: Generates a new case with next available ID, sets status to `open`, updates timestamps, and logs activity.
6. `changeCasePriority(caseId, priority)`: Updates a case's priority level, refreshes its `updatedAt` timestamp, and logs the change.
7. `changeCaseStatus(caseId, status)`: Updates a case's status (e.g. open to investigating), refreshes its `updatedAt` timestamp, and logs the change.
8. `addPersonToCase(caseId, personId)`: Adds the case ID to a person's `relatedCases` list and measures any newly discovered connections.
9. `createPersonForCase(caseId, input)`: Registers a brand-new person, links them to the case, and measures new connections.
10. `linkVehicleToPerson(caseId, vehicleId, personId, relationship)`: Adds an `owns` or `connected-to` edge, syncs `Vehicle.ownerId`, demotes any conflicting owner to `connected-to`, and notifies of new connections.
11. `addEvidence(caseId, input)`: Creates a new evidence item with an initial custody collection entry and links it to suspects.
12. `addNote(caseId, text)`: Appends a timestamped detective note to the case notes list.
13. `applyEvidenceCustodyAction(evidenceId, action, options)`: Validates and appends a legal chain-of-custody transfer entry and updates evidence status.
14. `addIncidentToCase(caseId, input)`: Creates a new crime incident associated with the case and connects its location.
15. `addDocumentToCase(caseId, input)`: Attaches a legal warrant, autopsy report, or court statement to the case documents list.
16. `changeLeadInvestigator(caseId, officerId)`: Re-assigns the lead investigator for a case and logs the audit event.
17. `createLocation(input)`: Adds a new physical location to the locations directory if it does not already exist.
18. `addVisitedLocation(caseId, locationId, personId)`: Records that a suspect visited a location and calculates connection changes.
19. `createVehicle(caseId, input, connections)`: Creates a new vehicle record and connects it to people or incidents in the case.
20. `addConnection(caseId, edge)`: Adds a relationship edge between entities, resolves vehicle owner conflicts, and computes new connection diffs.
21. `addWitnessStatement(caseId, input)`: Records a formal witness statement linking a suspect to a location and time.
22. `addSighting(caseId, input)`: Records a camera, patrol, or informant sighting of a vehicle or person.
23. `addPhoneRecord(caseId, input)`: Records a mobile phone call, SMS, or cell-tower ping and measures shared phone connection score boosts.
24. `removePersonFromCase(caseId, personId)`: Removes a case from a person's `relatedCases`, prunes case incident/evidence links, and preserves the person profile.
25. `removeVehicleFromCase(caseId, vehicleId)`: Prunes case-specific connections and sightings for a vehicle while keeping the vehicle profile.
26. `removeLocationFromCase(caseId, locationId)`: Unlinks a location from case incidents, visits, and sightings while keeping the location in the system.
27. `updatePerson(personId, input, caseId)`: Updates an individual's personal details, phone number, aliases, or address, and refreshes connection diffs.

---

## 6. Steps Status (Steps 01 to 13, including 05b)

Here is the exact status of each specification step from `docs/steps/`:

- **Step 01 (Font size fix + shared components):** **Done.** Root font set to 16px, table text to 15px, minimum caption text to 13px; shared components (`PageHeader`, `Badge`, `Card`, `DataTable`, `FilterBar`, etc.) created and deployed. Nothing is missing.
- **Step 02 (Types, mock data, store):** **Done.** Strict TypeScript models, hand-crafted Ghanaian mock dataset with all 7 investigative stories, and the initial Zustand store implemented. Nothing is missing.
- **Step 03 (Dashboard):** **Done.** Executive dashboard built with 7 responsive stat cards, Recharts status and type charts, urgent case queues, and activity stream. Nothing is missing.
- **Step 04 (Lists, filters, search):** **Done.** Searchable directories for cases, people, incidents, evidence, vehicles, locations, and investigators; advanced multi-entity search and detail pages. Nothing is missing.
- **Step 05 (Case details — 9 tabs):** **Done.** Full case workbench with Overview, People, Evidence, Timeline, Locations, Vehicles, Connections, Notes, and Activity tabs. Nothing is missing.
- **Step 05b (Add everything to a case):** **Done.** Comprehensive modals enabling investigators to add people, crimes, vehicles, visits, evidence, statements, sightings, and phone records to a case. Verified via automated end-to-end acceptance scenario. Nothing is missing.
- **Step 06 (Algorithms):** **Done.** Mathematical connection scoring engine (`calculateConnection`), score level classification, and Breadth-First Search (`findShortestConnection`) pathfinder. Nothing is missing.
- **Step 07 (Timeline + conflicts):** **Done.** Automatic case and global timeline builder and travel conflict engine flagging impossible speeds across Ghanaian cities. Nothing is missing.
- **Step 08 (Relationship graph):** **Done.** Interactive force-directed network graph built with `@xyflow/react` and D3 physics, featuring entity filters and detail inspection. Nothing is missing.
- **Step 09 (Custody + activity log):** **Done.** Strict police chain-of-custody transition engine with blocked invalid actions and case audit activity feeds. Nothing is missing.
- **Step 10 (Reports + polish):** **Done.** Multi-section printable case dossier generator formatted for clean browser printing and PDF export. Nothing is missing.
- **Step 11 (More cases mock data):** **Done.** Expanded mock data with 4 interconnected cases (`CASE-00201`, `CASE-00202`, `CASE-00203`, `CASE-00204`) featuring shared vehicles, phones, places, and evidence tags. Nothing is missing.
- **Step 12 (Case comparison engine):** **Done.** Symmetric case comparison engine (`caseComparison.ts`), case fingerprint extraction, investigative lead generation, and typo-tolerant name search. Nothing is missing.
- **Step 13 (Related cases screens):** **Done.** Related cases workspace in the Connections tab, side-by-side comparison screen (`/cases/:id/compare/:otherId`), and dashboard case links. Nothing is missing.

---

## 7. Redundant or Unused Items

To keep the project clean and maintainable, here is an honest assessment of files, components, and data that are redundant or not needed for finding connections between cases:

1. **`src/App.css`:** Contains boilerplate CSS classes from Vite's template. Since the entire app uses Tailwind CSS v4 in `src/index.css`, this file is completely unused.
2. **`src/assets/react.svg` and `src/assets/vite.svg`:** Default template image files from Vite initialization that are never referenced or rendered in the application.
3. **Placeholder Cases `CASE-00001` through `CASE-00009`:** These 9 cases were generated during early scaffolding as low-priority placeholder items. They have no linked people or real investigative stories. Because they are set to `pending`, our hierarchical sorting pushes them to the bottom, but they add visual noise to the case directory and could be pruned.
4. **`Vehicle.ownerId` field duplication:** Ownership was originally stored directly on `Vehicle.ownerId`. We established the master source of truth as the `owns` relationship edge in graph relationships and added `getVehicleOwner`. While `Vehicle.ownerId` is kept in sync for backwards compatibility, maintaining two copies of ownership is inherently redundant.
5. **`InvestigatorsPage.tsx`:** While helpful as an administrative directory of officers, police workload management is largely auxiliary to the core mission of finding hidden connections and travel conflicts between criminal cases.

---

## 8. Health

The codebase is in excellent health:

- **Build (`npm run build`):** **PASS** (exit code 0). Compiles cleanly with zero TypeScript errors across strict mode (`tsc -b`), and Vite packages client assets in ~2 seconds.
- **Test Suite (`npm test`):** **PASS** (exit code 0). All **15 test files** and **107 unit and acceptance tests** pass with zero failures.
- **Linter (`npm run lint`):** **PASS** (exit code 0). `oxlint` reports 0 warnings and 0 errors across all project files.
- **Errors:** Zero compilation errors, zero test failures, zero linting violations.

---

## 9. Full Contents of `docs/PROGRESS.md`

Below is the complete, exact content of `docs/PROGRESS.md`:

```markdown
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
17. **In-App Confirmation Dialog & Backdrop Auto-Cancel:** Entity removals (Persons, Locations, Vehicles) use an in-app modal (`ConfirmDeleteModal.tsx`) with a warning message, Cancel, and red Confirm action. Clicking the backdrop or empty space outside the modal automatically cancels and dismisses it.
18. **Person Editing & Case Entity Removals:** Added inline `Edit` action and red `Remove` action beside persons on the People tab, locations on the Locations tab, and vehicles on the Vehicles tab, accompanied by complete audit logging and relationship pruning in `useInvestigationStore.ts`.
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

---

## Blockers

*(None. All 10 steps are complete, fully verified, and operational.)*

---

## First Things to Check in the Morning

1. **Run Unit Tests:** Execute `npm test` to verify all automated tests pass cleanly.
2. **Verify Production Build:** Run `npm run build` to confirm strict TypeScript compilation (`tsc -b`) and Vite bundling exit with code 0.
3. **Run Static Linter:** Execute `npm run lint` to confirm `oxlint` reports 0 errors and 0 warnings.
4. **Start Development Server:** Run `npm run dev` and open `http://localhost:5173/` in Chrome to verify the live executive dashboard, responsive charts, and operational stat cards.
5. **Walk Through the Demo Script:** Follow `docs/DEMO_SCRIPT.md` to execute the presentation.
6. **Test Printable Reports:** Navigate to `http://localhost:5173/reports`, verify the compiled dossier sections for `CASE-00123`, and test printing.
7. **Inspect Specification Matrix:** Review `docs/SPEC_CHECKLIST.md` to confirm every supervisor requirement is mapped to its implementing file.
```

