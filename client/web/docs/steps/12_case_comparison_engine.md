# Step 12 — The case comparison engine and the name search

> Read `00_MASTER_INSTRUCTIONS.md` first and obey it. **Do NOT run any git command.**
> Pure logic in `src/lib/` plus tests. No screens in this step (Step 13 does the screens).

## Goal
Write the functions that answer two questions:
1. **"Which other cases is this case connected to, how strongly, and where should the investigator look?"**
2. **"Where does this name appear?"** (first name, surname, alias, or part of a name, across all cases)

## 1. The fingerprint of a case (`src/lib/caseFingerprint.ts`)
A case's **fingerprint** is the list of traces it leaves behind. Two cases are connected when their fingerprints overlap.

```ts
interface CaseFingerprint {
  caseId: string;
  type: Case["type"];
  personIds: string[];      // everyone linked to the case (relatedCases), any person type
  vehicleIds: string[];     // use getCaseVehicles from caseScope.ts
  locationIds: string[];    // use getCaseLocations from caseScope.ts
  phoneNumbers: string[];   // normalised (digits only): the people's phone + every phone record of the case
  evidenceTags: string[];   // all tags of all the case's evidence items, lowercase
  incidentMinutesOfDay: number[]; // for each incident, minutes since midnight (UTC)
}
```
`getCaseFingerprint(data, caseId)`. Reuse the helpers from earlier steps. Do not duplicate their logic.

## 2. Comparing two cases (`src/lib/caseComparison.ts`)

**Points (put them in one exported constant, with a plain-English comment for each):**

| Signal | Points | Meaning |
|---|---|---|
| Shared person (same person id in both cases) | 5 each | The same human is linked to both cases |
| Shared vehicle | 5 each | The same car appears in both |
| Shared phone number | 6 each | The same number was used in both |
| Shared evidence tag | 4 each | Same method or object, e.g. `"grey-balaclava"` |
| Shared location | 2 each | Both cases touch the same place |
| Similar time of day | 1 (once) | An incident from each case happened within 90 minutes of the same time of day |
| Same case type | 1 (once) | Both are `theft`, both `fraud`, and so on |
| **Possible same person by name** (see below) | exact full name 3, shared alias 3, surname only 1, **capped at 5 in total** | Names match but the records have different ids, so it is only a possibility |

**Levels:** 0–3 `WEAK`, 4–9 `MODERATE`, 10–17 `STRONG`, 18 and above `VERY STRONG`.

**Name matching between two cases** (`findNameMatches(data, caseAId, caseBId)`): compare every person of case A with every person of case B whose **ids are different**. Normalise names first (lowercase, remove accents and punctuation, split into words).
- Same full name (all words equal, any order) → `exact-name`.
- One person's alias equals the other person's full name or one of their aliases → `shared-alias`.
- Only one word in common, and it is a surname-sized word (4 or more letters), no first-name match → `surname-only`.
Return `{ personAId, personBId, kind }` for each match. A person pair is counted once, using the strongest kind.

```ts
interface CaseComparison {
  caseAId: string; caseBId: string;
  sharedPersonIds: string[]; sharedVehicleIds: string[]; sharedLocationIds: string[];
  sharedPhoneNumbers: string[]; sharedEvidenceTags: string[];
  nameMatches: NameMatch[];
  similarTimeOfDay: boolean; sameType: boolean;
  score: number; level: "WEAK" | "MODERATE" | "STRONG" | "VERY STRONG";
  breakdown: string[];   // e.g. "1 vehicle × 5 = 5", "1 person × 5 = 5", only for signals that fired
  leads: Lead[];
}
```
Functions:
- `compareCases(data, caseAId, caseBId): CaseComparison`. The order of the two cases must not change the score.
- `findRelatedCases(data, caseId): CaseComparison[]`: compare with **every other case** (past and current), keep those with score above 0, sort strongest first. Each result also carries `otherCaseIsPast: boolean` (the other case has status `closed`).
- `findAllCaseLinks(data, minScore = 4): CaseComparison[]`: every pair of cases once (no case with itself, no duplicate pairs), strongest first. Used by the dashboard and the case network.

### Where to look: leads (`src/lib/leads.ts`)
`generateLeads(data, comparison): Lead[]` where `Lead = { priority: "high" | "medium" | "low"; text: string; entityIds: string[] }`. One lead per signal that fired, written as a plain instruction an investigator can act on, with names and numbers filled in:
- shared person → `"Kofi Boateng is linked to both cases. Compare his statements and alibi in each."` (high)
- shared vehicle → `"Vehicle GT-4521-23 (Toyota Hilux) appears in both cases. Check where it was seen in each case and who was driving."` (high)
- shared phone → `"Phone number +233… is used in both cases. Request the call records for both."` (high)
- shared evidence tag → `"Both cases have evidence tagged 'grey-balaclava'. Compare the items side by side."` (medium)
- shared location → `"Both cases involve Accra Mall. Compare CCTV and witness statements from both dates."` (medium)
- name matches → exact name: `"A person called Kwame Asante appears in both cases under different records. Check whether they are the same person."` (medium); surname only: `"Esi Asante shares a surname with Kwame Asante in the other case. This may be a relative or a coincidence."` (low)
- similar time of day → `"Both incidents happened around the same time of day. Compare the two timelines."` (low)
Sort leads high → low. Lead text uses plain words, no jargon.

