import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, FileText, ShoppingCart, Receipt, User, Package, Wrench, Truck, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchResourcePreview, resolveResourceLink, type ResourceType } from '@/lib/services/chat/api';

const ICONS: Record<ResourceType, React.ComponentType<{ className?: string }>> = {
  sales_order: ShoppingCart,
  quotation: FileText,
  invoice: Receipt,
  customer: User,
  product: Package,
  work_order: Wrench,
  purchase_order: Truck,
  employee: Briefcase,
};

const LABELS: Record<ResourceType, string> = {
  sales_order: 'Sales Order',
  quotation: 'Quotation',
  invoice: 'Invoice',
  customer: 'Customer',
  product: 'Product',
  work_order: 'Work Order',
  purchase_order: 'Purchase Order',
  employee: 'Employee',
};

export function ResourceCard({
  resourceType, resourceId, fallbackLabel,
}: { resourceType: ResourceType; resourceId: string; fallbackLabel?: string | null }) {
  const navigate = useNavigate();
  const Icon = ICONS[resourceType] ?? FileText;
  const { data, isLoading } = useQuery({
    queryKey: ['chat-resource', resourceType, resourceId],
    queryFn: () => fetchResourcePreview(resourceType, resourceId),
    enabled: resourceType !== 'purchase_order',
    staleTime: 60_000,
  });

  const label = data?.label ?? fallbackLabel ?? LABELS[resourceType];

  return (
    <div className="mt-2 rounded-md border bg-background/60 p-3 max-w-md">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {LABELS[resourceType]}
          </div>
          <div className="font-medium text-sm truncate">{label}</div>
          {data?.subtitle && (
            <div className="text-xs text-muted-foreground truncate">{data.subtitle}</div>
          )}
          {data?.status && (
            <Badge variant="secondary" className="mt-1 text-[10px]">{data.status}</Badge>
          )}
          {isLoading && <div className="text-xs text-muted-foreground">Loading…</div>}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(resolveResourceLink(resourceType, resourceId))}
        >
          <ExternalLink className="h-3 w-3 mr-1" /> Open
        </Button>
      </div>
    </div>
  );
}