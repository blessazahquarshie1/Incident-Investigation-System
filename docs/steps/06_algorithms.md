# Step 06 — The algorithms: connection score, `findConnections`, `findShortestConnection` (BFS)

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
Write the core "intelligence" of the system as plain TypeScript functions (no libraries do the work), prove them with tests, and show the results in the UI.

Install `vitest` (dev dependency) and add the script `"test": "vitest run"` to `package.json`.

## 1. Connection score (`src/lib/connections.ts`)

```ts
export const SCORE_WEIGHTS = {
  location: 2, vehicle: 4, incident: 5, evidence: 5, phone: 6,
} as const;
```

**What counts as "shared" (write these rules in a comment at the top of the file):**
- **Location**: both people have a `visited` edge to the same location. (An incident's own location does **not** count.)
- **Vehicle**: both people have an `owns` or `connected-to` edge to the same vehicle (including `Vehicle.ownerId`).
- **Incident**: both people have an `involved-in` or `witnessed` edge to the same incident.
- **Evidence**: both people appear in the same `Evidence.linkedPersons`.
- **Phone number**: the two people's phone numbers overlap. A person's numbers = `Person.phone` plus every `phoneNumber` in phone records with that `personId`.

Functions:
- `getPersonFootprint(data, personId)`: returns the sets of location ids, vehicle ids, incident ids, evidence ids and phone numbers this person is linked to. Everything else is built from this: "**two people share something when their footprints overlap**".
- `calculateConnection(data, personAId, personBId): PairConnection` where
  ```ts
  interface PairConnection {
    personAId: string; personBId: string;
    sharedLocations: string[]; sharedVehicles: string[]; sharedIncidents: string[];
    sharedEvidence: string[]; sharedPhoneNumbers: string[];
    score: number; level: ConnectionLevel;
  }
  ```
  The score = Σ (number shared × weight). The order of the two people must not change the result.
- `classifyScore(score): ConnectionLevel`, with `type ConnectionLevel = "WEAK" | "MODERATE" | "STRONG" | "VERY STRONG"`: 0–4 WEAK, 5–9 MODERATE, 10–15 STRONG, 16 and above VERY STRONG.
- `describeScore(pair): string[]`: the human-readable lines such as `2 locations × 2 = 4`, `1 vehicle × 4 = 4`, `1 incident × 5 = 5`, only for kinds with at least one shared item.

**`findConnections(data, personId): ConnectionResult`** (the supervisor's function). The result has exactly the spec's shape, plus one extra field:
```ts
interface ConnectionResult {
  sharedPeople: string[];     // ids of people who share at least one thing with this person
  sharedVehicles: string[];   // vehicles this person shares with at least one other person
  sharedLocations: string[];
  sharedIncidents: string[];
  sharedEvidence: string[];
  connectionScore: number;    // the highest pair score among all connections
  connections: PairConnection[]; // extra: every pair with score > 0, strongest first
}
```
How it works: compare this person with every other person using `calculateConnection`, keep the pairs with a score above 0, and combine their shared items into the lists (no duplicates). Write the reason for "highest pair score" in a comment (adding scores of different pairs together would measure how popular someone is, not how strong a connection is).
If the person id does not exist, return the empty result (empty lists, score 0).

## 2. Shortest connection with BFS (`src/lib/pathfinding.ts`)

`findShortestConnection(data, startPersonId, targetPersonId): ConnectionPath | null`
```ts
interface ConnectionPath { nodes: InvestigationNode[]; edges: InvestigationEdge[]; length: number }
```
- Build the graph with `buildGraph`, then run **Breadth-First Search**: use a **queue**, a **visited** set and a **cameFrom** map (for each node, which node we reached it from). Take a node from the front of the queue, look at its neighbours (undirected), and put the unvisited ones at the back. When you reach the target, walk back through `cameFrom` to rebuild the path and reverse it.
- Because BFS explores all nodes 1 step away, then all nodes 2 steps away, and so on, the first time it reaches the target it has used the **fewest possible steps**. Put that explanation in a comment.
- `edges` has one edge per step, with its real relationship name.
- Edge cases: same person → a path with one node and length 0; unknown id → `null`; no route → `null`.
- Expected result from the mock data: `Person A → Vehicle 7 → Person C → Incident 4 → Person F` (`P-001 → V-007 → P-003 → I-004 → P-006`, length 4).

## 3. Tests (`src/lib/__tests__/`)
Use the mock data. All of these must pass:
- `P-001` vs `P-002`: 2 shared locations, 1 vehicle, 1 incident, 0 evidence, 0 phone; score **13**; level **STRONG**.
- `calculateConnection(a, b)` equals `calculateConnection(b, a)` (same score).
- `P-004` vs `P-005` includes a shared phone number and the +6.
- `classifyScore`: 0 and 4 → WEAK, 5 and 9 → MODERATE, 10 and 15 → STRONG, 16 and 40 → VERY STRONG.
- `findConnections("P-001")` lists `P-002` in `sharedPeople` and `V-001` in `sharedVehicles`, and `connectionScore` is at least 13; for an unknown id it returns the empty result.
- `findShortestConnection("P-001", "P-006")` returns exactly the node ids `["P-001","V-007","P-003","I-004","P-006"]`, length 4; same-person returns length 0; unknown id returns `null`.
- **If a test fails because the mock data does not match the stories in Step 02, fix the mock data, not the algorithm.**

## 4. Show it in the UI
- **Reusable components**: `ConnectionScoreCard` (the two names, the score as a large number, the level badge, and the `describeScore` lines) and `ConnectionPathView` (a horizontal chain of node chips with entity icons, with the relationship name on each arrow; wraps on small screens).
- **Case → Connections tab** (replace the Step 05 placeholder): (a) a table of every pair of the case's people with score above 0, strongest first, each row expandable to a `ConnectionScoreCard`; (b) a **"How are these two people connected?"** tool with two person pickers (all people) that shows a `ConnectionPathView`, or "No connection found between these two people".
- **Person detail page** (the slot reserved in Step 04): a "Connections" section that calls `findConnections` and lists connected people with score and level.

## Done when
- [ ] `npm run build` and `npm test` both pass.
- [ ] The Connections tab of `CASE-00123` shows `P-001` and `P-002` as **13, STRONG** with the three breakdown lines.
- [ ] The path tool returns the 5-node chain for `P-001` → `P-006`.

## Plain-language explanation (copy into LEARNING_NOTES.md)
A **footprint** is the list of things a person is linked to. Two people are **connected** when their footprints overlap; the **score** weights each kind of overlap by how meaningful it is (a shared phone number says more than a shared place). **BFS** is like dropping a stone in a pond: the ripple reaches everything one step away first, then two steps away, so the first time it touches the target is the shortest route. A **queue** is a line of people waiting: first in, first out.

## What I should see
Score 13 / STRONG for Person A and Person B, and the chain Person A → Vehicle 7 → Person C → Incident 4 → Person F. All tests green.

## I should be able to explain
1. Why does a shared phone number score higher than a shared location?
2. Why does BFS guarantee the shortest path?
3. Why is `connectionScore` the highest pair score and not the sum?
