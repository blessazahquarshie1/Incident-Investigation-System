# Step 07 — Investigation timeline and conflict detection

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
Collect events from six different kinds of records into one automatic, sorted timeline, and flag information that contradicts itself.

## 1. Building the timeline (`src/lib/timeline.ts`)

```ts
export type TimelineSource =
  | "evidence" | "incident" | "location" | "witness-statement" | "vehicle-sighting" | "phone-record";

export interface TimelineEvent {
  id: string;               // e.g. "evt-WS-001"
  timestamp: string;        // ISO
  source: TimelineSource;
  title: string;            // short, e.g. "Vehicle entered location"
  description: string;
  caseId: string;
  locationId?: string;
  personIds: string[];
  vehicleId?: string;
  sourceRecordId: string;   // id of the record the event came from
}
```

`buildTimeline(data, caseId?)` collects events from these records (only the given case if `caseId` is passed):

| Record | Event | `source` | Title examples |
|---|---|---|---|
| `Evidence` | `collectedAt` | `evidence` | "Evidence collected: Laptop" |
| `Incident` | `occurredAt` | `incident` | "Incident occurred: <title>" |
| `Sighting` with `vehicleId` | `timestamp` | `vehicle-sighting` | "Vehicle entered location", "Vehicle left location", "Vehicle seen" (from `action`) |
| `Sighting` with `personId` and no vehicle (CCTV, patrol…) | `timestamp` | `location` | "Suspect detected on CCTV" (use the person's type and the sighting `source`) |
| `WitnessStatement` | `recordedAt` | `witness-statement` | "Witness statement recorded" (description includes the claim) |
| `PhoneRecord` | `timestamp` | `phone-record` | "Phone connected to cell tower", "Emergency call made", "Call made", "SMS sent" |

Then **sort by timestamp** with exactly the snippet from the spec (and a stable tie-break on `id` so equal times always come out in the same order):

```ts
events.sort(
  (a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
);
```
Write a comment explaining why we convert to numbers with `getTime()` before comparing.

**Expected result for `CASE-00123`** (these must appear in this relative order): 08:03 vehicle entered location · 08:14 phone connected to cell tower · 08:20 suspect detected on CCTV · 08:31 incident occurred · 08:45 emergency call · 09:12 vehicle left location.

## 2. Conflict detection (`src/lib/conflicts.ts`)

A **presence claim** says "person X was at location Y at time T, according to source Z":
```ts
interface PresenceClaim {
  personId: string; locationId: string; timestamp: string;
  sourceType: "witness-statement" | "sighting" | "phone-record";
  sourceId: string; description: string;
}
```
Build claims from: witness statements (`subjectPersonId`, `locationId`, **`claimedTime`**, not `recordedAt`), sightings that have a `personId`, and `cell-tower` phone records that have a `locationId` (the person's phone was at that tower).

`detectTimelineConflicts(data, caseId?): TimelineConflict[]`
1. Build all claims.
2. **Group by person.**
3. For each person, compare every pair of claims. A pair is a **conflict** when the two claims are at **different locations** and the time between them is **less than the travel time** between those two locations (`getTravelMinutes` from Step 02, using the locations' cities). If you can't physically get from A to B in the time between the claims, both can't be true.
4. Return `{ id, personId, claimA, claimB, gapMinutes, requiredMinutes, explanation }`, where `explanation` is a plain sentence such as "Witness statement places Kwame Asante in Takoradi at 10:15, but CCTV detected him in Accra at 10:10. Travel between them takes about 270 minutes; the gap is 5 minutes."
5. Same location, or enough time to travel → no conflict. Equal timestamps at different places → conflict.
Comment each of the 5 steps in plain English, and note that comparing every pair is fine here because each person has only a handful of claims.

## 3. Tests (`src/lib/__tests__/`)
- The `CASE-00123` events from section 1 appear in the expected relative order, and all six `source` kinds appear in the full timeline of the dataset.
- The timeline is sorted ascending for any input.
- The Takoradi 10:15 vs Accra 10:10 pair for `P-001` **is** flagged, with `gapMinutes` 5.
- The Accra 10:10 vs Tema 12:00 pair is **not** flagged.
- Same-location claims never conflict.

## 4. UI
- **`TimelineView` component** (props: `caseId?`) used in two places: the **Timeline page** and the **Case → Timeline tab** (replace the Step 05 placeholder, passing the case id).
- **Layout**: a vertical timeline grouped by date. Each event has the time, a source icon and colour, the title, the description, person chips and a location chip (chips link to detail pages).
- **Controls** (Timeline page only): a case picker (default `CASE-00123`, plus "All cases") and filter chips for the six sources.
- **Conflicts**: at the top, a clearly visible banner `⚠ POSSIBLE TIMELINE CONFLICT` with the count, followed by a card per conflict showing the person, the two claims side by side, the gap versus the required travel time, and the explanation. Events involved in a conflict also show a small warning marker inside the timeline itself. When there are no conflicts, show a calm "No timeline conflicts found" line.
- Dates and times are always shown in UTC (Ghana time).

## Done when
- [ ] `npm run build` and `npm test` pass.
- [ ] The Timeline page for `CASE-00123` shows the six robbery events in order, plus the evidence events, and the Takoradi/Accra conflict banner.
- [ ] The Case → Timeline tab shows the same timeline for that case.

## Plain-language explanation (copy into LEARNING_NOTES.md)
Each kind of record (a phone log, a CCTV sighting, a witness statement) has its own shape. The timeline **converts** each into one common `TimelineEvent` shape, so they can be put in one list and sorted. This is a pattern called **normalising**. Conflict detection asks one question: "could this person really have been in both places?" It uses travel time to decide, which is why 5 minutes between Accra and Takoradi is impossible but 110 minutes between Accra and Tema is fine.

## What I should see
A vertical timeline with different coloured event types, and a warning banner explaining the Takoradi vs Accra contradiction.

## I should be able to explain
1. Why do we convert different records into one `TimelineEvent` shape before sorting?
2. Which time does a witness statement use for the conflict check, and why not the time it was recorded?
3. Why is "different place + short time" a conflict but "different place + long time" is not?
