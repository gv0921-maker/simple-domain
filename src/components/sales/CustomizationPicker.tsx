import { useMemo, useRef, useState } from 'react';
import { useProductCustomizationOptions } from '@/hooks/products/customizationOptions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  ProductCustomizationOption,
  ProductCustomizationOptionType,
} from '@/lib/data/sales/types';

export interface CustomizationValue {
  size?: string;
  colour?: string;
  fabric?: string;
  polish?: string;
  notes?: string;
  referenceImages?: string[];
  /** Sum of additionalPrice from chosen predefined options. */
  priceAdjustment?: number;
}

interface Props {
  productId?: string;
  value: CustomizationValue;
  onChange: (next: CustomizationValue) => void;
  disabled?: boolean;
}

const TYPES: { key: keyof CustomizationValue; type: ProductCustomizationOptionType; label: string }[] = [
  { key: 'size', type: 'size', label: 'Size' },
  { key: 'colour', type: 'colour', label: 'Colour' },
  { key: 'fabric', type: 'fabric', label: 'Fabric' },
  { key: 'polish', type: 'polish', label: 'Polish' },
];

const CUSTOM_SENTINEL = '__custom__';
const BUCKET = 'sales-order-images';

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0);

export function CustomizationPicker({ productId, value, onChange, disabled }: Props) {
  const { data: options = [] } = useProductCustomizationOptions(productId);
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const grouped = useMemo(() => {
    const m = new Map<ProductCustomizationOptionType, ProductCustomizationOption[]>();
    for (const o of options) {
      if (!o.isActive) continue;
      const arr = m.get(o.optionType) ?? [];
      arr.push(o);
      m.set(o.optionType, arr);
    }
    return m;
  }, [options]);

  const recomputeAdjustment = (next: CustomizationValue): number => {
    let total = 0;
    for (const { key, type } of TYPES) {
      const v = next[key] as string | undefined;
      const match = (grouped.get(type) ?? []).find((o) => o.optionValue === v);
      if (match) total += match.additionalPrice || 0;
    }
    return total;
  };

  const updateField = (key: keyof CustomizationValue, newValue: string | undefined) => {
    const next: CustomizationValue = { ...value, [key]: newValue };
    next.priceAdjustment = recomputeAdjustment(next);
    onChange(next);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls: string[] = [...(value.referenceImages ?? [])];
    try {
      for (const file of Array.from(files)) {
        const path = `${productId ?? 'misc'}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (data?.publicUrl) urls.push(data.publicUrl);
      }
      onChange({ ...value, referenceImages: urls });
    } catch (e: any) {
      toast({
        title: 'Upload failed',
        description: e?.message ?? 'Ensure the "sales-order-images" Storage bucket exists and is public.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (url: string) => {
    onChange({ ...value, referenceImages: (value.referenceImages ?? []).filter((u) => u !== url) });
  };

  return (
    <div className="space-y-3 rounded-md border border-dashed border-border p-3 bg-muted/20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {TYPES.map(({ key, type, label }) => {
          const opts = grouped.get(type) ?? [];
          const current = (value[key] as string | undefined) ?? '';
          const isCustom =
            !!current && !opts.some((o) => o.optionValue === current);
          const selectValue = isCustom ? CUSTOM_SENTINEL : (current || '');
          return (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              {opts.length > 0 ? (
                <Select
                  value={selectValue || undefined}
                  onValueChange={(v) => updateField(key, v === CUSTOM_SENTINEL ? '' : v)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {opts.map((o) => (
                      <SelectItem key={o.id} value={o.optionValue}>
                        {o.optionValue}
                        {o.additionalPrice > 0 && ` (+₹${fmtPrice(o.additionalPrice)})`}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_SENTINEL}>Custom…</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {(opts.length === 0 || isCustom) && (
                <Input
                  className="h-8 text-xs"
                  value={current}
                  onChange={(e) => updateField(key, e.target.value)}
                  disabled={disabled}
                  placeholder=""
                />
              )}
            </div>
          );
        })}
      </div>

      {(value.priceAdjustment ?? 0) > 0 && (
        <div className="text-xs text-muted-foreground">
          Customization adjustment: <span className="font-medium text-foreground">+₹{fmtPrice(value.priceAdjustment ?? 0)}</span>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Customization Notes</Label>
        <Textarea
          rows={2}
          value={value.notes ?? ''}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          disabled={disabled}
          className="text-xs min-h-[48px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Reference Images</Label>
        <div className="flex flex-wrap items-center gap-2">
          {(value.referenceImages ?? []).map((url) => (
            <div key={url} className="relative group">
              <img src={url} alt="ref" className="h-14 w-14 object-cover rounded border" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-14 w-14 flex-col text-[10px] gap-0.5"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <ImageIcon className="h-4 w-4 animate-pulse" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{uploading ? 'Uploading' : 'Upload'}</span>
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>
    </div>
  );
}