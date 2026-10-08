# Demonstration Script: Incident Investigation & Intelligence System

**Estimated Duration:** ~10 minutes  
**Target Audience:** Investigative Lead / Technical Supervisor  
**Starting URL:** `http://localhost:5173/` (after running `npm run dev`)

This script provides a step-by-step walkthrough covering every key capability of the system in logical sequence.

---

### Step 1: High-Level Dashboard & Operational Metrics
- **What to do:** Open `http://localhost:5173/` in your browser.
- **What appears:** The primary executive dashboard showing 7 prominent StatCards (Open Cases: 4, Active Investigations: 5, Critical Cases: 4, Suspects: 11, Persons of Interest: 4, Evidence Items: 31, Unresolved Incidents: 7), two analytics charts (Cases by Status bar chart and Cases by Type pie chart), an "Urgent Cases" list, and the "Recent Activity" audit feed.
- **Learning Objective:** Demonstrates automated metric aggregation and real-time operational overview calculated cleanly from global application state.

---

### Step 2: Global Entity Search via Plate Number
- **What to do:** In the top navigation search box, type `GT-4521-23` and wait for the dropdown, then press Enter or click the result.
- **What appears:** The search dropdown instantly surfaces the vehicle "GT-4521-23 — Toyota Hilux" owned by Kwame Asante. Navigating to `/search?q=GT-4521-23` shows the enriched result card detailing the vehicle make, model, owner, linked cases (`CASE-00022`, `CASE-00031`, `CASE-00123`), and sighting locations (Accra, Tema, Kasoa).
- **Learning Objective:** Demonstrates normalized multi-entity search with contextual relationship enrichment across relational boundaries.

---

### Step 3: Vehicle Intelligence & Connected Entities
- **What to do:** Click on the registration `GT-4521-23` to open `/vehicles/V-001`.
- **What appears:** The Vehicle Detail view displaying physical specifications (Silver Toyota Hilux), registered owner Kwame Asante (with a direct profile link), and the "Linked to" graph showing connections to Kwame Asante (`owns`), Kofi Mensah (`connected-to`), and Ama Boateng.
- **Learning Objective:** Demonstrates bidirectional graph traversal from an entity node to its immediate relational network.

---

### Step 4: Investigating the Main Case (`CASE-00123`)
- **What to do:** Click "Cases" in the sidebar, then click `CASE-00123` ("Armed Robbery Investigation") to open `/cases/CASE-00123?tab=overview`.
- **What appears:** The 9-tab Case Detail workspace with the official header showing priority `[HIGH]`, status `[INVESTIGATING]`, and lead investigator `Officer Mensah (O-001)`. The Overview tab presents case metadata, associated incidents (`I-023`), and case documents.
- **Learning Objective:** Demonstrates scoping and filtering domain data specifically to an active case container.

---

### Step 5: Alibi & Presence Analysis in the Case Timeline
- **What to do:** Click the **Timeline** tab in `CASE-00123`.
- **What appears:** A chronological stream of events for the robbery on 14 September 2026, starting at 08:03 with vehicle `V-001` entering location, cell tower pings, CCTV detections, incident occurrence at 08:31, emergency calls at 08:45, and vehicle departure at 09:12. An amber warning banner alerts investigators to a timeline contradiction.
- **Learning Objective:** Demonstrates multi-source event normalization combining CCTV, ANPR, cell-tower telemetry, and police logs into a unified timeline.

---

### Step 6: Contradiction & Impossible Travel Detection
- **What to do:** Click "Timeline" in the sidebar (`/timeline`) to view the global timeline and expand the conflict details banner at the top.
- **What appears:** An alibi conflict is flagged: Witness statement `WS-001` claims suspect Kwame Asante (`P-001`) was in Takoradi (`L-005`) at 10:15 UTC, while CCTV footage verifies him in Accra (`L-001`) at 10:10 UTC. The conflict engine highlights that a 5-minute gap is physically impossible for the 270-minute journey between Accra and Takoradi.
- **Learning Objective:** Demonstrates algorithmic spatio-temporal conflict detection evaluating physical travel velocity constraints against witness claims.

---

