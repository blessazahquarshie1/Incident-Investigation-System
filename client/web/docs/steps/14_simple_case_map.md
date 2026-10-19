# Step 14 — A simple Case map (make the graph page readable)

> Read `00_MASTER_INSTRUCTIONS.md` first and obey it. **Do NOT run any git command.**
> Frontend and mock data only. Do not change the comparison engine from Step 12 except to add the small helper below.

## Problem
The graph page is too complicated. It shows every person, vehicle, incident, evidence item and place at once, in tiny boxes squeezed into a small cluster, with overlapping labels, and **it never shows how cases connect to each other**, which is the main purpose of the system.

## Goal
The first thing the graph page shows is a **Case map**: cases as circles, and a line between two cases when they share something. A beginner should understand it in 5 seconds.

## 1. First, check what exists
Look at the current graph page and at Step 13. Write in `docs/PROGRESS.md` which of these exist: the "Related cases" list on a case's Connections tab, the Compare page (`/cases/:caseId/compare/:otherCaseId`), the Cases mode of the graph, the name search results. **If the Related cases list or the Compare page is missing or broken, build them as described in `13_related_cases_screens.md` sections 1 and 2.** Replace any existing Cases mode of the graph with the Case map below.

## 2. The Case map (new default view of `/graph`)
Page title: **Case map**. One line under it: "Each circle is a case. A line means two cases share something. A thicker line means a stronger link."

**Two small controls above the map:**
- A switch: **Focus on one case** (default) / **All cases**.
- A case picker (default `CASE-00123`, only shown in focus mode) and a checkbox **Show weak links** (off by default, so only links with score 4 or more appear).

**Focus on one case:** the chosen case is a larger circle in the **centre**. Every related case (from `findRelatedCases`) is placed **around it in a circle**, evenly spaced, strongest first. Positions are plain maths, not a physics simulation, so the map is always neat and never overlaps.

**All cases:** every case is placed evenly around one big circle. Draw a line for every link from `findAllCaseLinks` (score 4 or more unless "Show weak links" is on). Clicking a case highlights its lines and dims the rest.

**Case circle** (a React Flow custom node, not draggable): the case id in bold (16px), the title shortened to one line (14px), a **Current** or **Past** badge, and the status. **Blue border = current case, grey border = past (closed) case.** The centre case has a thicker border.

**Link line** (a custom edge):
- **Thickness by level**: WEAK 1px, MODERATE 2px, STRONG 4px, VERY STRONG 6px.
- **Colour by level**: grey, blue, orange, red.
- **A short label in the middle** saying why, in plain words, using up to 3 of these, in this order, then "+2 more" if there are more: `same person`, `same car`, `same phone`, `same method`, `same place`, `similar name`, `similar time`. Example: `same car · same person · same method`.
- Add the helper `describeSharedShort(comparison): string[]` in `src/lib/caseComparison.ts` that returns these phrases, with a test.

**Click a line or a case circle** → a panel opens on the right (below the map on small screens):
1. `CASE-00123 ↔ CASE-00201` and the level badge with the score.
2. **What they share**: plain lines with real names, for example `Same car: GT-4521-23 Toyota Hilux`, `Same person: Kofi Boateng`, `Same method: grey-balaclava`.
3. **Where to look**: the first 3 leads from the comparison.
4. A **Compare** button that opens the Compare page.
(In "All cases" mode, clicking a case with no link selected shows that case's title and its linked cases as a short list.)

**Legend**: one single line under the map: "Blue = current case · Grey = past case · Thicker line = stronger link". Nothing else.

**Empty state**: "This case is not linked to any other case yet. That does not prove it has no links, only that no shared details are recorded."

Use `fitView` so the map fills the canvas on load and when the case changes. Text is never smaller than 13px.

## 3. Logic and tests (`src/lib/caseMap.ts`)
Pure functions with plain-English comments:
- `buildCaseMap(data, { focusCaseId?, minScore })` returns `{ nodes, edges }` where nodes carry the case id, status and `isPast`, and edges carry the comparison summary.
- `layoutCaseMap(nodes, mode)` returns positions: radial around the centre for focus mode, one circle for all-cases mode.
Tests: focus on `CASE-00123` with `minScore: 4` gives the centre node plus an edge to each of `CASE-00201`, `CASE-00203`, `CASE-00204` and **no** edge to `CASE-00202`; with `minScore: 0` it also has `CASE-00202`; all-cases mode has exactly one edge per pair from `findAllCaseLinks`, with no duplicates and no self-links; no two nodes share a position.

## 4. Keep the detailed graph, but make it readable
The old entity graph stays, because the supervisor's spec asks for it, but it moves behind a second switch at the top of the page: **Case map** (default) / **Detailed graph**. In the detailed graph:
- **Remove the "All Cases (Entire Network)" option.** It is an unreadable hairball. The case picker only lists single cases.
- Call `fitView` so the graph fills the canvas, and increase the spacing between nodes so no two boxes overlap (stronger repulsion and a larger collision radius in the layout function).
- Show **edge labels only for the selected node's connections**, not on every line.
- Hide nodes that have no connection in the current view.
- Make the legend a small collapsed "Legend" button that opens a panel, so it never covers nodes.
- Node text at least 13px.

## 5. Link from the case page
On a case's Connections tab, next to the "Related cases" heading, add a link **See on map** that opens `/graph?case=<caseId>` in focus mode with that case in the centre.

## Done when
- [ ] `npm run build` and `npm test` pass.
- [ ] `/graph` opens on the Case map with `CASE-00123` in the centre and its related cases around it, with labelled lines of different thickness.
- [ ] Clicking the line to `CASE-00201` shows the Hilux, Kofi Boateng and the method in plain words, plus leads, and Compare opens.
- [ ] "Show weak links" adds `CASE-00202`. All cases mode shows every case in one circle.
- [ ] The Detailed graph still works, no longer has "All Cases", and nothing overlaps.
- [ ] `docs/PROGRESS.md`, `docs/LEARNING_NOTES.md` (add a "Step 14" section) and `docs/DEMO_SCRIPT.md` updated.

## Plain-language explanation (copy into LEARNING_NOTES.md)
A graph is easy to read only when it shows **one kind of thing**. The old graph mixed five kinds, so nothing stood out. The Case map shows only cases, and uses **thickness** (how strong), **colour** (current or past) and a **short label** (why) to answer the three questions an investigator has: *which cases are linked, how strongly, and because of what.* The positions come from simple maths (an even circle), so the picture is the same every time and never overlaps. The detailed graph is the "zoom in" view for when you want to see the people and cars behind the link.

## What I should see
A neat picture with the Accra Mall robbery in the middle and the other cases around it, joined by lines that say "same car · same person", and a panel that explains the link in plain words.

## I should be able to explain
1. Why does the Case map only show cases and not people, cars and evidence?
2. What do the thickness, colour and label of a line tell you?
3. Why is the layout a simple circle instead of a physics simulation?
