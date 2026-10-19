# Step 03 — Dashboard

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
Replace the Dashboard placeholder with a real dashboard whose numbers are **calculated from the data**, not typed in.

## 1. The numbers (`src/lib/dashboard.ts`)
Write one pure function `getDashboardStats(data: InvestigationData)` returning:

| Card title | How it is calculated |
|---|---|
| Open cases | cases with status `open` |
| Active investigations | cases with status `investigating` |
| Critical cases | cases with priority `critical` that are **not** `closed` |
| Suspects | persons with type `suspect` |
| Persons of interest | persons with type `person-of-interest` |
| Evidence items | all evidence items |
| Unresolved incidents | incidents with status `unresolved` |

The supervisor's example shows figures like 24 / 4 / 37 / 18 / 264 / 19. Ours will be smaller because the mock data is smaller. That is fine.

Also return the data for two charts and two lists:
- `casesByStatus`: count per status. `casesByType`: count per type.
- `priorityCases`: open, non-closed cases with priority `critical` or `high`, newest `updatedAt` first, max 6.
- `recentActivity`: the 8 newest `ActivityLogEntry` records.

## 2. The page (`src/pages/DashboardPage.tsx`)
- Header: "Dashboard", with a description.
- **Stat cards** using the shared `StatCard`: big number, clear label, and a small hint line. Each card is a link to the matching list page with a filter in the URL: for example Open cases → `/cases?status=open`, Critical cases → `/cases?priority=critical`, Suspects → `/persons?type=suspect`, Unresolved incidents → `/incidents?status=unresolved`. (The pages read those filters in Step 04. Until then the links simply open the page.)
- **Two charts with Recharts**: "Cases by status" (bar chart) and "Cases by type" (donut chart). Use the semantic status colours from the master file and a text legend. Charts must resize with the window and have readable axis text (13px minimum).
- **Priority cases** list: case id, title, priority badge, lead investigator name. Each row links to `/cases/:id` (that page is built in Step 05).
- **Recent activity** list: time, officer name, description.
- The stat cards are the only large numbers on the page. Do not decorate the page further.

## 3. State management lesson
The page gets its data from the store with a Zustand selector (`useInvestigationStore((s) => s.data)`) and passes it to `getDashboardStats`. Use `useMemo` so the stats are only recalculated when the data changes.

## Done when
- [ ] `npm run build` passes.
- [ ] 7 stat cards, 2 charts, 2 lists render with data from the mock store.
- [ ] Changing a case's status in `src/data` and refreshing changes the cards (try it once, then undo).
- [ ] The temporary record-count table from Step 02 is removed.

## Plain-language explanation (copy into LEARNING_NOTES.md)
The dashboard does not store any numbers. It **counts** the real data every time. That is the difference between a *derived value* and a *stored value*: derived values can never go out of date. A **selector** is how a component asks the store for just the piece of data it needs. `useMemo` remembers a calculation so it is not repeated on every redraw. Charts are **data visualisation**: the same counts, shown as shapes so patterns are easier to see.

## What I should see
Seven number cards, a bar chart and a donut chart, a short list of urgent cases and a feed of recent activity. Clicking a case row goes to a page that does not exist yet (Step 05).

## I should be able to explain
1. Why is "Critical cases" calculated instead of stored as a number?
2. What does a Zustand selector do?
3. Why are `getDashboardStats` and the page two separate things?
