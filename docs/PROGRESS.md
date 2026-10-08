# PROGRESS

| Step | Title | Status | `npm run build` | `npm test` |
|------|-------|--------|-----------------|------------|
| 01 | Font size fix + shared components | done | pass | - | pending | — | — |
| 02 | Types, mock data, store | done | pass | - | pending | — | — |
| 03 | Dashboard | done | pass | - | done | pass | — |
| 04 | Lists, filters, search | done | pass | - | pending | — | — |
| 05 | Case details (9 tabs) | done | pass | - | pending | — | — |
| 06 | Algorithms | done | pass | pass |
| 07 | Timeline + conflicts | done | pass | pass |
| 08 | Relationship graph | done | pass | pass |
| 09 | Custody + activity log | done | pass | pass |
| 10 | Reports + polish | pending | — | — |

---

## Assumptions

1. `npm run lint` currently runs `oxlint` (as configured by the Vite template). We will run it and fix what we can; if it reports issues unrelated to code correctness we will note them here.
2. The sidebar in the existing shell uses a fixed `w-56`/`w-64` width. Under 1024px we will collapse it to icon-only (`w-14`) using a media-query-driven class, which is the "icons only" collapse described in the master file.
3. Tailwind v4 is used. Custom font sizes are expressed with the `@theme` block in `index.css` rather than a `tailwind.config.js`, since v4 uses CSS-first configuration.
4. The `src/App.css` file will be kept but left empty — it is imported in `main.tsx` indirectly via `App.tsx`; removing it would require changing the import chain and is unnecessary.
5. The design system accent colour is kept as the existing blue (`blue-600` / `#2563eb`).
6. `vitest` is installed as a dev dependency in Step 06 as specified; no testing tools are added before that step.
7. Ghana uses GMT year-round, so all timestamps end in `Z`. The day `2026-09-14` is used as the main story date, as specified.
8. Where the spec says "sentence case", all labels, page titles and headings use sentence case.
9. `@xyflow/react/dist/style.css` is imported once globally in `main.tsx` from Step 08 onwards.
10. The `/search` route is added to `App.tsx` without a sidebar link, as specified.
11. A 404 catch-all route is added in Step 10's polish pass.

---

## Blockers

*(None yet)*

---

## Summary

Work in progress — updated after each step completes.



