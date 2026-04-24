// Odoo-style Search Dropdown — search + favorites only.
// Filters and Group By have been removed per product decision.
import { useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';

// === Types (kept for backward-compatible imports) ===

export type FilterId = never;
export type GroupById = never;
export type FavoriteId = 'default_pipeline';

export interface ActiveFilters {
  filters: Set<FilterId>;
  groupBy: GroupById | null;
  search: string;
}

export const EMPTY_FILTERS: ActiveFilters = {
  filters: new Set(),
  groupBy: null,
  search: '',
};

// === Component ===

interface CRMSearchDropdownProps {
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
}

export function CRMSearchDropdown({ activeFilters, onFiltersChange }: CRMSearchDropdownProps) {
  const setSearch = useCallback((search: string) => {
    onFiltersChange({ ...activeFilters, search });
  }, [activeFilters, onFiltersChange]);

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative flex items-center border border-border rounded bg-card overflow-hidden">
        <Search className="h-4 w-4 text-muted-foreground ml-2.5 shrink-0" />
        <input
          placeholder="Search pipeline..."
          className="h-8 w-full text-sm bg-transparent border-0 outline-none px-2 placeholder:text-muted-foreground"
          value={activeFilters.search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}

// === Filter logic applied to opportunities ===

import type { Opportunity } from '@/lib/services/crm';

export function useFilteredOpportunities(
  opportunities: Opportunity[],
  activeFilters: ActiveFilters,
  _currentUserId?: string,
) {
  return useMemo(() => {
    let list = [...opportunities];

    // Text search: name, expected revenue, contact name, phone, company name
    if (activeFilters.search) {
      const q = activeFilters.search.toLowerCase();
      list = list.filter(o => {
        const revenueStr = String(o.expectedRevenue ?? '');
        const phone = o.phone ?? '';
        return (
          o.name.toLowerCase().includes(q) ||
          revenueStr.includes(q) ||
          (o.contactName?.toLowerCase().includes(q) ?? false) ||
          phone.toLowerCase().includes(q) ||
          (o.companyName?.toLowerCase().includes(q) ?? false)
        );
      });
    }

    return list;
  }, [opportunities, activeFilters]);
}

// Group helper kept as a no-op for backward compatibility
export function useGroupedOpportunities(
  _opportunities: Opportunity[],
  _groupBy: GroupById | null,
  _stageNames?: Record<string, string>,
) {
  return useMemo(() => null, []);
}
