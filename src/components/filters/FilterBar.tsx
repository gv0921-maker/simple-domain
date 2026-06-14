import { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, Star, Trash2, Check, ArrowUpDown, Group, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterPopover } from './FilterPopover';
import { SaveFilterDialog } from './SaveFilterDialog';
import type { FilterGroup, FilterState, ModuleFilterConfig, SortSpec } from '@/lib/filters/types';
import {
  useSavedFilters, useSaveFilter, useDeleteFilter,
  useSetUserDefault, useDefaultFilter,
} from '@/hooks/useSavedFilters';

interface Props {
  config: ModuleFilterConfig;
  value: FilterState;
  onChange: (s: FilterState) => void;
}

const lastUsedKey = (m: string) => `filter_last_used_${m}`;

export function FilterBar({ config, value, onChange }: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

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
      e.preventDefault(); setFilterOpen(o => !o);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const fieldLabel = useCallback((k: string) =>
    config.fields.find(f => f.key === k)?.label
      ?? config.groupByFields?.find(x => x === k) ?? k, [config]);

  const addGroup = useCallback((g: FilterGroup) => {
    onChange({ ...value, groups: [...(value.groups || []), g] });
  }, [value, onChange]);
  const removeGroup = useCallback((id: string) => {
    onChange({ ...value, groups: value.groups.filter(g => g.id !== id) });
  }, [value, onChange]);
  const clearAll = useCallback(() => {
    onChange({ groups: [] });
  }, [onChange]);

  const setSort = (s?: SortSpec) => onChange({ ...value, sort_by: s });
  const setGroupBy = (g?: string) => onChange({ ...value, group_by: g });
  const setSearch = (q: string) => onChange({ ...value, search: q });

  const sortFields = useMemo(() => config.sortFields ?? config.fields.map(f => f.key), [config]);
  const groupFields = useMemo(() => config.groupByFields ?? [], [config]);

  const activeCount = (value.groups?.length || 0) + (value.sort_by ? 1 : 0) + (value.group_by ? 1 : 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={value.search ?? ''}
            onChange={e => setSearch(e.target.value)}
            placeholder={config.searchPlaceholder ?? 'Search…'}
            className="h-8 pl-8 text-sm"
          />
        </div>

        <FilterPopover
          config={config}
          open={filterOpen}
          onOpenChange={setFilterOpen}
          onAdd={addGroup}
        />

        {groupFields.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <Group className="h-3.5 w-3.5" /> Group By
                {value.group_by && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{fieldLabel(value.group_by)}</Badge>}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setGroupBy(undefined)}>
                <X className="h-3 w-3 mr-2" /> None
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {groupFields.map(k => (
                <DropdownMenuItem key={k} onClick={() => setGroupBy(k)}>
                  {value.group_by === k && <Check className="h-3 w-3 mr-2" />}
                  <span className={value.group_by === k ? '' : 'ml-5'}>{fieldLabel(k)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5" /> Sort
              {value.sort_by && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {fieldLabel(value.sort_by.field)} {value.sort_by.direction === 'desc' ? '↓' : '↑'}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => setSort(undefined)}>
              <X className="h-3 w-3 mr-2" /> None
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {sortFields.map(k => (
              <div key={k} className="flex items-center justify-between px-2 py-1 text-sm hover:bg-muted/50">
                <span>{fieldLabel(k)}</span>
                <div className="flex gap-1">
                  <button className="text-xs px-1.5 py-0.5 rounded hover:bg-muted"
                    onClick={() => setSort({ field: k, direction: 'asc' })}>↑</button>
                  <button className="text-xs px-1.5 py-0.5 rounded hover:bg-muted"
                    onClick={() => setSort({ field: k, direction: 'desc' })}>↓</button>
                </div>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <Star className="h-3.5 w-3.5" /> Favorites
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem onClick={() => setSaveOpen(true)}>
              <Star className="h-3 w-3 mr-2" /> Save current as…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {saved.length === 0 && <DropdownMenuLabel className="text-xs text-muted-foreground">No saved filters</DropdownMenuLabel>}
            {saved.map(f => (
              <div key={f.id} className="flex items-center justify-between px-2 py-1 text-sm hover:bg-muted/50">
                <button className="flex-1 text-left truncate" onClick={() => onChange(f.filter_state)}>
                  {(f.is_default || f.is_system_default) && <Star className="h-3 w-3 inline mr-1 fill-amber-400 text-amber-400" />}
                  {f.name}
                  {f.is_system_default && <span className="text-[10px] text-muted-foreground ml-1">(system)</span>}
                </button>
                <div className="flex gap-1">
                  <button title="Set as default" className="p-1 hover:text-amber-500"
                    onClick={() => setUserDefaultMut.mutate(f.id)}>
                    <Star className={`h-3 w-3 ${f.is_default ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <button title="Delete" className="p-1 hover:text-destructive"
                    onClick={() => deleteFilterMut.mutate(f.id)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearAll}>Clear all</Button>
        )}
      </div>

      {value.groups?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.groups.map(g => (
            <Badge key={g.id} variant="secondary" className="gap-1 text-xs">
              <span className="font-medium">{fieldLabel(g.field)}</span>
              <span className="text-muted-foreground">{g.operator}</span>
              <span>{formatValue(g.value)}</span>
              <button onClick={() => removeGroup(g.id)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <SaveFilterDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSave={({ name, isDefault, isSystemDefault }) =>
          saveFilterMut.mutate({ name, state: value, isDefault, isSystemDefault })}
      />
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
