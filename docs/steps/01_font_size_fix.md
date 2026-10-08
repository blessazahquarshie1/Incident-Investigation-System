# Step 01 — Fix the font size and set up the notes files

> Read `00_MASTER_INSTRUCTIONS.md` first. **Do NOT run any git command.**

## Goal
The app shell from Step 1 works but the text is too small. Fix the typography across the whole shell and the 11 placeholder pages, and create the two documentation files.

## What to do

1. **Typography.** Apply the type scale from section 4 of the master file:
   - root and body 16px, table text 15px, captions never below 13px,
   - sidebar links 16px, page titles 28px semibold, section headings 20px semibold.
   Define the sizes **in one place** (Tailwind theme or `index.css`) so every page uses the same values. Do not scatter one-off pixel sizes through components.
2. **Shell.** Increase the sidebar item height and padding to match the larger text, keep the icons aligned, and make the top bar search box text 16px. The app name and subtitle in the top bar must also be larger.
3. **Placeholder pages.** Every page keeps its title and one-line description, now using the new scale.
4. **Shared building blocks.** Create the shared components listed in the master file (`PageHeader`, `Badge`, `Card`, `EmptyState`, `Tabs`, `StatCard`, `EntityIcon`, `Modal`) as simple, typed, reusable components, and create `src/lib/entityStyle.ts` with the fixed colour and icon for each entity type (person, incident, vehicle, evidence, location). Use `PageHeader` on all 11 placeholder pages. Do not build `DataTable` and `FilterBar` yet (Step 4).
5. **Documentation.** Create `docs/LEARNING_NOTES.md` and `docs/PROGRESS.md` using the formats in section 6 of the master file, and write the first entries for Steps 1 and 01.

## Done when
- [ ] `npm run build` passes with zero errors.
- [ ] No text on any page is smaller than 13px, and normal reading text is 16px.
- [ ] All 11 pages use `PageHeader` and look consistent.
- [ ] `docs/LEARNING_NOTES.md` and `docs/PROGRESS.md` exist.

## Plain-language explanation (copy into LEARNING_NOTES.md)
A **design token** is a named value (like "body text is 16px") defined once and reused everywhere. If you want bigger text later, you change one place instead of fifty. **Shared components** work the same way: build the page header once, use it on every page, and all pages stay consistent.

## What I should see
Larger, comfortable text everywhere; the sidebar and top bar proportionally bigger; every page has the same header style.

## I should be able to explain
1. What is a design token and why is it better than typing sizes everywhere?
2. Why do we build a shared `PageHeader` instead of copying the same HTML into every page?
3. Why does each entity type (person, vehicle, evidence…) have one fixed colour and icon?
