# 00 — Master Instructions (read this first, obey it in every step)

Project: **Incident Investigation and Case Intelligence Management System** (React + TypeScript).
This file governs steps 01 to 10 in `docs/steps/`.

---

## 0. THE ABSOLUTE RULE — NO GIT

**Do NOT run ANY git command. Ever.**
No `git init`, `git add`, `git commit`, `git push`, `git branch`, `git stash`, `git reset`, `git checkout`, or anything else that starts with `git`. Do not commit "to save progress". Do not create commits for any reason.
The developer does all version control personally. This rule overrides every other instruction.

---

## 1. Who I am and what this project is for

- I am a **total beginner** in web development. This is a supervised learning project. **Understanding matters more than speed.** Write code I can read, and explain it in plain English (see section 6).
- The app is not a simple CRUD project. It **analyses** investigation data: it finds connections between people, incidents, evidence, vehicles and locations, scores how strongly people are connected, builds a timeline, and flags timeline conflicts.
- **Step 1 (project setup and app shell) is already done**: Vite + React + TypeScript, Tailwind, React Router, Zustand, `@xyflow/react`, Recharts, lucide-react, a sidebar with 11 pages, a top bar, and placeholder pages. Build on it. Do not redo it.

## 2. Scope: FRONTEND ONLY, MOCK DATA ONLY

- No backend, no database, no API calls, no login. A later phase adds the backend and database.
- All data lives in `src/data/` (hand-written mock data) and is held in a Zustand store in memory. A page refresh resets it. That is fine.
- Keep all data access behind two places only: the **store** and **pure functions in `src/lib/`** that receive the data as a parameter. This makes it easy to swap in a real backend later.

## 3. How to work through the steps

1. Do the step files in order: `01` → `10`. Finish and verify each step before starting the next.
2. **Do not stop to ask me questions.** I am asleep. If something is ambiguous, choose the simplest sensible option and write the assumption in `docs/PROGRESS.md`.
3. At the end of every step:
   - run `npm run build` (must finish with **zero TypeScript errors**),
   - run `npm run lint` if it exists and fix what it reports,
   - from Step 6 onwards also run `npm test`,
   - then update `docs/LEARNING_NOTES.md` and `docs/PROGRESS.md` (formats in section 6).
4. If you are stuck on the same problem after 3 attempts: write it under "Blockers" in `docs/PROGRESS.md`, leave the code in a **compiling** state, and move on. Never end a step with a broken build.
5. **Do not add** pages, features, or libraries that the step files do not list. The only extra packages allowed are `d3-force` (+ `@types/d3-force`) and `vitest`. Anything else needs to be written in `PROGRESS.md` as a request, not installed.
6. Keep the supervisor's names **exactly** as written in the spec: `Case`, `Person`, `Evidence`, `InvestigationNode`, `InvestigationEdge`, `findConnections`, `findShortestConnection`, and the exact union values (for example `"person-of-interest"`, `"involved-in"`).

## 4. Design system (applies to every page)

The product is a **serious analyst workbench** used by investigators. It should look calm, precise and trustworthy, not like a marketing page.

**Typography (this fixes the "font too small" problem in Step 1):**
- Root font size 16px. Body text 16px. Table cell text 15px. Secondary text and captions **never smaller than 13px**.
- Sidebar links 16px. Page title 28px semibold. Section headings 20px semibold. Card titles 17px medium.
- One font family only (the existing one is fine). Use weight and size for hierarchy.
- Sentence case for all labels and headings. No ALL-CAPS eyebrow labels above headings (status badges such as `HIGH` may be uppercase because they are data).

**Colour and shape:**
- Keep the existing neutral light theme with one blue accent.
- Semantic colours, used the same way everywhere: priority `low` grey, `medium` blue, `high` orange, `critical` red; case status `open` teal, `investigating` blue, `pending` amber, `closed` grey.
- **Each entity type has one fixed colour and one fixed lucide icon**, used in lists, search results, timeline, and the graph: person, incident, vehicle, evidence, location. Define them once in `src/lib/entityStyle.ts`.
- No heavy gradients. No decorative animation. Only quick (≤150ms) hover/focus transitions and motion that answers a click (opening a panel, expanding).
- Do not make every block an identical rounded card. Use cards for grouped content, plain tables for lists, and dividers for sections. Vary the radius by hierarchy (small for badges and inputs, medium for panels).
- Colour is never the only signal: badges always contain text.

**Layout and quality floor:**
- Desktop first, works down to tablet width. Under 1024px the sidebar collapses to icons.
- Every page has: a page header (title, one-line description, optional actions), a proper **empty state** (says what is missing and what to do), and handles zero results.
- Visible keyboard focus. Real `<button>` and `<a>` elements. Form fields have labels.
- Reuse shared components, built once in `src/components/`: `PageHeader`, `Badge` (with `PriorityBadge`, `StatusBadge`, `EntityTypeBadge`), `Card`, `DataTable`, `FilterBar`, `EmptyState`, `Tabs`, `StatCard`, `EntityIcon`, `Modal`.
- Write interface text from the investigator's point of view: plain words, active voice, buttons that say exactly what they do ("Add person", "Change priority"), errors that say what went wrong and how to fix it.

## 5. Code rules (so a beginner can follow it)

- TypeScript **strict**. No `any`. No `@ts-ignore`.
- One component per file. Components in PascalCase files, functions in camelCase files.
- **No business logic inside JSX.** Anything that calculates, filters, scores, or searches goes in a small pure function in `src/lib/`.
- Every function in `src/lib/` takes the data it needs as a parameter and returns a result. It does not read the store itself.
- Every algorithm (scoring, search, BFS, timeline, conflicts, custody rules) gets **plain-English comments explaining the idea and why each part exists**, written for a beginner.
- Folder layout (created in Step 1): `types/`, `data/`, `lib/`, `store/`, `components/`, `pages/`.

## 6. Documentation you must keep updating

Create these two files in `docs/` at the start of Step 1b and update them after every step.

### `docs/LEARNING_NOTES.md`
For each step add a section in this format:

```
## Step N — Title
**What was built:** 2 to 4 sentences.
**How it works (plain English):** explain it as if to a beginner, with one everyday analogy per big idea.
**Key concepts:** short bullet list, each with a one-line meaning.
**Files to open:** the 3 to 6 most important files and what each one does.
**What I should see:** exact things to look for in the browser or terminal.
**I should be able to explain:** 3 questions I should be able to answer after reading this section.
```

### `docs/PROGRESS.md`
- A table: step number, title, status (`done` / `done with issues` / `skipped`), and the result of `npm run build` and `npm test`.
- A list of **Assumptions** you made.
- A list of **Blockers** (empty if none).
- At the very end, a short summary of what works and what to check first in the morning.

## 7. Definition of done for the whole frontend

Every item in the supervisor's spec is covered: all models, every entity linkable to every other, relationship graph, connection scoring, `findConnections`, `findShortestConnection` (BFS), automatic timeline, timeline conflict detection, dashboard, case details with all 9 tabs, evidence chain of custody with blocked invalid actions, advanced search, and activity log. `docs/steps/10_reports_polish.md` has the final checklist.
