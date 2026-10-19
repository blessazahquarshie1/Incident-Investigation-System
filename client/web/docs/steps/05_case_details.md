# Step 05 — Case details page with 9 tabs

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
Build `/cases/:caseId`, the page an investigator lives in. It has 9 tabs, and every change made here is recorded in the activity log.

## 1. Case-scoped helpers (`src/lib/caseScope.ts`)
Pure functions that answer "what belongs to this case?":
- `getCasePeople(data, caseId)`: persons whose `relatedCases` include the case.
- `getCaseEvidence`, `getCaseIncidents`, `getCaseDocuments`, `getCaseNotes`: matching `caseId`.
- `getCaseVehicles(data, caseId)`: vehicles connected (via the graph) to the case's people or incidents, plus vehicles in the case's sightings.
- `getCaseLocations(data, caseId)`: locations of the case's incidents and evidence, locations visited by the case's people, and locations in the case's sightings, without duplicates.
- `getCaseActivity(data, caseId)`: the case's `ActivityLogEntry` records, newest first.

## 2. Page header (above the tabs)
Show exactly the layout the supervisor describes:

```
CASE-00123
Armed Robbery Investigation
Priority: HIGH        Status: INVESTIGATING        Lead Investigator: Officer Mensah
```
Use the shared badges. Add a back link to `/cases`. The active tab is stored in the URL (`?tab=people`) so a tab can be linked to and refreshing keeps it. Unknown case id → a friendly "Case not found" empty state with a link back to the list.

## 3. The 9 tabs
1. **Overview**: description, type, created and updated dates, counts (people, evidence, incidents, documents, notes), the incidents list, and the case documents list. Two controls: **Change priority** and **Change status** (select + "Save" button).
2. **People**: people grouped by type (suspects, witnesses, victims, persons of interest) with phone and aliases, each linking to its detail page. A form "Add person to case" with two modes: pick an existing person, or create a new one (name, type, phone, address).
3. **Evidence**: table of the case's evidence (id, title, type, status badge, collected by/at), rows link to `/evidence/:id`. A form "Upload evidence" (no real file; fields: title, type, description, location, linked persons).
4. **Timeline**: placeholder for now: `EmptyState` saying "Timeline is built in Step 07". Keep a clearly named component `CaseTimelineTab` for Step 07 to fill.
5. **Locations**: table of the case's locations with how each is connected (incident, evidence, visited by a person, sighting).
6. **Vehicles**: table of the case's vehicles (registration, make/model, colour, owner, linked people). A form "Link vehicle to person" (pick vehicle, pick person, relationship `owns` or `connected-to`).
7. **Connections**: placeholder for now (`CaseConnectionsTab`), filled in Step 06.
8. **Notes**: newest-first list (author, time, text) and an "Add note" box.
9. **Activity log**: the case's activity entries, newest first, showing time, officer and description (for example `10:23  Officer Mensah added Person A`). Step 09 polishes it.

## 4. Store actions (add to the store; every one calls `addActivity` and updates the case's `updatedAt`)
| Action | Activity description |
|---|---|
| `changeCasePriority(caseId, priority)` | `Case priority changed: MEDIUM → HIGH` |
| `changeCaseStatus(caseId, status)` | `Case status changed: OPEN → INVESTIGATING` |
| `addPersonToCase(caseId, personId)` | `Added <name> to the case` |
| `createPersonForCase(caseId, input)` | `Added <name> to the case` (create the person, next free `P-` id) |
| `linkVehicleToPerson(caseId, vehicleId, personId, relationship)` | `Vehicle <registration> linked to <name>` |
| `addEvidence(caseId, input)` | `Evidence <id> uploaded` (new evidence starts with one custody entry, action `collected`, by the current officer, status `collected`) |
| `addNote(caseId, text)` | `Note added` |

Each action must keep the data consistent: adding a person updates `relatedCases`; linking a vehicle adds an `InvestigationEdge` to `relationships`; evidence gets the next free `E-` id. Do not mutate state directly: create new arrays/objects (Zustand with immutable updates).
Forms validate required fields and show clear error text. After a successful action, show a short confirmation message.

## Done when
- [ ] `npm run build` passes.
- [ ] `/cases/CASE-00123` shows the header from section 2 and all 9 tabs; unknown ids show the empty state.
- [ ] Every action in section 4 works and its entry appears in that case's Activity log tab immediately.
- [ ] Changing priority from MEDIUM to HIGH logs exactly `Case priority changed: MEDIUM → HIGH` (try it on a medium-priority case).
- [ ] The Cases list, Dashboard and search show the changes (they read the same store).

## Plain-language explanation (copy into LEARNING_NOTES.md)
The case page is the **parent**; each tab is a smaller **child component** that receives only the data it needs (**component architecture**). **State management** means all pages read and change the same shared store, so an edit made here shows up on the Dashboard instantly. **Immutable updates** mean we never edit the old data; we make a new copy with the change, which is what lets React notice something changed. The **activity log** is an audit trail: every action leaves a record of who did what and when.

## What I should see
A full case page with working tabs, forms that change the data, and an Activity log that grows with each action.

## I should be able to explain
1. Why is the active tab stored in the URL?
2. What does "immutable update" mean, and why does React need it?
3. Which stored links change when you link a vehicle to a person?
