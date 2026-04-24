// Odoo-style Search Dropdown — search + favorites only.
// Filters and Group By have been removed per product decision.
import { useState, useCallback, useMemo } from 'react';
import {
  Search, ChevronDown, Star,
} from 'lucide-react';

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

interface FavoriteDef {
  id: FavoriteId;
  label: string;
}

const FAVORITE_DEFS: FavoriteDef[] = [
  { id: 'default_pipeline', label: 'Default Pipeline' },
];

// === Component ===

interface CRMSearchDropdownProps {
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
}

export function CRMSearchDropdown({ activeFilters, onFiltersChange }: CRMSearchDropdownProps) {
  const [open, setOpen] = useState(false);

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
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 250)}
        />
        <button
          className="h-8 w-8 flex items-center justify-center border-l border-border text-muted-foreground hover:bg-muted transition-colors shrink-0"
          onMouseDown={(e) => { e.preventDefault(); setOpen(!open); }}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Dropdown — Favorites only */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 p-4">
          <div className="text-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="font-bold text-foreground">Favorites</span>
            </div>
            <div className="space-y-0.5">
              {FAVORITE_DEFS.map((fav) => (
                <button
                  key={fav.id}
                  className="block w-full text-left px-1.5 py-1 text-sm text-foreground hover:bg-muted/50 rounded transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onFiltersChange(EMPTY_FILTERS);
                  }}
                >
                  {fav.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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

    // Text search only
    if (activeFilters.search) {
      const q = activeFilters.search.toLowerCase();
      list = list.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.contactName.toLowerCase().includes(q) ||
        (o.companyName?.toLowerCase().includes(q) ?? false)
      );
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
