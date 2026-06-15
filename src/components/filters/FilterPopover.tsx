import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronRight, ChevronDown, Check, Filter, Group as GroupIcon, Star, Trash2, Plus,
} from 'lucide-react';
import type {
  FieldConfig, FieldOption, FilterGroup, FilterState,
  ModuleFilterConfig, Operator, PredefinedFilter, PredefinedFilterSection,
} from '@/lib/filters/types';
import type { SavedFilter } from '@/lib/services/savedFilters';

const operatorsFor: Record<FieldConfig['type'], Operator[]> = {
  text: ['contains', 'starts_with', 'is', 'is_not', 'is_empty', 'is_not_empty'],
  numeric: ['is', 'gt', 'lt', 'gte', 'lte', 'between', 'is_empty'],
  date: ['today', 'this_week', 'this_month', 'last_n_days', 'before', 'after', 'is_empty'],
  choice: ['is', 'is_not', 'in', 'not_in', 'is_empty'],
  multi_choice: ['in', 'not_in', 'is_empty'],
  boolean: ['is'],
};

const opLabel: Record<Operator, string> = {
  is: 'is', is_not: 'is not', contains: 'contains', starts_with: 'starts with',
  in: 'is any of', not_in: 'is none of', gt: '>', lt: '<', gte: '>=', lte: '<=',
  between: 'between', is_empty: 'is empty', is_not_empty: 'is not empty',
  today: 'today', this_week: 'this week', this_month: 'this month',
  last_n_days: 'last N days', before: 'before', after: 'after',
};

function filterIds(f: PredefinedFilter): string[] {
  return f.group ? [f.group.id] : (f.groups ?? []).map(g => g.id);
}
function sectionIds(s: PredefinedFilterSection): string[] {
  return s.filters.flatMap(filterIds);
}

// ============================================================================
// FILTERS COLUMN
// ============================================================================

const DATE_QUICK_OPTIONS: { id: string; label: string; build: (field: string) => FilterGroup }[] = [
  { id: 'today', label: 'Today',
    build: f => ({ id: `date_${f}_today`, field: f, operator: 'today' }) },
  { id: 'this_week', label: 'This Week',
    build: f => ({ id: `date_${f}_week`, field: f, operator: 'this_week' }) },
  { id: 'this_month', label: 'This Month',
    build: f => ({ id: `date_${f}_month`, field: f, operator: 'this_month' }) },
  { id: 'last_7', label: 'Last 7 Days',
    build: f => ({ id: `date_${f}_l7`, field: f, operator: 'last_n_days', value: 7 }) },
  { id: 'last_30', label: 'Last 30 Days',
    build: f => ({ id: `date_${f}_l30`, field: f, operator: 'last_n_days', value: 30 }) },
];

interface FiltersColumnProps {
  config: ModuleFilterConfig;
  value: FilterState;
  onChange: (s: FilterState) => void;
}

