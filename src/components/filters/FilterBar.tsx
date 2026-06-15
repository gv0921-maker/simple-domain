import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FiltersColumn, GroupByColumn, FavoritesColumn } from './FilterPopover';
import type { FilterGroup, FilterState, ModuleFilterConfig, SortSpec } from '@/lib/filters/types';
import {
  useSavedFilters, useSaveFilter, useDeleteFilter,
  useSetUserDefault, useDefaultFilter,
} from '@/hooks/useSavedFilters';
import { useRoleCheck } from '@/hooks/auth/useRoleCheck';

interface Props {
  config: ModuleFilterConfig;
  value: FilterState;
  onChange: (s: FilterState) => void;
}

const lastUsedKey = (m: string) => `filter_last_used_${m}`;

export function FilterBar({ config, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { isSuperAdmin } = useRoleCheck();
  const { data: saved = [] } = useSavedFilters(config.moduleKey);
  const { data: defaultFilter } = useDefaultFilter(config.moduleKey);
  const saveFilterMut = useSaveFilter(config.moduleKey);
  const deleteFilterMut = useDeleteFilter(config.moduleKey);
  const setUserDefaultMut = useSetUserDefault(config.moduleKey);

  // Hydrate from default filter or last-used localStorage once.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hydrated) return;
    if (defaultFilter) {
      onChange(defaultFilter.filter_state);
      setHydrated(true);
    } else {
      try {
        const raw = localStorage.getItem(lastUsedKey(config.moduleKey));
        if (raw) onChange(JSON.parse(raw));
      } catch { /* noop */ }
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultFilter]);

  // Persist last-used.
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(lastUsedKey(config.moduleKey), JSON.stringify(value)); } catch { /* noop */ }
  }, [value, hydrated, config.moduleKey]);

  // Keyboard: 'F' opens popover (only when not typing).
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault(); setOpen(o => !o);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const fieldLabel = useCallback((k: string) =>
    config.fields.find(f => f.key === k)?.label
      ?? config.groupByFields?.find(x => x === k) ?? k, [config]);

  const removeGroup = useCallback((id: string) => {
    onChange({ ...value, groups: value.groups.filter(g => g.id !== id) });
  }, [value, onChange]);
  const clearAll = useCallback(() => {
    onChange({ groups: [] });
  }, [onChange]);

  const setSort = (s?: SortSpec) => onChange({ ...value, sort_by: s });
  const setSearch = (q: string) => onChange({ ...value, search: q });

  // Multi-level group-by helpers — `group_by_fields` is the source of truth;
  // legacy `group_by` is treated as a single-element chain.
  const groupChain = useMemo<string[]>(() => {
    if (value.group_by_fields && value.group_by_fields.length) return value.group_by_fields;
    return value.group_by ? [value.group_by] : [];
  }, [value.group_by_fields, value.group_by]);

  const setGroupChain = (chain: string[]) => {
    onChange({ ...value, group_by_fields: chain.length ? chain : undefined, group_by: undefined });
  };
  const removeGroupBy = (k: string) => setGroupChain(groupChain.filter(x => x !== k));

  const sortFields = useMemo(() => config.sortFields ?? config.fields.map(f => f.key), [config]);

  const activeCount = (value.groups?.length || 0) + (value.sort_by ? 1 : 0) + (groupChain.length ? 1 : 0);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        {/* Unified search input with chips inside */}
        <div
          className="flex items-center gap-1 h-9 rounded-md border border-input bg-background pl-2.5 pr-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

          <div className="flex-1 flex items-center gap-1 flex-wrap min-w-0 py-1">
            {/* Filter chips */}
            {value.groups?.map(g => (
              <Badge
                key={g.id}
                variant="secondary"
                className="gap-1 text-xs h-6 max-w-[200px]"
                title={`${fieldLabel(g.field)} ${g.operator} ${formatValue(g.value)}`}
              >
                <span className="font-medium truncate">{fieldLabel(g.field)}:</span>
                <span className="truncate">{formatValue(g.value) || g.operator}</span>
                <button onClick={() => removeGroup(g.id)} className="hover:text-destructive ml-0.5 shrink-0">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {/* Group-by breadcrumb chip */}
            {groupChain.length > 0 && (
              <Badge
                variant="outline"
                className="gap-1 text-xs h-6 border-primary/40 text-primary"
              >
                <span className="font-medium">Group:</span>
                <span className="flex items-center gap-0.5">
                  {groupChain.map((k, i) => (
                    <span key={k} className="flex items-center gap-0.5">
                      {i > 0 && <ChevronRight className="h-3 w-3 opacity-60" />}
                      <span>{fieldLabel(k)}</span>
                      <button
                        onClick={() => removeGroupBy(k)}
                        className="hover:text-destructive"
                        title="Remove level"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </span>
              </Badge>
            )}

            {/* Sort chip */}
            {value.sort_by && (
              <Badge variant="outline" className="gap-1 text-xs h-6">
                <ArrowUpDown className="h-3 w-3" />
                {fieldLabel(value.sort_by.field)} {value.sort_by.direction === 'desc' ? '↓' : '↑'}
                <button onClick={() => setSort(undefined)} className="hover:text-destructive ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            <input
              ref={searchRef}
              value={value.search ?? ''}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                activeCount === 0
                  ? (config.searchPlaceholder ?? 'Search…')
                  : ''
              }
              className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              onFocus={() => setOpen(true)}
            />
          </div>

          {/* Sort quick menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Sort"
                className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Sort by
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSort(undefined)}>
                <X className="h-3 w-3 mr-2" /> None
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {sortFields.map(k => (
                <div key={k} className="flex items-center justify-between px-2 py-1 text-sm hover:bg-muted/50">
                  <span className="truncate">{fieldLabel(k)}</span>
                  <div className="flex gap-1 shrink-0">
                    <button className="text-xs px-1.5 py-0.5 rounded hover:bg-muted"
                      onClick={() => setSort({ field: k, direction: 'asc' })}>↑</button>
                    <button className="text-xs px-1.5 py-0.5 rounded hover:bg-muted"
                      onClick={() => setSort({ field: k, direction: 'desc' })}>↓</button>
                  </div>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {activeCount > 0 && (
            <button
              type="button"
              title="Clear all"
              onClick={clearAll}
              className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <PopoverTrigger asChild>
            <button
              type="button"
              title="Open search options"
              className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </div>

        <PopoverContent
          align="end"
          sideOffset={6}
          className="w-[760px] max-w-[95vw] p-0 max-h-[70vh] overflow-hidden"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <div className="grid grid-cols-3 divide-x max-h-[70vh]">
            <FiltersColumn config={config} value={value} onChange={onChange} />
            <GroupByColumn
              config={config}
              fieldLabel={fieldLabel}
              chain={groupChain}
              onChange={setGroupChain}
            />
            <FavoritesColumn
              saved={saved}
              isSuperAdmin={isSuperAdmin}
              onApply={(state) => onChange(state)}
              onSetDefault={(id) => setUserDefaultMut.mutate(id)}
              onDelete={(id) => deleteFilterMut.mutate(id)}
              onSave={({ name, isDefault, isSystemDefault }) =>
                saveFilterMut.mutate({ name, state: value, isDefault, isSystemDefault })}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function formatValue(v: FilterGroup['value']): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') {
    const o = v as { from: unknown; to: unknown };
    return `${o.from} – ${o.to}`;
  }
  return String(v);
}
