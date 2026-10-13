# Step 11 — More cases that connect to the Accra Mall robbery

> Read `00_MASTER_INSTRUCTIONS.md` first and obey it. **Do NOT run any git command.**
> Frontend and mock data only. Do not change how any existing page looks in this step.

## Why we are doing this (new direction from the supervisor)
The real purpose of the system is to **find connections between a current case and other cases (past or current)** and point investigators to where to look. To show that, the mock data needs several cases that link to the Accra Mall robbery (`CASE-00123`) in different ways and with different strengths.

## 1. Small change to the types
- Add an optional field to `Evidence`: `tags?: string[]`. Tags describe things that can match between cases, like a method or an object. Use short lowercase words with hyphens, for example `"grey-balaclava"`, `"crowbar-pry-marks"`.
- Do not change `Case`, `Person` or any other spec model.

## 2. Make sure the main case is the Accra Mall robbery
- A location named **Accra Mall** (city Accra, region Greater Accra) must exist. Add it if it does not, and make the robbery incident `I-023` of `CASE-00123` happen there. (Incident locations are not used in the people-score tests, so this is safe. Run the tests afterwards to be sure.)
- Add the tag `"grey-balaclava"` to one evidence item of `CASE-00123`, and the tag `"crowbar-pry-marks"` to another.

## 3. Add four cases (use ids `CASE-00201` to `CASE-00204`)
Write every detail by hand. Each case needs a lead officer, an incident, 2 to 4 people, 1 to 3 evidence items with custody history, a few relationships, and 2 to 4 activity entries, all consistent with the rest of the data model. Use fictional Ghanaian-style names.

| Case | Status and type | How it connects to `CASE-00123` | Must be true |
|---|---|---|---|
| `CASE-00201` **Kasoa Fuel Station Robbery** | `closed` (a **past** case), `theft`, created March 2026 | **Strong link.** Vehicle `V-001` (the Toyota Hilux, `GT-4521-23`) was seen leaving. Person `P-002` (Kofi Boateng) is a suspect in both cases. One evidence item tagged `"grey-balaclava"`. The incident happened at about 08:50 in the morning. | Shares `V-001`, `P-002` and the tag `"grey-balaclava"` with `CASE-00123`. |
| `CASE-00202` **Accra Mall Parking Vehicle Theft** | `investigating`, `theft` | **Weak link.** Only the **same place**: its incident happened at Accra Mall. | Completely different people, vehicles and phones. **No person in this case may share a first name, surname or alias with anyone in `CASE-00123`**. No shared evidence tags. |
| `CASE-00203` **Osu Mobile Money Fraud** | `investigating`, `fraud` | **Link through a phone number and names.** A phone record in this case uses the **same phone number as `P-004`**. It also has a person called **Kwame Asante** (same full name as `P-001` but a separate record, with a new id), a person called **Esi Asante** (only the surname matches), and a person whose `knownAliases` contains an alias that `P-002` also has (add the alias `"Kojo B"` to `P-002` if he has none, and give the new person the same alias). | Shares a phone number with `CASE-00123`. Contains the three name situations: exact full name, surname only, alias. |
| `CASE-00204` **Takoradi Market Theft (2024)** | `closed` (past), `theft`, created in 2024 | **Moderate link through the method only.** It has an evidence item tagged `"crowbar-pry-marks"`. | No shared people, vehicles, phones or locations. The only shared thing with `CASE-00123` is the tag (plus the same case type). |

Also make sure the existing `CASE-00022` and `CASE-00031` still exist and still link to `V-001`.

## 4. Consistency rules (the app will break quietly if these are wrong)
- Every id is unique and uses the right prefix; every `caseId`, `personId`, `locationId`, vehicle id and officer id points to a record that exists.
- Every new person has `relatedCases` including the case they belong to. A person in two cases lists both ids.
- Every evidence item's `status` equals the status derived from its `custodyHistory`.
- Timestamps are ISO strings ending in `Z`. Past cases have dates in the past.
- Add activity log entries for each new case (at least "Case created").

## 5. Verify
- `npm run build` and `npm test` pass (the old tests must still pass).
- Open the Cases list: the four new cases appear, and two of them show status `closed`.
- Open each new case page: no empty or broken tabs for the data you added.
- Search `GT-4521-23`: the vehicle's linked cases now include `CASE-00201`.
- Write the added ids and the "story" of each case in `docs/PROGRESS.md` and a short "Step 11" section in `docs/LEARNING_NOTES.md`.

## Plain-language explanation (copy into LEARNING_NOTES.md)
A system that finds links needs something to find. We are adding cases on purpose: one that shares a **car and a suspect** (strong), one that shares only a **place** (weak), one that shares a **phone number and similar names** (partly strong, partly unsure), and one **old closed case** that shares only the **method** (moderate). Real investigations look the same: sometimes the link is obvious, sometimes it is one small detail. **Tags** let evidence describe itself in a way that can be matched, like "pry marks from a crowbar".

## What I should see
Four new cases in the Cases list, two of them closed, and the vehicle search now showing one more linked case.

## I should be able to explain
1. Why did we add a case that only shares a place with the main case?
2. What is an evidence tag and why does it help find links?
3. Why is the old closed case still useful to an investigator?
