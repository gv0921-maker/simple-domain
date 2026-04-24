## Goal

Build an Odoo-style search bar for the CRM Pipeline page (`CRMKanbanBoard` and `CRMPipelineListView`) as a NEW component `CRMSearchBar.tsx`, keeping the existing `CRMSearchDropdown` untouched until the new one is wired in. The component renders a single full-width input with chips and a 3-panel dropdown: **Filters | Group By | Favorites**.

---

## 1. New file — `src/components/crm/CRMSearchBar.tsx`

### Public API
```ts
interface ActiveFilter {
  type: 'filter' | 'groupBy' | 'favorite' | 'search';
  key: string;          // e.g. 'myPipeline', 'creationDate', 'salesperson'
  label: string;        // chip label
  value?: string;       // e.g. date range token, custom filter expression
}

interface CRMSearchBarProps {
  activeFilters: ActiveFilter[];
  onActiveFiltersChange: (filters: ActiveFilter[]) => void;
  groupBy: string | null;
  onGroupByChange: (key: string | null) => void;
}
```

State held internally: `searchText`, `dropdownOpen`, `openSubmenu` (for date sub-menus), `customFilterDialogOpen`, `saveSearchOpen`, `savedSearches`.

### Layout
- Container: `relative flex-1 max-w-2xl`
- Bar: `h-9 rounded-md border border-input bg-background flex items-center gap-1 px-2 flex-wrap` + a search icon at left and a `ChevronDown` button at right that toggles the dropdown.
- Active filters appear inline as chips before the text input:
  - Filter/Search/Favorite chip → `bg-primary/10 text-primary text-xs rounded px-2 py-0.5 flex items-center gap-1` + `X` icon.
  - Group-By chip → same styling but trailing `ChevronDown` (clicking opens a small popover to switch grouping; clicking X clears).
- Free-text input flexes to fill remaining space, no border, transparent.

### Dropdown panel
- Anchored under the bar (`absolute top-full left-0 right-0 mt-1 z-50`).
- `min-w-[720px] bg-popover rounded-lg shadow-lg border border-border`.
- Three columns split by `divide-x divide-border`, each `flex-1 p-2`.
- Column header row: icon + label + bottom border, e.g.:
  - **Filters** — `Filter` (lucide), `text-sm font-semibold`
  - **Group By** — `Layers`
  - **Favorites** — `Star` filled amber
- Item row: `text-sm px-3 py-1.5 rounded cursor-pointer hover:bg-muted/50 flex items-center justify-between`. Active item: `bg-primary/10 text-primary font-medium`. Sub-menu trigger: trailing `ChevronRight`.
- Section dividers: `border-t border-border my-1`.
- Outside-click + `Escape` close. Backed by Radix `Popover` (already in project) for a11y, anchored to the bar.

### Filters column items
Quick toggles:
- **My Pipeline** → key `myPipeline`
- **Unassigned** → key `unassigned`
- **Open Opportunities** → key `open`
- **Unread Messages** → key `unreadMessages`

Date sub-menus (open inline as a nested list when hovered/clicked):
- **Creation Date ▸** → key `creationDate`, value ∈ `today | thisWeek | thisMonth | thisQuarter | thisYear | custom`
- **Closed Date ▸** → key `closeDate`, same options

Status filters: **Won**, **Ongoing**, **Rotting**, **Lost**.

Footer item: **Custom Filter…** → opens dialog.

Toggling an item adds/removes a chip in `activeFilters`. Multiple chips combine with **AND**.

### Group By column items
Single-select (cycling). Setting one clears the previous.
- Salesperson, Sales Team, Stage, City, Country, Lost Reason, Source.
- Date sub-menus: **Creation Date ▸**, **Expected Closing ▸**, **Closed Date ▸** with `day | week | month | quarter | year` choices. Each selection sets `groupBy` to a composite key e.g. `creationDate:month`.
- Properties ▸ and Custom Group ▸ open the same custom-field selector dialog.

### Favorites column items
Built-in saved searches (clicking applies a preset bundle of filters as chips):
- **Follow-Up Report** → activities due ≤ today AND status = open.
- **Monthly Report** → created this month OR closing this month.
- **Weekly Report** → created this week OR closing this week.
- **Default Pipeline** → clears all filters and grouping.

Footer:
- **★ Save current search ▸** — expands inline:
  - `Input` for name (placeholder)
  - Checkbox **Use by default**
  - Checkbox **Share with team** (visual only; persistence local)
  - **Save** button. Persists into `localStorage` key `crm_saved_searches` as `{ id, name, filters, groupBy, isDefault, shared, createdAt }[]`.
- User-saved searches render above the built-in ones with a star icon and an X to delete.
- On mount, if any saved search has `isDefault === true`, it is auto-applied (only if `activeFilters` is empty).

### Custom Filter dialog
Dialog with:
- Field selector: enumerates Opportunity fields (`name`, `contactName`, `companyName`, `assignedTo`, `salesTeam`, `stage`, `expectedRevenue`, `expectedCloseDate`, `priority`, `tags`).
- Operator selector: `equals | contains | greaterThan | lessThan | isSet | isNotSet`.
- Value input (hidden for `isSet`/`isNotSet`; numeric for revenue/priority; date for date fields).
- **Add** button → pushes a chip with `key='custom'`, `value` encoded as JSON `{ field, op, value }`, `label` like `Revenue > 50,000`.

### Keyboard behaviour
- Typing in the search input updates `searchText` and live-filters (managed via a separate `searchText` chip with `key='search'` updated on each keystroke; or kept as a separate transient piece of state added to filtered logic).
- **Enter** commits current `searchText` as a permanent chip (`type:'search'`) and clears the input.
- **Backspace** when input is empty removes the last chip.
- **Escape** closes the dropdown.
- **Arrow Up/Down** navigates dropdown items (basic roving focus).
- Clicking outside closes the dropdown.

