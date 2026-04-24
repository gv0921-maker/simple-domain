// Odoo-style 3-panel search bar for CRM Pipeline.
// Panels: Filters | Group By | Favorites. Renders chips inline.
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Search, ChevronDown, ChevronRight, X, Filter as FilterIcon, Layers,
  Star, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  type ActiveFilter, type SavedSearch,
  loadSavedSearches, persistSavedSearches,
  presetFollowUp, presetMonthlyReport, presetWeeklyReport,
} from '@/lib/crm/searchFilters';

interface CRMSearchBarProps {
  activeFilters: ActiveFilter[];
  onActiveFiltersChange: (filters: ActiveFilter[]) => void;
  groupBy: string | null;
  onGroupByChange: (key: string | null) => void;
  liveSearch: string;
  onLiveSearchChange: (s: string) => void;
}

const DATE_OPTIONS: { id: string; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'thisQuarter', label: 'This Quarter' },
  { id: 'thisYear', label: 'This Year' },
];

const GROUP_PERIODS: { id: string; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

const GROUP_BASE: { id: string; label: string }[] = [
  { id: 'salesperson', label: 'Salesperson' },
  { id: 'salesTeam', label: 'Sales Team' },
  { id: 'stage', label: 'Stage' },
  { id: 'city', label: 'City' },
  { id: 'country', label: 'Country' },
  { id: 'lostReason', label: 'Lost Reason' },
  { id: 'source', label: 'Source' },
];

const GROUP_DATES: { id: string; label: string }[] = [
  { id: 'creationDate', label: 'Creation Date' },
  { id: 'expectedClosing', label: 'Expected Closing' },
  { id: 'closedDate', label: 'Closed Date' },
];

const FIELDS: { id: string; label: string }[] = [
  { id: 'name', label: 'Opportunity' },
  { id: 'contactName', label: 'Contact' },
  { id: 'companyName', label: 'Company' },
  { id: 'assignedTo', label: 'User Responsible' },
  { id: 'salesTeam', label: 'Sales Team' },
  { id: 'stage', label: 'Stage' },
  { id: 'expectedRevenue', label: 'Expected Revenue' },
  { id: 'expectedCloseDate', label: 'Expected Closing' },
  { id: 'priority', label: 'Priority' },
];

const OPS: { id: string; label: string }[] = [
  { id: 'equals', label: 'equals' },
  { id: 'contains', label: 'contains' },
  { id: 'greaterThan', label: '>' },
  { id: 'lessThan', label: '<' },
  { id: 'isSet', label: 'is set' },
  { id: 'isNotSet', label: 'is not set' },
];

export function CRMSearchBar({
  activeFilters,
  onActiveFiltersChange,
  groupBy,
  onGroupByChange,
  liveSearch,
  onLiveSearchChange,
}: CRMSearchBarProps) {
  const [open, setOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => loadSavedSearches());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Apply default saved search on first mount only when nothing is active
  const appliedDefaultRef = useRef(false);
  useEffect(() => {
    if (appliedDefaultRef.current) return;
    appliedDefaultRef.current = true;
    if (activeFilters.length === 0 && !groupBy) {
      const def = savedSearches.find(s => s.isDefault);
      if (def) {
        onActiveFiltersChange(def.filters);
        onGroupByChange(def.groupBy);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside click + Escape close
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false); setOpenSubmenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setOpenSubmenu(null); } };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hasFilter = useCallback((key: string, value?: string) => {
    return activeFilters.some(f => f.key === key && (value === undefined || f.value === value));
  }, [activeFilters]);

  const toggleFilter = useCallback((f: ActiveFilter) => {
    const exists = activeFilters.some(x => x.key === f.key && x.value === f.value);
    if (exists) {
      onActiveFiltersChange(activeFilters.filter(x => !(x.key === f.key && x.value === f.value)));
    } else {
      // remove other variants of same key for date filters
      const cleaned = ['creationDate','closeDate'].includes(f.key)
        ? activeFilters.filter(x => x.key !== f.key)
        : activeFilters;
      onActiveFiltersChange([...cleaned, f]);
    }
  }, [activeFilters, onActiveFiltersChange]);

  const removeChip = (idx: number) => {
    const next = activeFilters.slice();
    next.splice(idx, 1);
    onActiveFiltersChange(next);
  };

  const clearAll = () => {
    onActiveFiltersChange([]);
    onGroupByChange(null);
    onLiveSearchChange('');
  };

  const applyPreset = (filters: ActiveFilter[]) => {
    onActiveFiltersChange(filters);
    setOpen(false); setOpenSubmenu(null);
  };

  const handleSaveSearch = (name: string, isDefault: boolean, shared: boolean) => {
    if (!name.trim()) return;
    let next = savedSearches.slice();
    if (isDefault) next = next.map(s => ({ ...s, isDefault: false }));
    next.push({
      id: `s_${Date.now()}`,
      name: name.trim(),
      filters: activeFilters,
      groupBy,
      isDefault,
      shared,
      createdAt: new Date().toISOString(),
    });
    setSavedSearches(next);
    persistSavedSearches(next);
    setSaveOpen(false);
  };

  const deleteSaved = (id: string) => {
    const next = savedSearches.filter(s => s.id !== id);
    setSavedSearches(next);
    persistSavedSearches(next);
  };

  const groupChip = useMemo(() => {
    if (!groupBy) return null;
    const [base, period] = groupBy.split(':');
    const baseLabel = GROUP_BASE.find(g => g.id === base)?.label
      || GROUP_DATES.find(g => g.id === base)?.label
      || base;
    return period ? `${baseLabel}: ${period}` : baseLabel;
  }, [groupBy]);

  // Dropdown item helpers
  const Item = ({ active, onClick, children, sub, indent }: { active?: boolean; onClick?: () => void; children: React.ReactNode; sub?: boolean; indent?: boolean }) => (
    <div
      onClick={onClick}
      className={cn(
        'text-sm rounded cursor-pointer flex items-center justify-between px-3 py-1.5 hover:bg-muted/50',
        active && 'bg-primary/10 text-primary font-medium',
        indent && 'pl-6 text-muted-foreground',
        sub && 'text-muted-foreground',
      )}
    >
      {children}
    </div>
  );

  const Divider = () => <div className="border-t border-border my-1" />;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl">
      {/* Bar */}
      <div
        className={cn(
          'min-h-9 rounded-md border border-input bg-background flex items-center gap-1 px-2 flex-wrap py-1',
          open && 'ring-2 ring-ring/30',
        )}
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* Chips */}
        {activeFilters.map((f, idx) => (
          <span key={`${f.key}-${idx}`} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs rounded px-2 py-0.5">
            {f.label}
            <button type="button" onClick={() => removeChip(idx)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {groupChip && (
          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs rounded px-2 py-0.5">
            <Layers className="h-3 w-3" />
            {groupChip}
            <button type="button" onClick={() => onGroupByChange(null)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}

        <input
          ref={inputRef}
          value={liveSearch}
          onChange={(e) => onLiveSearchChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && liveSearch.trim()) {
              e.preventDefault();
              onActiveFiltersChange([
                ...activeFilters,
                { type: 'search', key: 'search', label: `Search: ${liveSearch.trim()}`, value: liveSearch.trim() },
              ]);
              onLiveSearchChange('');
            } else if (e.key === 'Backspace' && !liveSearch && activeFilters.length > 0) {
              removeChip(activeFilters.length - 1);
            } else if (e.key === 'Escape') {
              setOpen(false); setOpenSubmenu(null);
            }
          }}
          placeholder={activeFilters.length === 0 && !groupChip ? 'Search pipeline...' : ''}
          className="flex-1 min-w-[120px] h-7 text-sm bg-transparent border-0 outline-none px-1 placeholder:text-muted-foreground"
        />

        <button
          type="button"
          onClick={() => { setOpen(o => !o); inputRef.current?.focus(); }}
          className="h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label="Toggle search panel"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[720px] bg-popover rounded-lg shadow-lg border border-border">
          <div className="grid grid-cols-3 divide-x divide-border">
            {/* Filters column */}
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 pb-2 mb-1 border-b border-border">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Filters</span>
              </div>
              <Item active={hasFilter('myPipeline')} onClick={() => toggleFilter({ type: 'filter', key: 'myPipeline', label: 'My Pipeline' })}>My Pipeline</Item>
              <Item active={hasFilter('unassigned')} onClick={() => toggleFilter({ type: 'filter', key: 'unassigned', label: 'Unassigned' })}>Unassigned</Item>
              <Item active={hasFilter('open')} onClick={() => toggleFilter({ type: 'filter', key: 'open', label: 'Open Opportunities' })}>Open Opportunities</Item>
              <Item active={hasFilter('unreadMessages')} onClick={() => toggleFilter({ type: 'filter', key: 'unreadMessages', label: 'Unread Messages' })}>Unread Messages</Item>
              <Divider />

              {/* Creation Date submenu */}
              <Item active={hasFilter('creationDate')} onClick={() => setOpenSubmenu(openSubmenu === 'fc' ? null : 'fc')}>
                <span>Creation Date</span>
                <ChevronRight className={cn('h-3 w-3', openSubmenu === 'fc' && 'rotate-90 transition-transform')} />
              </Item>
              {openSubmenu === 'fc' && DATE_OPTIONS.map(d => (
                <Item key={d.id} indent active={hasFilter('creationDate', d.id)} onClick={() => toggleFilter({ type: 'filter', key: 'creationDate', label: `Created: ${d.label}`, value: d.id })}>
                  {d.label}
                </Item>
              ))}

              {/* Closed Date submenu */}
              <Item active={hasFilter('closeDate')} onClick={() => setOpenSubmenu(openSubmenu === 'cd' ? null : 'cd')}>
                <span>Closed Date</span>
                <ChevronRight className={cn('h-3 w-3', openSubmenu === 'cd' && 'rotate-90 transition-transform')} />
              </Item>
              {openSubmenu === 'cd' && DATE_OPTIONS.map(d => (
                <Item key={d.id} indent active={hasFilter('closeDate', d.id)} onClick={() => toggleFilter({ type: 'filter', key: 'closeDate', label: `Closing: ${d.label}`, value: d.id })}>
                  {d.label}
                </Item>
              ))}
              <Divider />

              <Item active={hasFilter('won')} onClick={() => toggleFilter({ type: 'filter', key: 'won', label: 'Won' })}>Won</Item>
              <Item active={hasFilter('ongoing')} onClick={() => toggleFilter({ type: 'filter', key: 'ongoing', label: 'Ongoing' })}>Ongoing</Item>
              <Item active={hasFilter('rotting')} onClick={() => toggleFilter({ type: 'filter', key: 'rotting', label: 'Rotting' })}>Rotting</Item>
              <Item active={hasFilter('lost')} onClick={() => toggleFilter({ type: 'filter', key: 'lost', label: 'Lost' })}>Lost</Item>
              <Divider />
              <Item onClick={() => { setCustomOpen(true); setOpen(false); }}>
                <span className="text-primary">Custom Filter…</span>
              </Item>
            </div>

            {/* Group By column */}
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 pb-2 mb-1 border-b border-border">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Group By</span>
              </div>
              {GROUP_BASE.map(g => (
                <Item
                  key={g.id}
                  active={groupBy === g.id}
                  onClick={() => onGroupByChange(groupBy === g.id ? null : g.id)}
                >
                  {g.label}
                </Item>
              ))}
              <Divider />
              {GROUP_DATES.map(g => (
                <div key={g.id}>
                  <Item active={groupBy?.startsWith(g.id + ':')} onClick={() => setOpenSubmenu(openSubmenu === `g${g.id}` ? null : `g${g.id}`)}>
                    <span>{g.label}</span>
                    <ChevronRight className={cn('h-3 w-3', openSubmenu === `g${g.id}` && 'rotate-90 transition-transform')} />
                  </Item>
                  {openSubmenu === `g${g.id}` && GROUP_PERIODS.map(p => (
                    <Item key={p.id} indent active={groupBy === `${g.id}:${p.id}`}
                      onClick={() => onGroupByChange(groupBy === `${g.id}:${p.id}` ? null : `${g.id}:${p.id}`)}
                    >
                      {p.label}
                    </Item>
                  ))}
                </div>
              ))}
              <Divider />
              <Item sub><span>Properties</span><ChevronRight className="h-3 w-3" /></Item>
              <Item onClick={() => { setCustomOpen(true); setOpen(false); }}>
                <span className="text-primary">Custom Group…</span>
              </Item>
            </div>

            {/* Favorites column */}
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 pb-2 mb-1 border-b border-border">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold">Favorites</span>
              </div>

              {savedSearches.map(s => (
                <div key={s.id} className="flex items-center group">
                  <div className="flex-1">
                    <Item onClick={() => { applyPreset(s.filters); onGroupByChange(s.groupBy); }}>
                      <span className="flex items-center gap-1.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {s.name}
                        {s.isDefault && <span className="text-[10px] text-muted-foreground">(default)</span>}
                      </span>
                    </Item>
                  </div>
                  <button onClick={() => deleteSaved(s.id)} className="px-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {savedSearches.length > 0 && <Divider />}

              <Item onClick={() => applyPreset(presetFollowUp())}>Follow-Up Report</Item>
              <Item onClick={() => applyPreset(presetMonthlyReport())}>Monthly Report</Item>
              <Item onClick={() => applyPreset(presetWeeklyReport())}>Weekly Report</Item>
              <Divider />
              <Item onClick={() => clearAll()}>Default Pipeline</Item>
              <Divider />
              <Item onClick={() => setSaveOpen(o => !o)}>
                <span className="flex items-center gap-1.5"><Plus className="h-3 w-3" /> Save current search</span>
                <ChevronRight className={cn('h-3 w-3', saveOpen && 'rotate-90 transition-transform')} />
              </Item>
              {saveOpen && (
                <SaveSearchInline onSave={handleSaveSearch} onCancel={() => setSaveOpen(false)} />
              )}
            </div>
          </div>
        </div>
      )}

      <CustomFilterDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        onAdd={(chip) => onActiveFiltersChange([...activeFilters, chip])}
      />
    </div>
  );
}

// ---------- Inline save search ----------

function SaveSearchInline({ onSave, onCancel }: { onSave: (name: string, isDefault: boolean, shared: boolean) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [shared, setShared] = useState(false);
  return (
    <div className="px-3 py-2 space-y-2 bg-muted/30 rounded mt-1">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-7 text-xs" />
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <Checkbox checked={isDefault} onCheckedChange={(v) => setIsDefault(v === true)} />
        Use by default
      </label>
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <Checkbox checked={shared} onCheckedChange={(v) => setShared(v === true)} />
        Share with team
      </label>
      <div className="flex items-center justify-end gap-1">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="h-7 text-xs bg-[#875A7B] hover:bg-[#6e4a64] text-white" onClick={() => onSave(name, isDefault, shared)}>Save</Button>
      </div>
    </div>
  );
}

// ---------- Custom filter dialog ----------

function CustomFilterDialog({
  open, onOpenChange, onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (chip: ActiveFilter) => void;
}) {
  const [field, setField] = useState('name');
  const [op, setOp] = useState('contains');
  const [value, setValue] = useState('');

  const add = () => {
    const fieldLabel = FIELDS.find(f => f.id === field)?.label || field;
    const opLabel = OPS.find(o => o.id === op)?.label || op;
    const showValue = op !== 'isSet' && op !== 'isNotSet';
    const label = showValue
      ? `${fieldLabel} ${opLabel} ${value || '""'}`
      : `${fieldLabel} ${opLabel}`;
    onAdd({
      type: 'filter',
      key: 'custom',
      label,
      value: JSON.stringify({ field, op, value }),
    });
    onOpenChange(false);
    setValue('');
  };

  const showValue = op !== 'isSet' && op !== 'isNotSet';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Custom Filter</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Field</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELDS.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Operator</Label>
            <Select value={op} onValueChange={setOp}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPS.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {showValue && (
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Value</Label>
              <Input className="h-8 text-sm" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="bg-[#875A7B] hover:bg-[#6e4a64] text-white" onClick={add}>Add to search</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
