import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PHONE_PREFIXES, validatePhone, splitPhone } from '@/lib/services/sales';

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (full: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export function PhoneInput({ label, value, onChange, required, disabled, id }: PhoneInputProps) {
  const initial = splitPhone(value || '+91 ');
  const [prefix, setPrefix] = useState(initial.prefix);
  const [number, setNumber] = useState(initial.number);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const next = splitPhone(value || '');
    setPrefix(next.prefix);
    setNumber(next.number);
  }, [value]);

  const composed = `${prefix} ${number}`.trim();
  const isInvalid = touched && number.length > 0 && !validatePhone(composed);

  const update = (p: string, n: string) => {
    setPrefix(p);
    setNumber(n);
    onChange(`${p} ${n}`.trim());
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-2">
        <Select value={prefix} onValueChange={(v) => update(v, number)} disabled={disabled}>
          <SelectTrigger className="w-28 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHONE_PREFIXES.map((p) => (
              <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          inputMode="tel"
          value={number}
          onChange={(e) => update(prefix, e.target.value.replace(/[^\d]/g, ''))}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          placeholder=""
          className={cn(isInvalid && 'border-destructive focus-visible:ring-destructive')}
        />
      </div>
      {isInvalid && <p className="text-xs text-destructive">Enter a valid phone number (10–12 digits)</p>}
    </div>
  );
}