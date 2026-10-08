import os

notes_to_append = """

## Step 04: Lists, filters, search

**What was built:**
Implemented extensive filtering logic, a global search function, list pages for all main entities (Cases, Incidents, Persons, etc.), and reusable UI components like DataTable and FilterBar.

**How it works (plain English with an analogy):**
We've built the "filing cabinets" and a powerful "magnifying glass" for the system. Instead of viewing raw data, investigators can now sort, filter, and search through records instantly, just like using an advanced library catalog to find exactly the book you need.

**Key concepts:**
- Advanced array filtering and mapping.
- Reusable, generic table components with sorting.
- Search indexing and string matching.

**Files to open:**
- src/lib/filters.ts
- src/lib/search.ts
- src/pages/SearchPage.tsx
- src/components/DataTable.tsx
- src/components/FilterBar.tsx

**What I should see:**
- Fully functional list pages for all tabs on the sidebar.
- A functional global search that categorizes results by type.
- Working filters and sorting on tables.

**I should be able to explain:**
- How generic types (`<T>`) allow a single DataTable component to render rows for Cases, Persons, and Vehicles without duplicating code.

## Step 05: Case details (9 tabs)

**What was built:**
Expanded the Zustand state store with case-management actions, built comprehensive scope utilities to fetch related records for a specific case, and created extensive detail pages, including a massive 9-tab Case Detail view.

**How it works (plain English with an analogy):**
We built the "case folder" that gathers everything related to a single investigation in one place. Instead of looking at a person or vehicle in isolation, the system now connects all the dots that belong to a specific case, and provides the forms (actions) to update priorities, link evidence, and write notes.

**Key concepts:**
- Complex data aggregation from normalized data structures.
- Immutable state updates in Zustand.
- React Router URL parameters and query strings (for tab navigation).

**Files to open:**
- src/store/useInvestigationStore.ts
- src/lib/caseScope.ts
- src/pages/CaseDetailPage.tsx
- src/pages/PersonDetailPage.tsx

**What I should see:**
- A detailed 9-tab view when clicking into any Case.
- Detail pages for Persons, Vehicles, Locations, Incidents, and Evidence showing linked entities.
- Working interactions like updating case priority and status.

**I should be able to explain:**
- How immutable state updates ensure React safely re-renders UI elements when new entities or relationships are added to the store.
"""

with open('docs/LEARNING_NOTES.md', 'a', encoding='utf-8') as f:
    f.write(notes_to_append)
