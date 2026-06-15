// Generic, module-agnostic filter framework types.
// Used by CRM Pipeline, CRM Contacts, and future modules.

export type Operator =
  | 'is' | 'is_not'
  | 'contains' | 'starts_with'
  | 'in' | 'not_in'
  | 'gt' | 'lt' | 'gte' | 'lte' | 'between'
  | 'is_empty' | 'is_not_empty'
  | 'today' | 'this_week' | 'this_month' | 'last_n_days'
  | 'before' | 'after';

export type FieldType = 'text' | 'numeric' | 'date' | 'choice' | 'multi_choice' | 'boolean';

export interface FieldOption { value: string; label: string }

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  options?: FieldOption[];
  loadOptions?: () => Promise<FieldOption[]> | FieldOption[];
}

export interface FilterGroup {
  id: string;
  field: string;
  operator: Operator;
  value?: string | string[] | number | { from: unknown; to: unknown };
}

export interface SortSpec { field: string; direction: 'asc' | 'desc' }

export interface FilterState {
  groups: FilterGroup[];
  sort_by?: SortSpec;
  group_by?: string;
  /** Multi-level nested group-by chain. Takes precedence over `group_by`. */
  group_by_fields?: string[];
  search?: string;
}

export const EMPTY_FILTER_STATE: FilterState = { groups: [] };

/** A one-click filter entry. `group` is single; `groups` are AND'd. */
export interface PredefinedFilter {
  id: string;
  label: string;
  group?: FilterGroup;
  groups?: FilterGroup[];
}

/** Section in the Filters popover. Within a section checks are OR'd; across sections AND'd. */
export interface PredefinedFilterSection {
  id: string;
  label: string;
  filters: PredefinedFilter[];
  multiSelect?: boolean; // default true
}

export interface ModuleFilterConfig {
  moduleKey: string;          // e.g. 'crm_opportunities'
  searchPlaceholder?: string;
  fields: FieldConfig[];
  groupByFields?: string[];   // subset of field keys (or virtual keys)
  sortFields?: string[];      // subset of field keys
  predefinedFilters?: PredefinedFilterSection[];
}

/** Magic-token context resolved at filter-application time. */
export interface TokenContext {
  currentUserId?: string;
  currentUserName?: string;
  currentUserEmail?: string;
}
