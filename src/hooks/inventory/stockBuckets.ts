import { useQuery } from '@tanstack/react-query';
import * as sb from '@/lib/services/inventory/stockBuckets';

export const stockBucketKeys = {
  summary: (productIds?: string[]) => ['stockSummary', productIds ?? null] as const,
  productBuckets: (productId: string) => ['productStockBuckets', productId] as const,
  serialsInBucket: (productId: string, bucket: string) =>
    ['serialsInBucket', productId, bucket] as const,
};

export const useStockSummary = (productIds?: string[]) =>
  useQuery({
    queryKey: stockBucketKeys.summary(productIds),
    queryFn: () => sb.getStockSummary(productIds),
  });

export const useProductStockBuckets = (productId: string | undefined) =>
  useQuery({
    queryKey: productId ? stockBucketKeys.productBuckets(productId) : ['noop'],
    queryFn: () => sb.getProductStockBuckets(productId!),
    enabled: !!productId,
  });

export const useSerialsInBucket = (productId: string | undefined, bucket: sb.StockBucket | undefined) =>
  useQuery({
    queryKey: productId && bucket ? stockBucketKeys.serialsInBucket(productId, bucket) : ['noop'],
    queryFn: () => sb.getSerialsInBucket(productId!, bucket!),
    enabled: !!productId && !!bucket,
  });
