# Step 04 — Lists, filters, the relationship layer, and advanced search

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
Build the list pages, the filtering, the **relationship layer** (turning all the links into one graph of nodes and edges), simple detail pages, and the advanced search.

## 1. The relationship layer (`src/lib/graph.ts`)
This is the foundation for scoring, BFS, and the graph page.

- `buildGraph(data): { nodes: InvestigationNode[]; edges: InvestigationEdge[] }`
  - **Nodes**: one for every person (`label` = full name), incident (title), vehicle (registration + make), evidence (id + title), and location (name). Officers, notes and documents are **not** nodes.
  - **Edges**: start with `data.relationships`, then add the edges implied by foreign keys: `Evidence.linkedPersons` (person → evidence, `connected-to`), `Evidence.locationId` (evidence → location, `connected-to`), `Incident.locationId` (incident → location, `connected-to`), `Vehicle.ownerId` (person → vehicle, `owns`). Skip duplicates. Skip any edge whose source or target does not exist.
- `getNodeType(id): EntityType` reads the id prefix (`P-` person, `I-` incident, `V-` vehicle, `E-` evidence, `L-` location).
- `getNeighbors(graph, nodeId)`: the ids directly connected to a node, in either direction. **Treat edges as undirected** here.
- Comment the file in plain English: "a graph is just a list of dots (nodes) and a list of lines (edges)".

## 2. Shared list components
- `DataTable`: typed columns, **click a column header to sort** (ascending/descending, with an arrow), row click handler, empty state when no rows, optional row count text ("Showing 8 of 12").
- `FilterBar`: a text box and select dropdowns, plus a "Clear filters" button.
- Filtering logic goes in `src/lib/filters.ts` as pure functions (`filterCases`, `filterPersons`, …) that take the list and a criteria object.
- **Filters live in the URL** (`useSearchParams`), so a link such as `/cases?status=open` opens the page already filtered. This makes the Dashboard cards work.

## 3. The list pages
| Page | Columns | Filters |
|---|---|---|
| Cases | id, title, type, priority, status, lead investigator, updated | text, type, priority, status, lead investigator |
| Incidents | id, title, type, location, occurred at, status, case | text, status, type, case |
| Persons | name, type, phone, aliases, number of cases | text (name, alias, phone), type |
| Evidence | id, title, type, case, collected at, collected by, status | text, type, status, case |
| Vehicles | registration, make and model, colour, owner | text (registration, make, model) |
| Locations | name, city, region, number of incidents | text, city |
| Investigators | name, rank, badge, department, cases led, evidence collected, activity count | text, rank |

Use `PriorityBadge`, `StatusBadge` and `EntityTypeBadge` in the tables. The **Cases page** also gets a "New case" button opening a `Modal` with a form (title, description, type, priority, lead investigator). Required fields are validated, with clear error text. Add the store action `createCase(input)`: it makes the next `CASE-xxxxx` id, status `open`, sets `createdAt`/`updatedAt`, and calls `addActivity` ("Case created"). The Reports page and others read from the same store, so the new case appears everywhere.

## 4. Detail pages for entities
Routes `/persons/:id`, `/incidents/:id`, `/vehicles/:id`, `/locations/:id`, `/evidence/:id`. Build **one generic `EntityDetailPage`** layout, driven by the graph:
- a header with the entity icon, name, type badge,
- a "Details" section with that entity's own fields,
- a "Linked to" section: for each of the five entity types, the connected entities from `getNeighbors`, each as a link to its own detail page, with the relationship name,
- the linked cases (derived, see search section).
Rows in every list link to these pages. `Evidence` and `Person` pages get extra sections later (custody in Step 09, connections in Step 06): leave a clearly named empty slot component for each.

## 5. Advanced search (`src/lib/search.ts`)
`searchAll(data, query): SearchResult[]`

- **Normalise** both the query and each searched value: lowercase, remove spaces and hyphens, so `GT-4521-23`, `gt 4521 23` and `gt452123` all match the same plate.
- **Searched fields**: person full name, aliases and phone; vehicle registration, make and model; case id and title; evidence id, title and description; location name and city; incident id and title; and phone numbers.
- **Ranking**: exact match 100, starts-with 60, a word inside the text starts with the query 40, contains 20. Sort by score, highest first. Ignore queries shorter than 2 characters.
- Each `SearchResult` has: `entityType`, `id`, `title`, `subtitle`, `score`, and an `enrichment` object that depends on the type:
  - **vehicle**: make and model, linked cases, linked persons, seen locations (from sightings and `visited`/graph neighbours);
  - **person**: type, related cases, linked vehicles, phone;
  - **evidence**: case, current custody status;
  - **case / incident / location**: a one-line summary and counts.
- **Linked cases** of any non-case entity = the cases of its connected persons (`relatedCases`) + the `caseId` of its connected incidents and evidence, without duplicates. Write this as a helper `getLinkedCaseIds(data, graph, nodeId)` in `src/lib/search.ts` or `graph.ts`.

**Example the supervisor wants to see:** searching `GT-4521-23` returns Vehicle: Toyota Hilux, linked cases (including `CASE-00022` and `CASE-00031`), linked persons (including Person A and Person D), and seen locations (Accra, Tema, Kasoa).

### Search UI
- The **top bar search box now works**: typing shows a dropdown of the top 6 results as you type (debounced 200ms); pressing Enter goes to `/search?q=…`.
- **Search page** (`/search`): the query box, filter chips to restrict the entity types, results grouped by type with the enrichment shown under each result, and an empty state when nothing matches ("No results for 'xyz'. Try a plate number, a name, a phone number or a case id."). Add `/search` as a route (not in the sidebar).

## Done when
- [ ] `npm run build` passes.
- [ ] All 7 list pages sort and filter, and filters survive a page refresh (they are in the URL).
- [ ] The Dashboard cards open pre-filtered lists.
- [ ] "New case" works and the case shows up in the list, with an activity entry.
- [ ] Searching `GT-4521-23`, `gt452123`, a phone number, a person's alias, and `CASE-00123` all return sensible results.
- [ ] Entity detail pages open from list rows and show "Linked to" sections.

## Plain-language explanation (copy into LEARNING_NOTES.md)
A **graph** is dots and lines: the dots are people, vehicles, incidents, evidence and places; the lines are the relationships. `buildGraph` gathers every link in the data into one place so any algorithm can walk it. **Filtering** means keeping only the rows that match the criteria. **Search** is similar, but it also ranks results so the best match comes first, and it **normalises** text (lowercase, no spaces) so small typing differences do not matter. Putting filters in the URL means a filtered view can be shared as a link.

## What I should see
Seven working list pages, a working search box, and detail pages that show everything linked to an entity.

## I should be able to explain
1. What are nodes and edges, and where does `buildGraph` get them from?
2. Why does searching `gt452123` still find `GT-4521-23`?
3. How does the app work out which cases a vehicle is linked to, when a vehicle has no `caseId`?
