import { useQCByProduct } from '@/hooks/qc';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const STATUS: Record<string, { label: string; className: string; icon: any }> = {
  passed: { label: 'Passed', className: 'bg-success/15 text-success border-success', icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'bg-destructive/15 text-destructive border-destructive', icon: XCircle },
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground', icon: Clock },
};

interface Props {
  productId: string;
}

export function QCHistoryList({ productId }: Props) {
  const { data: records = [], isLoading } = useQCByProduct(productId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading QC history…</div>;
  }
  if (records.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center border rounded">
        No QC records yet for this product.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map(r => {
        const cfg = STATUS[r.qcStatus] ?? STATUS.pending;
        const Icon = cfg.icon;
        return (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cfg.className}>
                    <Icon className="h-3 w-3 mr-1" />
                    {cfg.label}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {r.referenceType.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Received {r.receivedQuantity} / {r.expectedQuantity}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(r.qcAt ?? r.createdAt), 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
              {r.qcImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {r.qcImages.map(url => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="h-20 w-20 rounded border overflow-hidden block"
                    >
                      <img src={url} alt="QC" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              {r.serialNumbersScanned.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Serials: </span>
                  {r.serialNumbersScanned.join(', ')}
                </div>
              )}
              {r.lotNumbersScanned.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Lots: </span>
                  {r.lotNumbersScanned.join(', ')}
                </div>
              )}
              {r.qcNotes && (
                <p className="text-sm text-foreground/80">{r.qcNotes}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}