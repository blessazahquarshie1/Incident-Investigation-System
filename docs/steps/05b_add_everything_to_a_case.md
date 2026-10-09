# Step 05b — Add everything to a case (all the forms)

> Read `00_MASTER_INSTRUCTIONS.md` first and obey it. **Do NOT run any git command.**
> Do only this step. Do not redo, restyle or rewrite other steps. Frontend and mock data only.

## Goal
Right now a new case can get people, evidence and notes, but not its own incidents, vehicles, locations, documents or timeline records. Add the missing forms so an investigator can build a whole case from nothing, and everything they add shows up automatically in the lists, search, graph, timeline, connection scores and activity log (those all read from the same store, so no extra wiring should be needed).

**No editing or deleting in this step.** Only adding. (Adding without deleting keeps the audit trail honest. Mention this in LEARNING_NOTES.)

## 1. Shared pieces to build first
- `FormField` (label, required marker, hint text, inline error text), used by every form.
- `EntityPicker`: a searchable dropdown for persons, locations, vehicles, incidents and officers, with an optional "Create new…" row at the bottom that opens the matching create form.
- Every form is a `Modal`: first field focused, Esc closes, submit button says what it does, inline error text under the wrong field, and a short confirmation message after success.
- Date and time fields: the app shows times in UTC (Ghana). Convert the input value as UTC (`new Date(value + ":00Z")`), never as the browser's local time. Reject times in the future.
- `src/lib/validation.ts` with pure functions and no UI: `normalisePlate(text)` (uppercase, remove spaces and hyphens), `isDuplicateVehicle(data, registration)`, `isDuplicateLocation(data, name, city)` (case-insensitive), and one `validateXInput` function per form that returns a map of field → error message.

## 2. The forms

