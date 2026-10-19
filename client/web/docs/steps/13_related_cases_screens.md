# Step 13 — The screens for related cases and name search

> Read `00_MASTER_INSTRUCTIONS.md` first and obey it. **Do NOT run any git command.**
> Uses the functions from Step 12. Do not rewrite them. If one is missing something, extend it and add a test.

## Goal
Show investigators, in the simplest way, **which other cases a case is linked to and where to look**, and let them search any name and see every case it appears in.

## 1. Case page → Connections tab
Keep the existing people connections, but organise the tab into two clear sections with headings: **"Related cases"** (first, at the top) and **"People in this case"** (the existing Step 06 content).

**Related cases section** (`findRelatedCases`): a list, strongest first. Each row shows:
- the other case's id and title, linking to it,
- a **Current** or **Past** badge (past = status `closed`),
- the score and level badge (`WEAK`, `MODERATE`, `STRONG`, `VERY STRONG`),
- small chips for what is shared, with icons: `1 person`, `1 vehicle`, `1 phone number`, `1 evidence tag`, `1 place`, `possible name match`,
- a **Compare** button.
A filter: "All / Current only / Past only". Empty state: "No related cases found yet. This is not proof that none exist, only that no shared details are recorded."

## 2. Compare page (`/cases/:caseId/compare/:otherCaseId`)
Top to bottom, in this order:
1. **Header**: both cases side by side (id, title, status, current/past badge) with the big score and level badge in the middle, and the breakdown lines (`1 vehicle × 5 = 5`…).
2. **Where to look**: the `leads`, high priority first, each with a small priority label and links to the people, vehicles, or places it mentions. This is the most important block, so make it the most prominent.
3. **What they share**: grouped lists for people, vehicles, places, phone numbers and evidence tags, each item linking to its detail page.
4. **Possible same person (names)**: each name match shows both records side by side with the label `Exact name`, `Shared alias` or `Surname only`, and this sentence in plain view: "These are different records. Check whether they are the same person." Use calm wording, no red alarm styling.
5. **Timelines side by side**: two columns, one per case, each using `buildTimeline` for that case. Events at a **shared place** are highlighted in both columns. Dates and times in UTC.
Unknown case ids show a "Case not found" state. Comparing a case with itself redirects back.

## 3. Case network on the Relationship Graph page
Add a two-option toggle at the top of the graph page: **Entities** (the existing graph, unchanged) and **Cases**.
- **Cases mode**: each case is a node (use the case icon, id as the label), coloured **blue for current** and **grey for past**. Edges come from `findAllCaseLinks`. The edge label is the score; line thickness grows with the level. A checkbox "Show weak links" (off by default, so only score 4 and above are shown).
- Clicking an edge or a node shows a small panel with the score, level, shared summary and a **Compare** button. Selecting a case highlights its links and dims the rest.
- Reuse the Step 08 layout function and legend. The legend must explain current and past, and the line thickness.

## 4. Name search (replace the person part of the Step 04 search)
The top-bar search and the Search page use `searchByName` for anything that looks like a name, alongside the existing plate, phone, id and place search.
- **"People matching '<query>'"** section: each person as a card with name, type, the label for how it matched (`full name`, `first name`, `surname`, `alias`, `similar spelling`), and a list of **all the cases they appear in**, each with a Current or Past badge and a link.
- **"Cases where this name appears"** section: each case once, listing the people who matched and any text **mentions** with a short snippet (for example from a note or a witness statement).
- A one-line explanation under the section title: "Matches any first name, surname or alias. Similar spellings are included and labelled."
- Empty state: "No one matches '<query>'. Try just the surname or a different spelling."

**Person detail page** gets two new sections: **"Appears in cases"** (all of their cases with badges) and **"Possible same person in other records"** (people in other cases with a name match, using the same labels and the same careful wording as the Compare page).

## 5. Dashboard
Add one list: **"Strongest case links"**: the top 5 from `findAllCaseLinks` (case A, case B, level badge, score, Current/Past badges), each row linking to its Compare page. Keep the existing cards and charts.

## 6. Live updates
Everything above is calculated from the store, so a case the user creates in the app, and the incidents, vehicles, people, phone records and evidence they add in Step 05b, must change the related-cases results immediately. Verify it (see the acceptance test).

## 7. Acceptance test (do it yourself and record the result in `docs/PROGRESS.md`)
1. Open `CASE-00123` → Connections. You see the four new cases: `CASE-00201` (Past, STRONG or higher, shares a vehicle, a person and an evidence tag), `CASE-00203` (STRONG, shares a phone number, with name matches), `CASE-00204` (Past, MODERATE, shares an evidence tag) and `CASE-00202` (WEAK, shares only Accra Mall).
2. Click Compare on `CASE-00201`: the leads mention the Hilux `GT-4521-23` and Kofi Boateng, and the two timelines show both cases side by side.
3. Search `asante`: both Asante records appear with their cases. Search `kwame`, `kojo b` and `ashante` too (the last one labelled "similar spelling").
4. Open the Graph page, switch to **Cases**: five or more case nodes with links of different thickness; clicking a link opens its summary and Compare.
5. Create a **new case**. Add a new person with the surname "Asante" to it, and use "Link existing vehicle" to link `GT-4521-23` to that person (`connected-to`). Open the new case's Connections tab: `CASE-00123` and other cases that share the vehicle or the surname now appear as related cases, without any refresh.
6. The Dashboard shows "Strongest case links".
`npm run build` and `npm test` must pass. Update `docs/DEMO_SCRIPT.md` with a new "Case-to-case connections" section covering these steps, update `docs/SPEC_CHECKLIST.md` with the new features, and add "Step 11 to 13" sections to `docs/LEARNING_NOTES.md`.

## Plain-language explanation (copy into LEARNING_NOTES.md)
This is the main idea of the whole project. Instead of staring at one case, the investigator opens a case and sees a **ranked list of other cases that look similar**, with the reason written next to each. The **compare page** is a side-by-side table of two cases: what they share, what to check first, and the two timelines next to each other. The **case network** is the same information drawn as a map, where each dot is a case and a thick line means a strong link. The **name search** finds a person wherever the name shows up, even in a different spelling or only as an alias, and lists every case involved. All of it is **derived**: nothing is stored, so when the data changes, the links change.

## What I should see
Related cases listed on a case, a compare page with "where to look" leads, a map of linked cases, and a name search that lists every case a name appears in.

## I should be able to explain
1. In one sentence, what does the system do for an investigator?
2. Why are the related cases calculated instead of stored?
3. Why does a name match say "check whether they are the same person" instead of "this is the same person"?