## 3. The name search (`src/lib/nameSearch.ts`)
`searchByName(data, query): NameSearchResult`

```ts
interface NameSearchResult {
  people: PersonNameMatch[];   // persons whose name or alias matches
  cases: CaseNameMatch[];      // every case where the name appears, each case once
}
interface PersonNameMatch {
  person: Person;
  matchedOn: "full name" | "first name" | "surname" | "alias" | "similar spelling";
  caseIds: string[];           // all cases this person is in
}
interface CaseNameMatch {
  caseId: string; isPast: boolean;
  people: { personId: string; matchedOn: PersonNameMatch["matchedOn"] }[];
  mentions: { where: "case description" | "incident" | "note" | "witness statement" | "evidence"; snippet: string }[];
}
```
Rules:
- Normalise the query and every name (lowercase, no accents or punctuation) and split into words.
- A person matches when **every word in the query matches the start of a word in the person's full name or in one of their aliases**. So `asante` finds Kwame Asante and Esi Asante, `kwame` finds every Kwame, `kojo b` finds the person with that alias, and `kwame asante` finds the exact name first.
- **Similar spelling**: also match words that differ by one letter when the query word has at least 5 letters (`ashante` finds `Asante`). Label these `similar spelling` so they are not presented as certain.
- **Mentions**: also search the text of case descriptions, incident descriptions, notes, witness statements and evidence descriptions for the query words. Return a short snippet around the match.
- `cases` combines both: a case is listed if a matching person is in it **or** the name is mentioned in its text. Each case appears once, with all its matches. Sort: cases with matching people first, then by how many matches, then past cases after current ones.
- A query shorter than 2 characters returns nothing.

## 4. Tests (`src/lib/__tests__/`)
Use the mock data from Steps 02 and 11. All must pass:
- `compareCases(CASE-00123, CASE-00201)`: shares `V-001`, `P-002` and the tag `grey-balaclava`; level is `STRONG` or `VERY STRONG`.
- `compareCases(CASE-00123, CASE-00202)`: shares only the location Accra Mall (and the case type); level `WEAK`; no shared people, no name matches.
- `compareCases(CASE-00123, CASE-00203)`: shares a phone number; has an `exact-name` match (Kwame Asante), a `surname-only` match (Esi Asante) and a `shared-alias` match; name points are capped at 5; level `STRONG`.
- `compareCases(CASE-00123, CASE-00204)`: shares only the tag `crowbar-pry-marks`; level `MODERATE`; `otherCaseIsPast` is true.
- Swapping the two cases gives the same score.
- `findRelatedCases(CASE-00123)` returns the four new cases (and any old links) ordered strongest first, and never includes the case itself.
- `findAllCaseLinks` contains no duplicate pairs and no case paired with itself.
- Every comparison that fired a signal has at least one lead, and leads are sorted high first.
- `searchByName("asante")` finds both Asantes and returns `CASE-00123` and `CASE-00203`; `searchByName("kwame")` finds every Kwame; `searchByName("kojo b")` finds the alias person; `searchByName("ashante")` finds the Asantes labelled `similar spelling`; `searchByName("k")` returns nothing.
- **If a test fails because the mock data does not match Step 11, fix the mock data, not the algorithm.**

## Done when
- [ ] `npm run build` and `npm test` pass.
- [ ] All the engine functions exist with plain-English comments at the top explaining the idea, and every point value has a one-line reason.
- [ ] `docs/PROGRESS.md` and `docs/LEARNING_NOTES.md` updated.

## Plain-language explanation (copy into LEARNING_NOTES.md)
Each case leaves **traces**: people, cars, places, phone numbers, evidence, a time of day. The **fingerprint** is the list of those traces. To compare two cases, the computer lays the two lists side by side and counts what matches, with more points for traces that are harder to match by accident (a shared phone number is worth more than a shared place, because lots of cases happen in the same city). A **name match** between different records is only a *possibility*, so it gets few points and is labelled that way. The **leads** turn the numbers into sentences an investigator can act on. The **name search** matches the start of any word in a name or alias, forgives a one-letter typo, and also looks inside written text, so the name is found wherever it appears.

## What I should see
All tests green, and no change on the screen yet.

## I should be able to explain
1. What is a case fingerprint?
2. Why is a shared phone number worth more points than a shared location?
3. Why does a name-only match get few points and a "possible" label?
