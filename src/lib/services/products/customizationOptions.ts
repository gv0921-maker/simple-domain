import { supabase } from '@/integrations/supabase/client';
import type {
  ProductCustomizationOption,
  ProductCustomizationOptionType,
} from '@/lib/data/sales/types';

function mapRow(r: any): ProductCustomizationOption {
  return {
    id: r.id,
    productId: r.product_id,
    optionType: r.option_type as ProductCustomizationOptionType,
    optionValue: r.option_value,
    additionalPrice: Number(r.additional_price ?? 0),
    isActive: !!r.is_active,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export async function listProductCustomizationOptions(
  productId: string,
): Promise<ProductCustomizationOption[]> {
  const { data, error } = await supabase
    .from('product_customization_options' as any)
    .select('*')
    .eq('product_id', productId)
    .order('option_type', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function saveProductCustomizationOption(
  input: Partial<ProductCustomizationOption> & {
    productId: string;
    optionType: ProductCustomizationOptionType;
    optionValue: string;
  },
): Promise<ProductCustomizationOption> {
  const payload: any = {
    product_id: input.productId,
    option_type: input.optionType,
    option_value: input.optionValue,
    additional_price: input.additionalPrice ?? 0,
    is_active: input.isActive ?? true,
    sort_order: input.sortOrder ?? 0,
  };
  if (input.id) {
    const { data, error } = await supabase
      .from('product_customization_options' as any)
      .update(payload)
      .eq('id', input.id)
      .select('*')
      .single();
    if (error) throw error;
    return mapRow(data);
  }
  const { data, error } = await supabase
    .from('product_customization_options' as any)
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteProductCustomizationOption(id: string): Promise<void> {
  const { error } = await supabase
    .from('product_customization_options' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}