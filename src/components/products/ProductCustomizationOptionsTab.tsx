import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useProductCustomizationOptions,
  useSaveProductCustomizationOption,
  useDeleteProductCustomizationOption,
} from '@/hooks/products/customizationOptions';
import type {
  ProductCustomizationOption,
  ProductCustomizationOptionType,
} from '@/lib/data/sales/types';

const OPTION_TYPES: { key: ProductCustomizationOptionType; label: string; placeholder: string }[] = [
  { key: 'size', label: 'Size', placeholder: 'e.g. 6ft x 4ft' },
  { key: 'colour', label: 'Colour', placeholder: 'e.g. Teak Brown' },
  { key: 'fabric', label: 'Fabric', placeholder: 'e.g. Leather Premium' },
  { key: 'polish', label: 'Polish', placeholder: 'e.g. Matte' },
];

export function ProductCustomizationOptionsTab({ productId }: { productId: string }) {
  const { data: options = [], isLoading } = useProductCustomizationOptions(productId);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {OPTION_TYPES.map((t) => (
        <OptionTypeCard
          key={t.key}
          productId={productId}
          type={t.key}
          title={t.label}
          placeholder={t.placeholder}
          options={options.filter((o) => o.optionType === t.key)}
          loading={isLoading}
        />
      ))}
    </div>
  );
}

function OptionTypeCard({
  productId,
  type,
  title,
  placeholder,
  options,
  loading,
}: {
  productId: string;
  type: ProductCustomizationOptionType;
  title: string;
  placeholder: string;
  options: ProductCustomizationOption[];
  loading: boolean;
}) {
  const save = useSaveProductCustomizationOption(productId);
  const del = useDeleteProductCustomizationOption(productId);
  const [draft, setDraft] = useState({ optionValue: '', additionalPrice: 0, sortOrder: 0 });

  async function add() {
    if (!draft.optionValue.trim()) {
      toast.error('Value is required');
      return;
    }
    try {
      await save.mutateAsync({
        productId,
        optionType: type,
        optionValue: draft.optionValue.trim(),
        additionalPrice: Number(draft.additionalPrice) || 0,
        sortOrder: Number(draft.sortOrder) || 0,
        isActive: true,
      });
      setDraft({ optionValue: '', additionalPrice: 0, sortOrder: 0 });
      toast.success(`${title} option added`);
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Save failed');
    }
  }

  async function patch(o: ProductCustomizationOption, fields: Partial<ProductCustomizationOption>) {
    try {
      await save.mutateAsync({ ...o, ...fields });
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Save failed');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : options.length === 0 ? (
          <div className="text-xs text-muted-foreground">No options yet.</div>
        ) : (
          <div className="space-y-2">
            {options.map((o) => (
              <div key={o.id} className="grid grid-cols-[1fr_110px_70px_auto_auto] gap-2 items-center">
                <Input
                  value={o.optionValue}
                  onChange={(e) => patch(o, { optionValue: e.target.value })}
                />
                <Input
                  type="number"
                  value={String(o.additionalPrice)}
                  onChange={(e) => patch(o, { additionalPrice: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  value={String(o.sortOrder)}
                  onChange={(e) => patch(o, { sortOrder: Number(e.target.value) })}
                />
                <Switch
                  checked={o.isActive}
                  onCheckedChange={(v) => patch(o, { isActive: v })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => del.mutate(o.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-3 space-y-2">
          <Label className="text-xs">Add new {title.toLowerCase()}</Label>
          <div className="grid grid-cols-[1fr_110px_70px_auto] gap-2">
            <Input
              placeholder={placeholder}
              value={draft.optionValue}
              onChange={(e) => setDraft((d) => ({ ...d, optionValue: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="₹"
              value={String(draft.additionalPrice)}
              onChange={(e) => setDraft((d) => ({ ...d, additionalPrice: Number(e.target.value) }))}
            />
            <Input
              type="number"
              placeholder="#"
              value={String(draft.sortOrder)}
              onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))}
            />
            <Button size="icon" onClick={add} disabled={save.isPending}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}