---

## 2. New helper — `src/lib/crm/searchFilters.ts`

Pure functions to keep the bar component lean:

```ts
export function applyActiveFilters(
  opportunities: Opportunity[],
  activeFilters: ActiveFilter[],
  ctx: { userId?: string; userName?: string; activitiesByOpp: Record<string, Activity[]> }
): Opportunity[];

export function groupOpportunities(
  opportunities: Opportunity[],
  groupBy: string | null,
  contactsById: Record<string, Contact>
): { label: string; opps: Opportunity[] }[] | null;

export function isInDateRange(iso: string, token: string): boolean;
export function daysSince(iso: string): number;
```

Filter mapping (AND across chips):
- `myPipeline` → `o.assignedTo === ctx.userName`.
- `unassigned` → `!o.assignedTo`.
- `open` → `o.stage !== 'won' && o.stage !== 'lost'`.
- `unreadMessages` → activity entry with `createdAt > localStorage.getItem('crm_last_viewed_'+oppId)`.
- `won` / `lost` → stage equals.
- `rotting` → `daysSince(lastActivity ?? createdAt) > 30 && stage !== 'won' && stage !== 'lost'`.
- `creationDate` / `closeDate` → `isInDateRange(field, value)`.
- `search` → case-insensitive match across `name`, `contactName`, `companyName`, `phone`, `expectedRevenue` (string).
- `custom` → operator-based evaluator on chosen field.

Group key extractor handles composite date keys (`creationDate:month` → format `MMM yyyy`).

---

## 3. Wire-up — keep old component as fallback

### `src/components/crm/CRMKanbanBoard.tsx`
- Replace `CRMSearchDropdown` with `CRMSearchBar`.
- State: `const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])` and `const [groupBy, setGroupBy] = useState<string | null>(null)`.
- Replace `useFilteredOpportunities` call with `applyActiveFilters(opportunities, activeFilters, ctx)`.
- Compute `groupedOpportunities = groupOpportunities(filtered, groupBy, contactsById)`.
- Add new prop path: when `groupedOpportunities` is non-null, render group columns instead of pipeline-stage columns. Each group gets a column with the group label as header (no quick-add, no revenue bar — drag/drop disabled because target stage is ambiguous). When null, keep current stage-based rendering untouched.
- Pull contacts via `useContacts()` (already exists) for `city`/`country` group-bys.
- Pull activities via `useActivities()` (no related filter) once and bucket by `relatedId` for the `unreadMessages` and `rotting` filters.

### `src/components/crm/CRMPipelineListView.tsx`
- Same swap: replace `CRMSearchDropdown` + `useFilteredOpportunities` with `CRMSearchBar` + `applyActiveFilters`.
- When `groupBy` is set, render the table with group header rows (`<TableRow>` with single full-span cell, `bg-muted/40 font-semibold`) before each group's records, similar to the existing footer summary row.

### Old component
- Leave `src/components/crm/CRMSearchDropdown.tsx` and `useFilteredOpportunities` in place (not deleted) so existing imports elsewhere keep compiling. Removed only from the two pipeline files. This satisfies the "keep old as fallback" requirement.

---

## 4. Persistence

`localStorage` keys (consistent with the project's localStorage-first policy in memory):
- `crm_saved_searches` — user saved searches (array).
- `crm_last_viewed_<oppId>` — set when an opportunity detail is opened (existing or to be added in `OpportunityDetail` mount effect — small one-liner addition needed for the **Unread Messages** filter to work meaningfully).

---

## 5. Styling specifics
- Indian Rupee/locale untouched (chips display revenue ranges using `toLocaleString('en-IN')`).
- Odoo purple `#875A7B` reused for the "Save" button in the save-search inline panel.
- Chips use the existing `bg-primary/10 text-primary` palette so theming stays consistent.
- Empty-placeholder policy respected for inputs (no defaults).

---

## 6. Files to be created / edited

**Create**
- `src/components/crm/CRMSearchBar.tsx`
- `src/lib/crm/searchFilters.ts`

**Edit**
- `src/components/crm/CRMKanbanBoard.tsx` — swap search component, add group-by rendering branch, wire activities/contacts.
- `src/components/crm/CRMPipelineListView.tsx` — swap search component, add grouped table rendering.
- `src/pages/crm/OpportunityDetail.tsx` — write `crm_last_viewed_<id>` timestamp on mount (small effect) so **Unread Messages** filter is functional.

**Untouched (kept as fallback)**
- `src/components/crm/CRMSearchDropdown.tsx`

---

## 7. Completion checklist (mirrors your spec)

- [ ] `CRMSearchBar.tsx` created with 3-column dropdown.
- [ ] All Filters items create/remove chips with AND combination.
- [ ] Date sub-menus work for Creation/Closed Date.
- [ ] Group By options transform Kanban + List views; only one active at a time.
- [ ] Favorites: 4 built-ins + user saved searches stored in `localStorage`; default-flag auto-applies.
- [ ] Chips render in bar; X removes specific chip; Group-By chip cycles via popover.
- [ ] Backspace removes last chip when input empty.
- [ ] Escape closes dropdown; outside-click closes.
- [ ] Custom Filter dialog (field/operator/value) adds a chip.
- [ ] `useFilteredOpportunities` (old) untouched; new logic in `searchFilters.ts`.
- [ ] Kanban renders group columns when `groupBy` active.
- [ ] List view renders group header rows when `groupBy` active.
- [ ] TypeScript compiles clean; no behavioral regression to existing search.

Approve to switch to default mode and implement.