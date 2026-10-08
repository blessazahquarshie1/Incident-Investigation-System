# Step 09 — Evidence chain of custody and the activity log

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
Every evidence item keeps a history of who handled it. The app must **refuse invalid actions** (for example transferring evidence that is already destroyed). This is **state transition logic**. Then finish the activity log so every important operation is recorded.

## 1. The rules (`src/lib/custody.ts`)

**Status comes from the last history entry** (`deriveStatus(history): EvidenceStatus`):

| Last action in history | Status |
|---|---|
| `collected` | `collected` |
| `transferred` | `with-officer` |
| `submitted-to-evidence-room` | `in-evidence-room` |
| `analysis-started` | `under-analysis` |
| `analysis-completed` | `analysed` |
| `released` | `released` |
| `destroyed` | `destroyed` |

**Allowed transitions** (a lookup table `ALLOWED_ACTIONS: Record<EvidenceStatus, CustodyAction[]>`):

| Current status | Actions allowed next |
|---|---|
| `collected` | `transferred`, `submitted-to-evidence-room` |
| `with-officer` | `transferred`, `submitted-to-evidence-room` |
| `in-evidence-room` | `transferred`, `analysis-started`, `released`, `destroyed` |
| `under-analysis` | `analysis-completed` |
| `analysed` | `transferred`, `submitted-to-evidence-room`, `released`, `destroyed` |
| `released` | none (final) |
| `destroyed` | none (final) |

Functions:
- `getAllowedActions(evidence): CustodyAction[]`
- `getCurrentHolderId(evidence): string`: the `toOfficerId` of the last `transferred` entry, otherwise the `officerId` of the last entry.
- `validateCustodyAction(evidence, action, input): { ok: true } | { ok: false; reason: string }` where `input = { timestamp, officerId, toOfficerId? }`. It rejects, with a **specific human-readable reason**:
  - an action not in the allowed list for the current status. For `destroyed` evidence the reason must read like: `Evidence E-031 cannot be transferred: it has already been marked destroyed.` For other statuses name the current status and list what is allowed;
  - a `transferred` action with no `toOfficerId`, or one equal to the current holder;
  - a timestamp earlier than the last history entry;
  - an `officerId` that is not the current holder for `transferred`, `submitted-to-evidence-room` and `analysis-started` (only the person holding the item can hand it on), except that anyone can act on items in the evidence room.
- `applyCustodyAction(evidence, action, input)`: calls `validateCustodyAction`; on success returns the updated evidence (a **new object** with the new entry appended and the new derived `status`), on failure returns the reason and changes nothing.

Comment the file in plain English: "a state machine is a list of states plus rules about which moves between states are allowed".

## 2. Store action
`applyEvidenceCustodyAction(evidenceId, action, { toOfficerId?, note? })`: uses the current officer and the current time, calls `applyCustodyAction`, and returns `{ ok: true }` or `{ ok: false, reason }`. On success it also calls `addActivity` with action `custody-action`, for example `Evidence E-024 transferred to Officer B`. On failure it changes nothing.

## 3. Tests (`src/lib/__tests__/custody.test.ts`)
- The `E-024` Laptop history from the mock data is valid step by step and ends in `under-analysis`.
- Transferring `E-031` (destroyed) is rejected with the destroyed reason, and the evidence is unchanged.
- `released` and `destroyed` items allow no actions.
- Transfer to the same officer, transfer without a recipient, and a timestamp earlier than the last entry are all rejected.
- Every mock evidence item's stored `status` equals `deriveStatus(its custodyHistory)`.

## 4. Evidence detail page (the custody section reserved in Step 04)
- A **status badge** and the **current holder**.
- **Chain of custody** as a vertical history in the supervisor's format: time, then the action sentence (`09:30  Collected by Officer A`, `10:45  Transferred to Officer B`, `14:12  Submitted to evidence room`, `16:00  Digital analysis started`), with the date once per day.
- **Action buttons** for all seven actions. Buttons for actions that are not allowed now are **disabled and show the reason** (visible text, not only a tooltip). "Transfer" opens a small form to pick the receiving officer. "Destroy" and "Release" ask for confirmation first.
- When an action succeeds, the history, status and holder update immediately. When the store returns `{ ok: false, reason }`, show the reason in an error message.

## 5. Activity log
- Check that **every** store action that changes data calls `addActivity`: case creation, priority and status changes, person added, vehicle linked, evidence uploaded, custody actions, notes added. Fix any that don't.
- `ActivityFeed` reusable component: entries grouped by day, each line `10:23  Officer Mensah added Person A`, newest first. Use it in the Case → Activity log tab (add an action-type filter there) and on the Dashboard's recent activity.
- The supervisor's four example lines must be reproducible by hand in the app: person added, vehicle linked to a person, evidence uploaded, and `Case priority changed: MEDIUM → HIGH`.

## Done when
- [ ] `npm run build` and `npm test` pass.
- [ ] On `E-031`, every action button is disabled and the destroyed reason is shown.
- [ ] On `E-024`, the next allowed action works and a new line appears in the history and in the case's Activity log.
- [ ] Doing the four example operations creates the four activity lines.

## Plain-language explanation (copy into LEARNING_NOTES.md)
A **state machine** is a set of states (collected, in the evidence room, destroyed…) and strict rules about which move is allowed from each state. Writing the rules as a table means a rule can be read, checked and changed without hunting through the code. The app **refuses** an invalid move instead of trusting the user, which is how real systems protect important records. The **chain of custody** is an append-only history: entries are added, never edited, so the record of who held the evidence is trustworthy.

## What I should see
A destroyed item that cannot be touched and explains why; a live item whose history grows when you act on it; a case activity log that records everything you do.

## I should be able to explain
1. What is a state machine and where is it in this app?
2. Why is the status derived from the history rather than typed in separately?
3. Why does the history only ever add entries and never edit old ones?
