# Step 15 — Everything updates live, and tells me what it connected

> Read `00_MASTER_INSTRUCTIONS.md` first and obey it. **Do NOT run any git command.**
> Frontend and mock data only. Do not redesign pages. Fix the logic and the specific items below.

## Goal
When I add something to a case (a person, a vehicle owner, an incident, a place, evidence…), **every page that shows it updates immediately, with no refresh**, and the app **tells me what new connections it found**, inside the case and in other cases.

Example I will test: I add a new person to a case, then add the connection "owns" to a vehicle that had no owner. The Vehicles page must show that person as the owner, the case's Connections tab must show how they connect to the others, and related cases must update if that vehicle appears in other cases.

## 1. One source of truth for links (the most likely cause of stale pages)
A fact must be stored **once**. Copies go out of date. Find every place where the same fact is stored twice, and make one the master and derive the other.
- **Vehicle owner**: the master is the `owns` relationship. Add `getVehicleOwner(data, vehicleId)` in `src/lib/` that reads it (falling back to `Vehicle.ownerId` only for old data). Every place that shows an owner (global Vehicles page, vehicle detail page, case Vehicles tab, search results, person detail "Vehicles") must call this function. When an `owns` connection is added, also keep `Vehicle.ownerId` in sync so nothing reads a stale value.
- **Owner conflict rule**: a vehicle has one owner. If I add `owns` to a vehicle that already has an owner, show a confirmation: "GT-1234-20 is already owned by X. Make Y the owner? X will become 'connected to' the vehicle." On confirm, change X's link to `connected-to`. Log it in the activity log.
- Check the other stored copies the same way: `Person.relatedCases` (must change whenever a person is added to or removed from a case), `Evidence.status` (always derived from the custody history), and `Case.updatedAt` (updated by every change).
- **Edit and Remove** (they now exist on the People tab): label "Remove" as **"Remove from case"**, ask for confirmation, and make it remove only this case's link (take the case out of `relatedCases` and drop the person from this case's evidence links and incident links). The person and their other cases stay. Log it. Everything below must also update after an edit or a removal.

## 2. Audit: every page must read from the store
- Search the whole `src/` folder: **no page or component may import mock data directly**. Only the store's starting state may import from `src/data/`. Fix every exception.
- No page may read the store with `getState()` while rendering; use selectors so the page re-renders on change.
- Check every `useMemo` and `useEffect` dependency list. A calculation that uses `data` must list `data` (or the exact slice it uses). Fix wrong lists.
- Pages to verify: Dashboard, Cases, Incidents, Persons, Evidence, Vehicles, Locations, Investigators, Search, Timeline, Graph and Case map, Reports, every case tab, every detail page.

## 3. "New connections found" message after every change
- `src/lib/connectionDiff.ts`:
  - `getConnectionSnapshot(data, caseId)` returns two maps: the people pairs inside the case (score and level, from `calculateConnection`) and the related cases (score and level, from `findRelatedCases`).
  - `diffSnapshots(before, after)` returns a list of plain changes: a **new** pair or related case, or a **higher** score or level.
- Wrap every store action that can change links (add person, add connection, link or create vehicle, add incident, add evidence, add visited location, add witness statement, sighting, phone record, edit, remove from case) so it takes a snapshot before, runs the change, takes a snapshot after, and returns the diff.
- After the change, show a **message** (toast, stays about 8 seconds, with a close button) in plain words:
  - `Saved. New connections found:` then up to 3 lines such as `Samuel Dontoro and Kwame Asante now share a vehicle (score 4, MODERATE)` and `This case is now linked to CASE-00201 (STRONG)`, and a **See connections** button that opens the case's Connections tab.
  - If nothing new: `Saved. No new connections found.`
- Show the case's score level changes using the same words as everywhere else (WEAK, MODERATE, STRONG, VERY STRONG).

## 4. Connections tab order
Related cases section first (strongest first), then "People in this case". It must also update live.

## 5. Keep my test data when I refresh
Right now a refresh wipes everything I add. Until the real database exists:
- Save the store's `data` in the browser (`localStorage`, using Zustand's `persist`), under a key that includes a **version number**. Increase the version whenever the mock data or the types change, so old saved data is never loaded into a new structure.
- Add a small **"Reset demo data"** link in the sidebar footer. It asks for confirmation, then restores the original mock data.

## 6. Cases list order and a typo
- Default order of the Cases list: status **investigating, open, closed, pending**; inside each status, priority critical → low; then newest `updatedAt` first. Clicking a column header still sorts by that column. (The placeholder cases `CASE-00001` to `CASE-00009` are pending and will sink to the bottom. They will be removed in the cleanup.)
- On the People tab the group heading says "Witnesss". Use a fixed plural map: `Suspects`, `Witnesses`, `Victims`, `Persons of interest`, and the empty text "No witnesses recorded." Check the same pluralising everywhere else.

## 7. Tests (vitest, using the real store with its state reset before each test)
- `getVehicleOwner` returns the person after an `owns` connection is added to an ownerless vehicle; adding a second `owns` with confirmation moves the old owner to `connected-to`.
- Create a new case, add a person, link an existing vehicle (for example `GT-4521-23`): `findRelatedCases` for the new case now includes `CASE-00123`; the diff reports it as a new related case.
- Adding a person with the surname "Asante" to a new case produces a `surname-only` name match against the Asante records.
- Removing a person from a case removes the case from `relatedCases` and keeps the person's other cases.
- `diffSnapshots` reports new pairs and higher scores correctly, and nothing when nothing changed.
- Every case in the Cases list ordering test: no `pending` case appears above a `closed` one.

## 8. Acceptance test (do it yourself and record the result in `docs/PROGRESS.md`)
1. **Owner:** on the Vehicles page find a vehicle with no owner. In `CASE-00123` → People add a new person "Test Owner", then Add connection → `owns` → that vehicle. Without refreshing: the Vehicles page shows Test Owner as owner, the case Vehicles tab shows the owner, the person's page lists the vehicle, the message appears, and the Connections tab shows the new person's links.
2. **New case:** create a new case, add a person "Test Asante", link the existing vehicle `GT-4521-23` to that person, add an incident at Accra Mall. Open the new case's Connections tab: related cases include `CASE-00123` (shared vehicle, same place, similar name) with the right reasons.
3. **Refresh the page:** everything I added is still there. "Reset demo data" brings back the original data.
4. `npm run build` and `npm test` pass.
Update `docs/LEARNING_NOTES.md` ("Step 15") and `docs/PROGRESS.md`.

## Plain-language explanation (copy into LEARNING_NOTES.md)
Pages update by themselves when they all read the **same store** and only **calculate** their answers from it. The danger is a fact that is saved in two places: when only one place is updated, the other shows old information. So each fact has **one master copy** (the owner is the "owns" link), and everything else works it out from that. The **before and after snapshot** trick is how the app can tell you what changed: it measures the connections, makes the change, measures again, and reports the difference.

## What I should see
Add something, and instantly see it in every place it belongs, with a message saying which new connections it created.

## I should be able to explain
1. Why must the vehicle's owner come from one master place?
2. How does the app know which connections are new after I add something?
3. Why must pages never import the mock data directly?
