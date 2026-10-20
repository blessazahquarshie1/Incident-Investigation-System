# Project Structure

```
web/
├── dist
│   ├── assets
│   │   ├── index-DQZa2Sl_.css
│   │   └── index-J0LzHEOh.js
│   ├── favicon.svg
│   ├── icons.svg
│   └── index.html
├── docs
│   ├── steps
│   │   ├── 00_MASTER_INSTRUCTIONS.md
│   │   ├── 01_font_size_fix.md
│   │   ├── 02_types_mock_data_store.md
│   │   ├── 03_dashboard.md
│   │   ├── 04_lists_filters_search.md
│   │   ├── 05_case_details.md
│   │   ├── 05b_add_everything_to_a_case.md
│   │   ├── 06_algorithms.md
│   │   ├── 07_timeline_conflicts.md
│   │   ├── 08_relationship_graph.md
│   │   ├── 09_custody_activity_log.md
│   │   ├── 10_reports_polish.md
│   │   ├── 11_more_cases_mock_data.md
│   │   ├── 12_case_comparison_engine.md
│   │   ├── 13_related_cases_screens.md
│   │   ├── 14_simple_case_map.md
│   │   └── 15_live_updates_and_case_order.md
│   ├── DEMO_SCRIPT.md
│   ├── LEARNING_NOTES.md
│   ├── PROGRESS.md
│   ├── PROJECT_REPORT.md
│   └── SPEC_CHECKLIST.md
├── public
│   ├── favicon.svg
│   └── icons.svg
├── scripts
│   └── dumpMockData.test.ts
├── src
│   ├── assets
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components
│   │   ├── ActivityFeed.tsx
│   │   ├── AddConnectionModal.tsx
│   │   ├── AddDocumentModal.tsx
│   │   ├── AddIncidentModal.tsx
│   │   ├── AddLocationToCaseModal.tsx
│   │   ├── AddNewVehicleModal.tsx
│   │   ├── AddPersonModal.tsx
│   │   ├── AddPhoneRecordModal.tsx
│   │   ├── AddSightingModal.tsx
│   │   ├── AddWitnessStatementModal.tsx
│   │   ├── AppShell.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── CaseConnectionsTab.tsx
│   │   ├── CaseTimelineTab.tsx
│   │   ├── ChangeLeadInvestigatorModal.tsx
│   │   ├── ConfirmDeleteModal.tsx
│   │   ├── ConnectionPathView.tsx
│   │   ├── ConnectionScoreCard.tsx
│   │   ├── ConnectionToast.tsx
│   │   ├── CreateLocationModal.tsx
│   │   ├── CustodySection.tsx
│   │   ├── DataGate.tsx
│   │   ├── DataTable.tsx
│   │   ├── EditPersonModal.tsx
│   │   ├── EmptyState.tsx
│   │   ├── EntityIcon.tsx
│   │   ├── EntityPicker.tsx
│   │   ├── EntityTypeBadge.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── FilterBar.tsx
│   │   ├── FormField.tsx
│   │   ├── Modal.tsx
│   │   ├── PageHeader.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── README.md
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Tabs.tsx
│   │   ├── TimelineView.tsx
│   │   └── UploadEvidenceModal.tsx
│   ├── data
│   │   ├── activityLog.ts
│   │   ├── cases.ts
│   │   ├── documents.ts
│   │   ├── evidence.ts
│   │   ├── incidents.ts
│   │   ├── index.ts
│   │   ├── locations.ts
│   │   ├── notes.ts
│   │   ├── officers.ts
│   │   ├── persons.ts
│   │   ├── phoneRecords.ts
│   │   ├── README.md
│   │   ├── relationships.ts
│   │   ├── sightings.ts
│   │   ├── travelTimes.ts
│   │   ├── vehicles.ts
│   │   └── witnessStatements.ts
│   ├── lib
│   │   ├── __tests__
│   │   │   ├── acceptanceStep05b.test.ts
│   │   │   ├── acceptanceStep13.test.ts
│   │   │   ├── acceptanceStep14.test.ts
│   │   │   ├── caseComparison.test.ts
│   │   │   ├── caseMap.test.ts
│   │   │   ├── caseRemovalAndEditing.test.ts
│   │   │   ├── connectionDiff.test.ts
│   │   │   ├── connections.test.ts
│   │   │   ├── custody.test.ts
│   │   │   ├── dates.test.ts
│   │   │   ├── filters.test.ts
│   │   │   ├── nameSearch.test.ts
│   │   │   ├── pathfinding.test.ts
│   │   │   ├── timeline.test.ts
│   │   │   └── validation.test.ts
│   │   ├── api.ts
│   │   ├── caseComparison.ts
│   │   ├── caseFingerprint.ts
│   │   ├── caseMap.ts
│   │   ├── caseScope.ts
│   │   ├── conflicts.ts
│   │   ├── connectionDiff.ts
│   │   ├── connections.ts
│   │   ├── custody.ts
│   │   ├── dashboard.ts
│   │   ├── dates.ts
│   │   ├── entityStyle.ts
│   │   ├── filters.ts
│   │   ├── graph.ts
│   │   ├── graphLayout.ts
│   │   ├── ids.ts
│   │   ├── leads.ts
│   │   ├── lookup.ts
│   │   ├── nameSearch.ts
│   │   ├── pathfinding.ts
│   │   ├── README.md
│   │   ├── report.ts
│   │   ├── search.ts
│   │   ├── timeline.ts
│   │   └── validation.ts
│   ├── pages
│   │   ├── CaseComparePage.tsx
│   │   ├── CaseDetailPage.tsx
│   │   ├── CasesPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EvidenceDetailPage.tsx
│   │   ├── EvidencePage.tsx
│   │   ├── IncidentDetailPage.tsx
│   │   ├── IncidentsPage.tsx
│   │   ├── InvestigatorsPage.tsx
│   │   ├── LocationDetailPage.tsx
│   │   ├── LocationsPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── PersonDetailPage.tsx
│   │   ├── PersonsPage.tsx
│   │   ├── README.md
│   │   ├── RelationshipGraphPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── TimelinePage.tsx
│   │   ├── VehicleDetailPage.tsx
│   │   └── VehiclesPage.tsx
│   ├── store
│   │   ├── README.md
│   │   └── useInvestigationStore.ts
│   ├── types
│   │   ├── activityLogEntry.ts
│   │   ├── case.ts
│   │   ├── caseDocument.ts
│   │   ├── evidence.ts
│   │   ├── graph.ts
│   │   ├── incident.ts
│   │   ├── index.ts
│   │   ├── investigationData.ts
│   │   ├── location.ts
│   │   ├── note.ts
│   │   ├── officer.ts
│   │   ├── person.ts
│   │   ├── phoneRecord.ts
│   │   ├── README.md
│   │   ├── sighting.ts
│   │   ├── vehicle.ts
│   │   └── witnessStatement.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── generateMockData.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── STRUCTURE.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── update_notes.py
├── update_progress.py
└── vite.config.ts
```
