import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useReturnsForInvoice } from '@/hooks/returns';
import { RT_STATUS_LABEL } from '@/lib/services/returns';

export function InvoiceReturnsSection({ invoiceId }: { invoiceId: string }) {
  const navigate = useNavigate();
  const { data: returns = [] } = useReturnsForInvoice(invoiceId);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Returns</CardTitle>
        <Button size="sm" variant="outline" onClick={() => navigate(`/returns/new?invoice=${invoiceId}`)}>
          Create Return Request
        </Button>
      </CardHeader>
      <CardContent>
        {returns.length === 0 ? (
          <div className="text-sm text-muted-foreground">No returns linked to this invoice.</div>
        ) : (
          <div className="text-sm divide-y">
            {returns.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/returns/${r.id}`)}
                className="w-full flex items-center justify-between py-2 hover:bg-muted/40 px-1"
              >
                <div className="text-left">
                  <div className="font-medium">{r.rt_number}</div>
                  <div className="text-xs text-muted-foreground">
                    {(r.items?.length ?? 0)} item(s) · {format(parseISO(r.requested_at), 'd MMM yyyy')}
                  </div>
                </div>
                <Badge variant="outline">{RT_STATUS_LABEL[r.request_status]}</Badge>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}