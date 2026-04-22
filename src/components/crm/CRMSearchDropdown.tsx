// TODO: Replace localStorage with Supabase queries
// Odoo-style Search Dropdown with Filters, Group By, and Favorites
import { useState, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search, ChevronDown, SlidersHorizontal, Users, Star, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// === Filter types ===

export type FilterId =
  | 'my_pipeline' | 'unassigned' | 'open'
  | 'won' | 'ongoing' | 'lost'
  | 'high_priority' | 'medium_priority';

export type GroupById =
  | 'salesperson' | 'sales_team' | 'stage' | 'creation_date' | 'expected_closing';

export type FavoriteId =
  | 'default_pipeline';

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

// === Filter definitions ===

interface FilterDef {
  id: FilterId;
  label: string;
  section?: number; // for visual separators
}

const FILTER_DEFS: FilterDef[] = [
  { id: 'my_pipeline', label: 'My Pipeline', section: 0 },
  { id: 'unassigned', label: 'Unassigned', section: 0 },
  { id: 'open', label: 'Open Opportunities', section: 0 },
  { id: 'high_priority', label: 'High Priority', section: 1 },
  { id: 'medium_priority', label: 'Medium Priority', section: 1 },
  { id: 'won', label: 'Won', section: 2 },
  { id: 'ongoing', label: 'Ongoing', section: 2 },
  { id: 'lost', label: 'Lost', section: 2 },
];

interface GroupByDef {
  id: GroupById;
  label: string;
  section?: number;
}

const GROUPBY_DEFS: GroupByDef[] = [
  { id: 'salesperson', label: 'Salesperson', section: 0 },
  { id: 'sales_team', label: 'Sales Team', section: 0 },
  { id: 'stage', label: 'Stage', section: 0 },
  { id: 'creation_date', label: 'Creation Date', section: 1 },
  { id: 'expected_closing', label: 'Expected Closing', section: 1 },
];

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

  const toggleFilter = useCallback((id: FilterId) => {
    const next = new Set(activeFilters.filters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onFiltersChange({ ...activeFilters, filters: next });
  }, [activeFilters, onFiltersChange]);

  const setGroupBy = useCallback((id: GroupById | null) => {
    onFiltersChange({ ...activeFilters, groupBy: activeFilters.groupBy === id ? null : id });
  }, [activeFilters, onFiltersChange]);

  const setSearch = useCallback((search: string) => {
    onFiltersChange({ ...activeFilters, search });
  }, [activeFilters, onFiltersChange]);

  const clearAll = useCallback(() => {
    onFiltersChange(EMPTY_FILTERS);
  }, [onFiltersChange]);

  const hasActiveFilters = activeFilters.filters.size > 0 || activeFilters.groupBy !== null;

  // Render sections with separators
  const renderFilterItems = (defs: { id: string; label: string; section?: number }[], isActive: (id: string) => boolean, onClick: (id: string) => void) => {
    const items: React.ReactNode[] = [];
    let lastSection: number | undefined;
    defs.forEach((def, i) => {
      if (def.section !== undefined && lastSection !== undefined && def.section !== lastSection) {
        items.push(<div key={`sep-${i}`} className="h-1.5" />);
      }
      lastSection = def.section;
      items.push(
        <button
          key={def.id}
          className={cn(
            'block w-full text-left px-1.5 py-1 text-sm rounded transition-colors',
            isActive(def.id)
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-primary hover:bg-muted/50'
          )}
          onMouseDown={(e) => { e.preventDefault(); onClick(def.id); }}
        >
          {def.label}
          {isActive(def.id) && <span className="ml-1">✓</span>}
        </button>
      );
    });
    return items;
  };

  // Active filter labels
  const activeLabels = useMemo(() => {
    const labels: { key: string; label: string; onRemove: () => void }[] = [];
    activeFilters.filters.forEach((fId) => {
      const def = FILTER_DEFS.find(d => d.id === fId);
      if (def) labels.push({ key: fId, label: def.label, onRemove: () => toggleFilter(fId) });
    });
    if (activeFilters.groupBy) {
      const def = GROUPBY_DEFS.find(d => d.id === activeFilters.groupBy);
      if (def) labels.push({ key: `gb-${activeFilters.groupBy}`, label: `Group: ${def.label}`, onRemove: () => setGroupBy(null) });
    }
    return labels;
  }, [activeFilters, toggleFilter, setGroupBy]);

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

      {/* Active filter badges */}
      {activeLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-1.5">
          {activeLabels.map(({ key, label, onRemove }) => (
            <Badge key={key} variant="secondary" className="gap-1 text-[11px] h-5 px-1.5">
              {label}
              <button onClick={onRemove} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button onClick={clearAll} className="text-[11px] text-muted-foreground hover:text-destructive ml-1">
            Clear all
          </button>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 p-4">
          <div className="grid grid-cols-3 gap-6 text-sm">
            {/* Filters */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#875A7B]" />
                <span className="font-bold text-foreground">Filters</span>
              </div>
              <div className="space-y-0.5">
                {renderFilterItems(
                  FILTER_DEFS,
                  (id) => activeFilters.filters.has(id as FilterId),
                  (id) => toggleFilter(id as FilterId)
                )}
              </div>
            </div>

            {/* Group By */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="h-3.5 w-3.5 text-[#00A09D]" />
                <span className="font-bold text-foreground">Group By</span>
              </div>
              <div className="space-y-0.5">
                {renderFilterItems(
                  GROUPBY_DEFS,
                  (id) => activeFilters.groupBy === id,
                  (id) => setGroupBy(id as GroupById)
                )}
              </div>
            </div>

            {/* Favorites */}
            <div>
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
                      // Reset to defaults
                      onFiltersChange(EMPTY_FILTERS);
                    }}
                  >
                    {fav.label}
                  </button>
                ))}
                <div className="h-1.5" />
                <button
                  className="block w-full text-left px-1.5 py-1 text-sm text-muted-foreground hover:bg-muted/50 rounded transition-colors"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Save current search
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === Filter logic applied to opportunities ===

import type { Opportunity } from '@/lib/data/crm';
import { useAuth } from '@/contexts/AuthContext';

export function useFilteredOpportunities(
  opportunities: Opportunity[],
  activeFilters: ActiveFilters,
  currentUserId?: string,
) {
  return useMemo(() => {
    let list = [...opportunities];

    // Text search
    if (activeFilters.search) {
      const q = activeFilters.search.toLowerCase();
      list = list.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.contactName.toLowerCase().includes(q) ||
        (o.companyName?.toLowerCase().includes(q) ?? false)
      );
    }

    // Filters
    const f = activeFilters.filters;

    // Stage filters
    if (f.has('won')) {
      list = list.filter(o => o.stage === 'won');
    } else if (f.has('lost')) {
      list = list.filter(o => o.stage === 'lost');
    } else if (f.has('ongoing')) {
      list = list.filter(o => o.stage !== 'won' && o.stage !== 'lost');
    } else if (f.has('open')) {
      list = list.filter(o => o.stage !== 'lost');
    }

    // Assignment filters
    if (f.has('my_pipeline') && currentUserId) {
      list = list.filter(o => o.assignedTo === currentUserId || o.assignedTo === undefined);
    }
    if (f.has('unassigned')) {
      list = list.filter(o => !o.assignedTo);
    }

    // Priority filters
    if (f.has('high_priority')) {
      list = list.filter(o => o.priority >= 2);
    }
    if (f.has('medium_priority')) {
      list = list.filter(o => o.priority >= 1);
    }

    return list;
  }, [opportunities, activeFilters, currentUserId]);
}

// Group opportunities by a field
export function useGroupedOpportunities(
  opportunities: Opportunity[],
  groupBy: GroupById | null,
  stageNames?: Record<string, string>,
) {
  return useMemo(() => {
    if (!groupBy) return null;

    const groups: Record<string, Opportunity[]> = {};
    
    opportunities.forEach(opp => {
      let key: string;
      switch (groupBy) {
        case 'salesperson':
          key = opp.assignedTo || 'Unassigned';
          break;
        case 'sales_team':
          key = opp.salesTeam || 'No Team';
          break;
        case 'stage':
          key = stageNames?.[opp.stageId] || opp.stage;
          break;
        case 'creation_date':
          key = opp.createdAt.substring(0, 7); // YYYY-MM
          break;
        case 'expected_closing':
          key = opp.expectedCloseDate.substring(0, 7); // YYYY-MM
          break;
        default:
          key = 'Other';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(opp);
    });

    return groups;
  }, [opportunities, groupBy, stageNames]);
}
