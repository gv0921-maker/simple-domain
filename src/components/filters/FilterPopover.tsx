import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
  FieldConfig, FieldOption, FilterGroup, FilterState,
  ModuleFilterConfig, Operator, PredefinedFilter, PredefinedFilterSection,
} from '@/lib/filters/types';

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

interface Props {
  config: ModuleFilterConfig;
  value: FilterState;
  onChange: (s: FilterState) => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

function filterIds(f: PredefinedFilter): string[] {
  return f.group ? [f.group.id] : (f.groups ?? []).map(g => g.id);
}
function sectionIds(s: PredefinedFilterSection): string[] {
  return s.filters.flatMap(filterIds);
}

export function FilterPopover({ config, value, onChange, open, onOpenChange }: Props) {
  const [field, setField] = useState<string>('');
  const [op, setOp] = useState<Operator>('is');
  const [valueA, setValueA] = useState<string>('');
  const [valueB, setValueB] = useState<string>('');
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [customOpen, setCustomOpen] = useState(false);

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

  const predefined = config.predefinedFilters ?? [];
  const activeCount = value.groups.length;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <Filter className="h-3.5 w-3.5" /> Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{activeCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="max-h-[70vh] overflow-y-auto">
          {/* Predefined sections */}
          {predefined.length > 0 && (
            <div className="p-2 space-y-3">
              {predefined.map(section => (
                <div key={section.id}>
                  <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.label}
                  </div>
                  <div className="space-y-0.5">
                    {section.filters.map(f => {
                      const checked = isFilterActive(f);
                      return (
                        <label
                          key={f.id}
                          className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-muted/60 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleFilter(section, f)}
                          />
                          <span className={checked ? 'font-medium' : ''}>{f.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add custom filter expander */}
          <div className="border-t">
            <button
              type="button"
              onClick={() => setCustomOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-muted/60"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add custom filter
              </span>
              {customOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {customOpen && (
              <div className="p-3 space-y-2 border-t bg-muted/20">
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
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