| Where | Form | Fields | Result |
|---|---|---|---|
| Overview tab, Incidents section | **Add incident** | title, description, type (defaults to the case type), location (pick or create new), date and time it occurred, status (`unresolved` / `resolved`) | new `Incident` with the next `I-` id and this `caseId` |
| Overview tab, Documents section | **Add document** | title, kind (`report`, `warrant`, `statement`, `court-order`, `other`) | new `CaseDocument` (no real file), uploaded by the current officer, now |
| Overview tab, Management card | **Change lead investigator** | officer picker | `Case.leadInvestigator` changes |
| Locations tab | **Add location** | location (pick existing or create new: name, city, region), and **who visited it** (person of this case, required) | new `Location` if needed, plus a `visited` edge from that person |
| Vehicles tab | **Add new vehicle** | registration, make, model, colour, then **connect it to the case**: at least one person of this case (relationship `owns` or `connected-to`) and/or one incident of this case (`involved-in`) | new `Vehicle` with the next `V-` id, plus the edges. If a person is picked with `owns`, also set `Vehicle.ownerId` |
| Vehicles tab | **Link existing vehicle** (already exists from Step 05) | keep as is | keep as is |
| People tab (button on each person row) and Connections tab (general button) | **Add connection** | person, relationship, target. Allowed: `visited` → location, `involved-in` → incident, `witnessed` → incident, `owns` → vehicle, `connected-to` → vehicle | new `InvestigationEdge` in `relationships` |
| Evidence tab | **Upload evidence** (exists) | upgrade the location field to the same pick-or-create picker | as before |
| Timeline tab, "Add timeline record" menu | **Witness statement** | witness (person), about which person, location, **when the person was there** (`claimedTime`), when it was recorded, statement text | new `WitnessStatement` with the next `WS-` id |
| Timeline tab | **Sighting** | source (`cctv`, `patrol`, `anpr`, `informant`), action (`entered`, `left`, `seen`), location, time, vehicle and/or person (at least one), description | new `Sighting` with the next `SG-` id |
| Timeline tab | **Phone record** | person, phone number (defaults to that person's phone), kind (`call`, `sms`, `cell-tower`), time, tower location (required for `cell-tower`), other number (for `call` and `sms`) | new `PhoneRecord` with the next `PR-` id |

**Witnesses and suspects** are people with those `type` values. The existing "Add person" form already covers them. Make sure its type picker offers all four types.

### Rules the forms must enforce
- Required fields cannot be empty. Say which field and why.
- A vehicle registration that already exists (after `normalisePlate`) is rejected with: `A vehicle with this registration already exists. Use "Link existing vehicle" instead.`
- A location with the same name and city as an existing one is not created twice: tell the user and select the existing one.
- A vehicle must be connected to at least one person or incident of this case, otherwise it would not belong to the case. Say so.
- A `cell-tower` phone record needs a tower location. A `witnessed` or `involved-in` connection can only target an incident, a `visited` connection only a location, and `owns` or `connected-to` only a vehicle.
- A connection that already exists is not added twice.

## 3. Store actions
Add one action per form, each following the Step 05 pattern: immutable update, update the case's `updatedAt`, and call `addActivity`. Extend the `ActivityLogEntry["action"]` union with: `"incident-added" | "location-added" | "vehicle-added" | "document-added" | "link-added" | "lead-changed" | "timeline-record-added"`, and update the Activity tab's filter and icons for the new types.

| Action | Activity description |
|---|---|
| `addIncidentToCase` | `Incident I-024 added: <title>` |
| `addDocumentToCase` | `Document "<title>" added` |
| `changeLeadInvestigator` | `Lead investigator changed: <old name> → <new name>` |
| `createLocation` (when a new location is made) | `Location <name> added` |
| `addVisitedLocation` | `<person> linked to <location>: visited` |
| `createVehicle` | `Vehicle <registration> added` |
| `addConnection` | `<person> linked to <target>: <relationship>` |
| `addWitnessStatement` | `Witness statement WS-009 recorded` |
| `addSighting` | `Sighting SG-021 recorded` |
| `addPhoneRecord` | `Phone record PR-017 recorded` |

Use `nextId` from `src/lib/ids.ts` for every new id so ids never clash.

## 4. Tests
Add vitest tests for `validation.ts`: `normalisePlate("gt 4521-23")` equals `"GT452123"`; the duplicate vehicle check catches `GT-4521-23` written three different ways; the duplicate location check ignores case; each `validateXInput` returns an error for an empty required field and nothing for valid input.

## 5. Acceptance test (do this yourself and record the result in PROGRESS.md)
Create a brand new case, then add:
1. two people (any types);
2. one incident at a **new** location;
3. one new vehicle: one person `owns` it, the other is `connected-to` it, and it is `involved-in` the incident;
4. both people marked `involved-in` the incident and both `visited` the new location;
5. one evidence item linked to **both** people;
6. one document;
7. a witness statement saying person 1 was in Takoradi at 10:15, and a CCTV sighting of person 1 in Accra at 10:10 the same day.

Then check: the Locations, Vehicles and Evidence tabs show the new records; the Connections tab shows the two people with a score of **16, VERY STRONG** (2 for the shared location + 4 vehicle + 5 incident + 5 evidence); the Timeline tab shows the records and the **timeline conflict** banner; the Graph page shows the new nodes; searching the new plate finds the vehicle; the Activity tab lists every action in order. `npm run build` and `npm test` must pass.

## Plain-language explanation (copy into LEARNING_NOTES.md)
Adding information is the first half of an investigation tool: the second half is what the computer does with it. Every form here only **writes one small record** into the store, and every other page (lists, search, graph, scores, timeline) simply **re-reads the store**, so they all update at once without extra code. **Validation** means checking what the user typed before saving it, so bad data never gets in. We also only add and never delete, because an investigation record has to show everything that was ever done.

## What I should see
A new case that I can fill with incidents, vehicles, locations, documents and timeline records, and that immediately gets scores, graph nodes, timeline events and conflict warnings from what I typed.

## I should be able to explain
1. Why do the graph, search and scores update by themselves when I add a vehicle?
2. Why must a new vehicle be connected to a person or an incident of the case?
3. Why can a user add records but not delete them?
