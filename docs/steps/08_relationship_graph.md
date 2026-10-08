# Step 08 — Relationship graph

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
Draw the investigation as a graph using React Flow. This is the most visual page of the app, so make it the memorable one, and keep every other page quiet. The relationship calculations (`buildGraph`, scores, BFS) are the ones already written in Steps 04 and 06. React Flow only **draws**.

Install `d3-force` and `@types/d3-force`. Import React Flow as `@xyflow/react` and its stylesheet `@xyflow/react/dist/style.css`.

## 1. Automatic layout (`src/lib/graphLayout.ts`)
`computeLayout(nodes, edges): Record<string, {x: number; y: number}>`
- Use a d3-force simulation: `forceLink` (connected nodes pull together), `forceManyBody` (all nodes push apart), `forceCenter`, and `forceCollide` (nodes never overlap).
- Run the simulation **synchronously for about 300 ticks**, then read the final positions. Do not animate it live.
- Comment the idea in plain English: "nodes repel like magnets, edges act like springs, and the picture settles where the forces balance".
- It must return stable positions for the same input, so the graph does not jump around when nothing changed (seed the starting positions from the node index, not from random numbers).

## 2. The page (`/graph`)
**Which part of the graph is shown.** The full network is too busy to read. So:
- A **case picker** (default `CASE-00123`, plus "All cases"). For one case, show the case's people, incidents, evidence, vehicles and locations (use the helpers from `caseScope.ts`) and the edges between them.
- **Link expansion**: clicking a node opens its side panel (below) with an "Expand connections" button that adds that node's neighbours (from `getNeighbors`) to the picture, then re-runs the layout. A "Reset view" button returns to the case view.
- **Node-type toggles**: five toggle buttons (person, incident, vehicle, evidence, location) that show or hide nodes of that type.
- **Find on graph**: a small search box that lists matching nodes by label; choosing one centres the view on it and selects it.

**Drawing:**
- **Custom node component per entity type** using the fixed colour and icon from `entityStyle.ts`, with the label under or beside the icon. The label must be readable at 13px or larger. Person nodes use the person type (suspect, witness…) as a small caption.
- **Edges** show the relationship name as a label (`owns`, `visited`, `witnessed`, `involved-in`, `connected-to`). Use a distinct line style per relationship (solid, dashed, dotted) so colour is not the only signal.
- A **legend** explaining node colours/icons and line styles, React Flow's `MiniMap` and `Controls`, and a plain `Background`.
- Hovering or selecting a node highlights it and its direct neighbours and dims everything else.

**Side panel** (right side on desktop, below the graph on small screens). For the selected node: its type icon and label, key details (a person's type and phone; a vehicle's make, model and colour; an incident's time and status; and so on), the list of directly connected nodes (clicking one selects it), and a link to its detail page.

**Analysis tool** (a second panel, above or beside the legend): "Compare two people".
1. Two person pickers.
2. Runs `findShortestConnection` and **highlights the path on the graph** (path nodes and edges in the accent colour, everything else dimmed, the path nodes added to the view if they were hidden), and shows a `ConnectionPathView` below.
3. Also runs `calculateConnection` and shows a `ConnectionScoreCard`.
4. If there is no connection, say so clearly. "Clear" removes the highlight.

## 3. Quality
- Use `useMemo` for the graph build and the layout so they only run when their inputs change.
- Empty state when the chosen case has no linkable data.
- The page works with the keyboard for the toolbar and panel buttons.
- Keep the top toolbar to one tidy row that wraps on narrow screens.

## Done when
- [ ] `npm run build` passes.
- [ ] `/graph` opens on `CASE-00123` and shows a readable, non-overlapping network with labelled edges.
- [ ] Choosing Person A and Person F (`P-001`, `P-006`) highlights the 5-node path and shows the path chain.
- [ ] Choosing Person A and Person B shows score 13 STRONG.
- [ ] Node-type toggles, "Expand connections", "Find on graph" and "Reset view" work.

## Plain-language explanation (copy into LEARNING_NOTES.md)
Everything on the graph comes from data, not from drawing by hand: `buildGraph` makes the dots and lines, the **layout** step decides where each dot goes, and **React Flow** only paints them. The layout works like physics: dots push each other away and lines pull their ends together, and the picture settles where those forces balance. **Link expansion** lets an investigator start small and follow a lead outwards instead of staring at everything at once. Highlighting a path on the graph is the BFS result from Step 06 made visible.

## What I should see
A coloured network of people, vehicles, incidents, evidence and places for the robbery case. Clicking a node shows its details. Comparing two people draws their path on the graph.

## I should be able to explain
1. Which parts of this page are my own logic and which part is React Flow's job?
2. What does the force layout do, and why is it computed once instead of animated?
3. Why do we show a single case first instead of the whole network?