export function FiltersColumn({ config, value, onChange }: FiltersColumnProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [customOpen, setCustomOpen] = useState(false);

  const isFilterActive = (f: PredefinedFilter): boolean => {
    const ids = filterIds(f);
    return ids.length > 0 && ids.every(id => value.groups.some(g => g.id === id));
  };

  const toggleFilter = (section: PredefinedFilterSection, f: PredefinedFilter) => {
    const ids = filterIds(f);
    const active = isFilterActive(f);
    let next = [...value.groups];
    if (active) {
      next = next.filter(g => !ids.includes(g.id));
    } else {
      if (section.multiSelect === false) {
        const sIds = sectionIds(section);
        next = next.filter(g => !sIds.includes(g.id));
      }
      const toAdd = f.group ? [f.group] : (f.groups ?? []);
      next = [...next, ...toAdd];
    }
    onChange({ ...value, groups: next });
  };

  const dateFields = useMemo(
    () => config.fields.filter(f => f.type === 'date'),
    [config],
  );

  const applyDateQuick = (field: string, optId: string) => {
    const opt = DATE_QUICK_OPTIONS.find(o => o.id === optId);
    if (!opt) return;
    const built = opt.build(field);
    const existing = value.groups.find(g => g.id === built.id);
    const cleanedOther = value.groups.filter(g => !g.id.startsWith(`date_${field}_`));
    onChange({
      ...value,
      groups: existing ? cleanedOther : [...cleanedOther, built],
    });
  };

  const activeDateOption = (field: string): string | null => {
    const g = value.groups.find(x => x.id.startsWith(`date_${field}_`));
    if (!g) return null;
    return g.id.replace(`date_${field}_`, '');
  };

  const predefined = config.predefinedFilters ?? [];

  return (
    <div className="flex flex-col min-w-0">
      <div className="px-3 py-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b">
        <Filter className="h-3.5 w-3.5" /> Filters
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {predefined.map(section => (
          <div key={section.id} className="mb-1">
            {section.label && (
              <div className="px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                {section.label}
              </div>
            )}
            {section.filters.map(f => {
              const checked = isFilterActive(f);
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => toggleFilter(section, f)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-muted/60 ${
                    checked ? 'bg-muted font-medium' : ''
                  }`}
                >
                  <span className="w-4 inline-flex justify-center">
                    {checked && <Check className="h-3.5 w-3.5 text-primary" />}
                  </span>
                  <span className="truncate">{f.label}</span>
                </button>
              );
            })}
          </div>
        ))}

        {dateFields.length > 0 && (
          <div className="border-t mt-1 pt-1">
            {dateFields.map(df => {
              const isOpen = expanded[df.key];
              const active = activeDateOption(df.key);
              return (
                <div key={df.key}>
                  <button
                    type="button"
                    onClick={() => setExpanded(e => ({ ...e, [df.key]: !e[df.key] }))}
                    className={`w-full flex items-center gap-1 px-2 py-1.5 rounded text-sm hover:bg-muted/60 ${
                      active ? 'font-medium' : ''
                    }`}
                  >
                    {isOpen
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="truncate">{df.label}</span>
                    {active && (
                      <span className="ml-auto text-[10px] text-primary">
                        {DATE_QUICK_OPTIONS.find(o => o.id === active)?.label}
                      </span>
                    )}
                  </button>
                  {isOpen && (
                    <div className="ml-5 pb-1">
                      {DATE_QUICK_OPTIONS.map(opt => {
                        const isActive = active === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => applyDateQuick(df.key, opt.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left hover:bg-muted/60 ${
                              isActive ? 'bg-muted font-medium' : ''
                            }`}
                          >
                            <span className="w-3 inline-flex justify-center">
                              {isActive && <Check className="h-3 w-3 text-primary" />}
                            </span>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t mt-1 pt-1">
          <button
            type="button"
            onClick={() => setCustomOpen(o => !o)}
            className="w-full flex items-center gap-1 px-2 py-1.5 rounded text-sm hover:bg-muted/60"
          >
            {customOpen
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Custom Filter</span>
          </button>
          {customOpen && <CustomFilterBuilder config={config} value={value} onChange={onChange} />}
        </div>
      </div>
    </div>
  );
}

function CustomFilterBuilder({ config, value, onChange }: FiltersColumnProps) {
  const [field, setField] = useState<string>('');
  const [op, setOp] = useState<Operator>('is');
  const [valueA, setValueA] = useState<string>('');
  const [valueB, setValueB] = useState<string>('');
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const [options, setOptions] = useState<FieldOption[]>([]);

  const fieldConfig = useMemo(() => config.fields.find(f => f.key === field), [config, field]);
  const ops = fieldConfig ? operatorsFor[fieldConfig.type] : [];

  useEffect(() => {
    if (!fieldConfig) { setOptions([]); return; }
    if (fieldConfig.options) { setOptions(fieldConfig.options); return; }
    if (fieldConfig.loadOptions) {
      Promise.resolve(fieldConfig.loadOptions()).then(setOptions).catch(() => setOptions([]));
    } else {
      setOptions([]);
    }
  }, [fieldConfig]);

  useEffect(() => {
    if (fieldConfig && !ops.includes(op)) setOp(ops[0] ?? 'is');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field]);

  const reset = () => { setField(''); setValueA(''); setValueB(''); setMultiValue([]); };

  const addCustom = () => {
    if (!fieldConfig) return;
    let v: FilterGroup['value'];
    if (op === 'is_empty' || op === 'is_not_empty') v = undefined;
    else if (op === 'between') v = { from: valueA, to: valueB };
    else if (op === 'in' || op === 'not_in') v = multiValue;
    else if (fieldConfig.type === 'numeric') v = Number(valueA);
    else v = valueA;
    onChange({
      ...value,
      groups: [
        ...value.groups,
        { id: crypto.randomUUID(), field: fieldConfig.key, operator: op, value: v },
      ],
    });
    reset();
  };

  const showValueInput = !['is_empty', 'is_not_empty', 'today', 'this_week', 'this_month'].includes(op);

  return (
    <div className="p-2 space-y-2 ml-5 border-l">
      <div className="grid gap-1">
                  <Label className="text-xs">Field</Label>
                  <Select value={field} onValueChange={setField}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Choose a field" /></SelectTrigger>
                    <SelectContent>
                      {config.fields.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {fieldConfig && (
                  <div className="grid gap-1">
                    <Label className="text-xs">Operator</Label>
                    <Select value={op} onValueChange={(v) => setOp(v as Operator)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ops.map(o => <SelectItem key={o} value={o}>{opLabel[o]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {fieldConfig && showValueInput && (
                  <div className="grid gap-1">
                    <Label className="text-xs">Value</Label>
                    {(fieldConfig.type === 'choice' && op !== 'in' && op !== 'not_in') ? (
                      <Select value={valueA} onValueChange={setValueA}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Pick…" /></SelectTrigger>
                        <SelectContent>
                          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (op === 'in' || op === 'not_in') ? (
                      <div className="max-h-40 overflow-y-auto border rounded p-1 space-y-1 bg-background">
                        {options.map(o => {
                          const checked = multiValue.includes(o.value);
                          return (
                            <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => setMultiValue(prev => e.target.checked
                                  ? [...prev, o.value] : prev.filter(v => v !== o.value))}
                              />
                              {o.label}
                            </label>
                          );
                        })}
                        {options.length === 0 && (
                          <Input className="h-8 text-sm" placeholder="comma,separated"
                            onChange={(e) => setMultiValue(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                        )}
                      </div>
                    ) : op === 'between' ? (
                      <div className="flex items-center gap-2">
                        <Input className="h-8 text-sm" placeholder="from"
                          type={fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'numeric' ? 'number' : 'text'}
                          value={valueA} onChange={e => setValueA(e.target.value)} />
                        <Input className="h-8 text-sm" placeholder="to"
                          type={fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'numeric' ? 'number' : 'text'}
                          value={valueB} onChange={e => setValueB(e.target.value)} />
                      </div>
                    ) : op === 'last_n_days' ? (
                      <Input className="h-8 text-sm" type="number" placeholder="7" value={valueA} onChange={e => setValueA(e.target.value)} />
                    ) : (
                      <Input
                        className="h-8 text-sm"
                        type={fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'numeric' ? 'number' : 'text'}
                        value={valueA}
                        onChange={e => setValueA(e.target.value)}
                      />
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" className="h-7 text-xs" disabled={!fieldConfig} onClick={addCustom}>
                    Add filter
                  </Button>
                </div>
    </div>
  );
}

// ============================================================================
// GROUP BY COLUMN
// ============================================================================

interface GroupByColumnProps {
  config: ModuleFilterConfig;
  fieldLabel: (k: string) => string;
  chain: string[];
  onChange: (chain: string[]) => void;
}

export function GroupByColumn({ config, fieldLabel, chain, onChange }: GroupByColumnProps) {
  const fields = config.groupByFields ?? [];
  const toggle = (k: string) => {
    if (chain.includes(k)) onChange(chain.filter(x => x !== k));
    else onChange([...chain, k]);
  };
  return (
    <div className="flex flex-col min-w-0">
      <div className="px-3 py-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b">
        <GroupIcon className="h-3.5 w-3.5" /> Group By
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {fields.length === 0 && (
          <div className="px-2 py-2 text-xs text-muted-foreground">No group-by fields available.</div>
        )}
        {fields.map(k => {
          const active = chain.includes(k);
          const order = chain.indexOf(k) + 1;
          return (
            <button
              type="button"
              key={k}
              onClick={() => toggle(k)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-muted/60 ${
                active ? 'bg-muted font-medium' : ''
              }`}
            >
              <span className="w-4 inline-flex justify-center">
                {active
                  ? <span className="text-[10px] text-primary font-semibold">{order}</span>
                  : null}
              </span>
              <span className="truncate">{fieldLabel(k)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// FAVORITES COLUMN
// ============================================================================

interface FavoritesColumnProps {
  saved: SavedFilter[];
  isSuperAdmin: boolean;
  onApply: (state: FilterState) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (args: { name: string; isDefault: boolean; isSystemDefault: boolean }) => void;
}

export function FavoritesColumn({
  saved, isSuperAdmin, onApply, onSetDefault, onDelete, onSave,
}: FavoritesColumnProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), isDefault, isSystemDefault: isShared });
    setName(''); setIsDefault(false); setIsShared(false); setOpen(false);
  };

  return (
    <div className="flex flex-col min-w-0">
      <div className="px-3 py-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-b">
        <Star className="h-3.5 w-3.5" /> Favorites
      </div>
      <div className="flex-1 overflow-y-auto p-1">
        {saved.length === 0 && (
          <div className="px-2 py-2 text-xs text-muted-foreground">No saved searches.</div>
        )}
        {saved.map(f => (
          <div
            key={f.id}
            className="flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-muted/60 group"
          >
            <button
              type="button"
              className="flex-1 text-left truncate flex items-center gap-1.5"
              onClick={() => onApply(f.filter_state)}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  f.is_default || f.is_system_default
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/40'
                }`}
              />
              <span className="truncate">{f.name}</span>
              {f.is_system_default && (
                <span className="text-[10px] text-muted-foreground">(shared)</span>
              )}
            </button>
            <button
              type="button"
              title="Set as default"
              className="p-1 opacity-0 group-hover:opacity-100 hover:text-amber-500"
              onClick={() => onSetDefault(f.id)}
            >
              <Star className={`h-3 w-3 ${f.is_default ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <button
              type="button"
              title="Delete"
              className="p-1 opacity-0 group-hover:opacity-100 hover:text-destructive"
              onClick={() => onDelete(f.id)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        <div className="border-t mt-1 pt-1">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center gap-1 px-2 py-1.5 rounded text-sm hover:bg-muted/60"
          >
            {open
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Save current search</span>
          </button>
          {open && (
            <div className="p-2 ml-5 border-l space-y-2">
              <Input
                className="h-8 text-sm"
                placeholder="Search name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={isDefault} onCheckedChange={c => setIsDefault(!!c)} />
                Default filter
              </label>
              {isSuperAdmin && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={isShared} onCheckedChange={c => setIsShared(!!c)} />
                  Shared with everyone
                </label>
              )}
              <div className="flex justify-end">
                <Button size="sm" className="h-7 text-xs" disabled={!name.trim()} onClick={submit}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
