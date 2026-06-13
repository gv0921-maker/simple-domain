import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listProductCustomizationOptions,
  saveProductCustomizationOption,
  deleteProductCustomizationOption,
} from '@/lib/services/products/customizationOptions';

const key = (productId: string) => ['product-customization-options', productId] as const;

export function useProductCustomizationOptions(productId: string | undefined) {
  return useQuery({
    queryKey: key(productId ?? ''),
    queryFn: () => listProductCustomizationOptions(productId!),
    enabled: !!productId,
  });
}

export function useSaveProductCustomizationOption(productId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveProductCustomizationOption,
    onSuccess: () => {
      if (productId) qc.invalidateQueries({ queryKey: key(productId) });
    },
  });
}

export function useDeleteProductCustomizationOption(productId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProductCustomizationOption,
    onSuccess: () => {
      if (productId) qc.invalidateQueries({ queryKey: key(productId) });
    },
  });
}