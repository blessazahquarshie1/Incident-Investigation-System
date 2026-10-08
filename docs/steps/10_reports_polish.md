# Step 10 — Reports, polish, and the final checklist

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
Finish the last page, polish the whole app, prove every item of the supervisor's spec is covered, and leave me a guide for the morning.

## 1. Reports page (`/reports`)
- A case picker (default `CASE-00123`) and a **Case report** preview built only from existing functions:
  1. **Header**: case id, title, priority, status, lead investigator, created and updated dates, description.
  2. **People**: grouped by type.
  3. **Evidence**: each item with its current custody status and holder.
  4. **Key timeline events**: the sorted events (all of them, compact list).
  5. **Timeline conflicts**: each conflict's explanation, or "None found".
  6. **Strongest connections**: top 5 pairs from the case's people, with score, level and breakdown lines.
  7. **Activity summary**: the 10 newest activity entries.
- A **Print / Save as PDF** button using `window.print()`, with a print stylesheet that hides the sidebar, top bar and the controls so only the report prints, on clean white paper with normal margins.
- Pure data logic goes in `src/lib/report.ts` (`buildCaseReport(data, caseId)` returns one object with all seven sections). The page only displays it.

## 2. Polish pass (do all of these)
- **Not found**: a friendly 404 page for unknown routes, and "not found" empty states for unknown ids on every detail page.
- **Error boundary** around the routes, so a crash shows a readable message with a "Reload" button, not a blank screen.
- **Empty and zero states** on every list, tab and panel (what is missing, what to do next).
- **Document titles**: each page sets `document.title` (for example `CASE-00123 · Incident Investigation System`).
- **Responsive check** at about 1280px, 1024px and 768px widths: no horizontal page scroll (tables scroll inside their own container), sidebar collapses to icons under 1024px.
- **Consistency check**: every status, priority and entity type is shown with the shared badges and fixed colours; type sizes follow the scale in the master file (nothing under 13px); buttons use the same wording everywhere ("Add person", "Save changes").
- **Clean up**: remove unused files, imports and console logs; no console errors in the browser when visiting every page; no `any`; no leftover "built in Step N" placeholders anywhere.
- Add a project `README.md` in the project root: what the app is, how to run it (`npm install`, `npm run dev`, `npm test`, `npm run build`), the folder structure, and a list of pages with one line each.

## 3. Spec coverage checklist
Create `docs/SPEC_CHECKLIST.md` listing every item below with `[x]` and the **file path or page** that covers it. Verify each one really works before ticking it. Anything that does not work stays `[ ]` and is also written in `PROGRESS.md` under Blockers.

- Models: `Case`, `Person`, `Evidence`, `InvestigationNode`, `InvestigationEdge` exactly as in the spec; plus Incident, Vehicle, Location, Officer, Document (`CaseDocument`), Note, witness statement, sighting, phone record, activity entry.
- Every entity can connect to another (foreign keys + `relationships` + `buildGraph`).
- Pages: Dashboard, Cases, Incidents, Persons, Evidence, Vehicles, Locations, Timeline, Relationship Graph, Investigators, Reports.
- Dashboard numbers (open cases, critical cases, persons of interest, evidence items, active investigations, unresolved incidents, and suspects).
- Case details page with all 9 tabs: Overview, People, Evidence, Timeline, Locations, Vehicles, Connections, Notes, Activity Log.
- Relationship graph with nodes, edges, relationship labels, drawn with React Flow.
- Connection strength algorithm with the weights 2/4/5/5/6 and the levels WEAK, MODERATE, STRONG, VERY STRONG; Person A and Person B scoring 13.
- `findConnections(personId)` with the spec's result shape.
- `findShortestConnection(startPersonId, targetPersonId)` with BFS.
- Automatic timeline from evidence, incidents, locations, witness statements, vehicle sightings and phone records, sorted by timestamp.
- Timeline conflict detection (person, location, time) with the warning text.
- Evidence chain of custody with history, plus blocked invalid actions (destroyed evidence cannot be transferred).
- Advanced search: person name, vehicle registration, phone number, case id, evidence id, location, incident.
- Activity log recording the major operations.

## 4. Demo script (`docs/DEMO_SCRIPT.md`)
A numbered click-by-click walkthrough, about 12 steps and 10 minutes long, that shows every spec feature in order, so I can present it to my supervisor and understand what each click demonstrates. For each step: what to click or type, what appears, and one sentence on which learning objective it shows. It should include at least: the dashboard numbers, searching `GT-4521-23`, opening `CASE-00123` and its tabs, the 13 / STRONG score, the BFS path, the Takoradi vs Accra conflict, the destroyed evidence being blocked, changing a priority and seeing the activity line, and the graph with the highlighted path.

## 5. Final verification
Run `npm run build`, `npm run lint` (if present) and `npm test`. All must pass. Then:
1. Finish `docs/LEARNING_NOTES.md` (all steps) and add a short table of contents at the top.
2. Finish `docs/PROGRESS.md`: the full status table, assumptions, blockers, and a final section **"First things to check in the morning"** (5 to 8 bullet points).
3. **Do not run any git command.** Leave all changes uncommitted.

## Done when
- [ ] Reports page works and prints cleanly.
- [ ] Build, lint and tests pass.
- [ ] `docs/SPEC_CHECKLIST.md`, `docs/DEMO_SCRIPT.md`, `docs/LEARNING_NOTES.md`, `docs/PROGRESS.md` and `README.md` all exist.

## Plain-language explanation (copy into LEARNING_NOTES.md)
A **report** is the same data as the rest of the app, assembled into one readable document, so the report page adds no new logic: it reuses the functions from earlier steps. **Polish** is the work that makes software feel finished: what happens when something is missing, wrong or empty. The **checklist** turns the supervisor's spec into a list we can tick off, so nothing is forgotten.

## What I should see
A printable case report, no broken pages, and a ticked spec checklist.

## I should be able to explain
1. Why does the Reports page need almost no new logic?
2. Name three things the polish pass handles that users only notice when they go wrong.
3. Walk through the demo script and say which learning objective each step shows.
