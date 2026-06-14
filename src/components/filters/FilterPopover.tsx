import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import type {
  FieldConfig, FieldOption, FilterGroup, ModuleFilterConfig, Operator,
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
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onAdd: (g: FilterGroup) => void;
}

export function FilterPopover({ config, open, onOpenChange, onAdd }: Props) {
  const [field, setField] = useState<string>('');
  const [op, setOp] = useState<Operator>('is');
  const [value, setValue] = useState<string>('');
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

  const reset = () => { setField(''); setValue(''); setValueB(''); setMultiValue([]); };

  const submit = () => {
    if (!fieldConfig) return;
    let v: FilterGroup['value'];
    if (op === 'is_empty' || op === 'is_not_empty') v = undefined;
    else if (op === 'between') v = { from: value, to: valueB };
    else if (op === 'in' || op === 'not_in') v = multiValue;
    else if (fieldConfig.type === 'numeric') v = Number(value);
    else v = value;
    onAdd({ id: crypto.randomUUID(), field: fieldConfig.key, operator: op, value: v });
    reset();
    onOpenChange?.(false);
  };

  const showValueInput = !['is_empty', 'is_not_empty', 'today', 'this_week', 'this_month'].includes(op);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <Filter className="h-3.5 w-3.5" /> Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-2">
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
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (op === 'in' || op === 'not_in') ? (
                <div className="max-h-40 overflow-y-auto border rounded p-1 space-y-1">
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
                  {options.length === 0 && <div className="text-xs text-muted-foreground p-1">No options. Use free text below.</div>}
                  {options.length === 0 && (
                    <Input className="h-8 text-sm" placeholder="comma,separated"
                      onChange={(e) => setMultiValue(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                  )}
                </div>
              ) : op === 'between' ? (
                <div className="flex items-center gap-2">
                  <Input className="h-8 text-sm" placeholder="from"
                    type={fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'numeric' ? 'number' : 'text'}
                    value={value} onChange={e => setValue(e.target.value)} />
                  <Input className="h-8 text-sm" placeholder="to"
                    type={fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'numeric' ? 'number' : 'text'}
                    value={valueB} onChange={e => setValueB(e.target.value)} />
                </div>
              ) : op === 'last_n_days' ? (
                <Input className="h-8 text-sm" type="number" placeholder="7" value={value} onChange={e => setValue(e.target.value)} />
              ) : (
                <Input
                  className="h-8 text-sm"
                  type={fieldConfig.type === 'date' ? 'date' : fieldConfig.type === 'numeric' ? 'number' : 'text'}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { reset(); onOpenChange?.(false); }}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs" disabled={!fieldConfig} onClick={submit}>Add</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