### Step 7: Connection Strength Scoring (The 13 STRONG Association)
- **What to do:** Return to `CASE-00123` and click the **Connections** tab (`/cases/CASE-00123?tab=connections`).
- **What appears:** The connection pair card between suspects Kwame Asante (`P-001`) and Kofi Mensah (`P-002`) displays an associative score of **13** with a **STRONG** badge. The mathematical breakdown explains: 2 locations × 2 = 4 (Accra, Tema), 1 vehicle × 4 = 4 (`V-001`), and 1 incident × 5 = 5 (`I-023`).
- **Learning Objective:** Demonstrates multi-factor weighted connection scoring that quantifies associative affinity between crime figures.

---

### Step 8: Multi-hop Pathfinding via Breadth-First Search (BFS)
- **What to do:** On the same **Connections** tab, scroll down to "How are these two people connected?", select Person A as `Kwame Asante` (`P-001`) and Person B as `P-006` (`Kweku Appiah`), then click "Find connection".
- **What appears:** A 4-hop, 5-node visual chain displays: `Kwame Asante (P-001)` → `connected-to` → `V-007` → `owns` → `P-003` → `involved-in` → `I-004` → `involved-in` → `Kweku Appiah (P-006)`.
- **Learning Objective:** Demonstrates Breadth-First Search (BFS) algorithm discovering indirect chains of association between suspects who share no direct contact.

---

### Step 9: Interactive Relationship Graph & Path Highlighting
- **What to do:** Click "Relationship Graph" in the sidebar (`/graph`). In the "Compare two people" tool at the bottom, select `Kwame Asante` and `Kweku Appiah`, then click "Find connection".
- **What appears:** The React Flow canvas automatically brings the intermediate nodes into view and paints the entire 5-node path in bold blue with animated focus rings. Clicking any node (e.g. `V-007`) opens the side panel displaying its full connections.
- **Learning Objective:** Demonstrates interactive network visualization with deterministic d3-force layout and algorithmic visual synchronization.

---

### Step 10: Evidence Chain of Custody & Enforcing Legal Transitions
- **What to do:** Click "Evidence" in the sidebar (`/evidence`) and click `E-024` ("Encrypted Laptop").
- **What appears:** The Evidence Detail view shows the full custody audit trail: collected by O-001 (09:30), transferred to O-002 (10:45), submitted to evidence room (14:12), and analysis started by O-003 (16:00), deriving status `under-analysis`. The action buttons indicate valid next steps (Complete analysis).
- **Learning Objective:** Demonstrates finite state machine verification ensuring evidence handling strictly follows procedural rules.

---

### Step 11: Security & Tamper Proofing (Blocked Invalid Action)
- **What to do:** Click "Evidence" in the sidebar and navigate to `E-031` ("Destroyed SIM Card").
- **What appears:** The item has status `destroyed`. Every custody action button ("Transfer custody", "Submit to evidence room", "Start analysis", "Release") is disabled with a red warning banner explaining: *"Evidence has been destroyed. No further custody actions are permitted."*
- **Learning Objective:** Demonstrates defensive state integrity enforcement preventing post-destruction modification or fraudulent chain transitions.

---

### Step 12: Operational State Mutation & Administrative Audit Logging
- **What to do:** Return to `CASE-00123` Overview tab. Under "Change priority", select `CRITICAL` and click "Save changes". Then click the **Activity Log** tab (`?tab=activity`).
- **What appears:** A green confirmation banner "Priority updated." appears, the priority badge immediately updates to `[CRITICAL]`, and the Activity Log shows a newly minted audit entry: *"Case priority changed: HIGH → CRITICAL"* logged under officer `O-001`. Returning to the Dashboard shows the Critical Cases count incremented to 5.
- **Learning Objective:** Demonstrates immutable reactive state management with synchronous operational audit trails across the system.

---

### Bonus Step: Generating the Intelligence Dossier Report
- **What to do:** Click "Reports" in the sidebar (`/reports`). Ensure `CASE-00123` is selected.
- **What appears:** A consolidated 7-section intelligence report complete with CID masthead, executive metadata, subject classifications, evidence inventory, chronological event timeline, conflict audit, top network associations, and administrative audit entries. Clicking "Print / Save as PDF" opens the browser print dialog formatted with clean paper margins and hidden navigational chrome.
- **Learning Objective:** Demonstrates automated dossier compilation aggregating all investigative engines into an official printable intelligence artifact.

