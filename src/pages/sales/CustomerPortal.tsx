import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ShoppingCart, ExternalLink } from 'lucide-react';
import { getQuotations, getSalesOrders } from '@/lib/services/sales/storage';
import { getItem } from '@/lib/storage';
import { format, parseISO } from 'date-fns';

// Simple token validation — tokens stored as { customerId, token } pairs
function validatePortalToken(token: string): string | null {
  const tokens = getItem<{ customerId: string; token: string }[]>('portal_tokens', []);
  const entry = tokens.find(t => t.token === token);
  return entry?.customerId || null;
}

export function generatePortalToken(customerId: string): string {
  const token = crypto.randomUUID();
  const tokens = getItem<{ customerId: string; token: string }[]>('portal_tokens', []);
  const existing = tokens.find(t => t.customerId === customerId);
  if (existing) {
    existing.token = token;
  } else {
    tokens.push({ customerId, token });
  }
  localStorage.setItem('erp_portal_tokens', JSON.stringify(tokens));
  return token;
}

export default function CustomerPortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const customerId = token ? validatePortalToken(token) : null;

  const quotations = useMemo(() =>
    customerId ? getQuotations().filter(q => q.customerId === customerId) : [], [customerId]);
  const orders = useMemo(() =>
    customerId ? getSalesOrders().filter(o => quotations.some(q => q.id === o.quotationId)) : [], [customerId, quotations]);

  if (!token || !customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Invalid or expired portal link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customerName = quotations[0]?.customerName || orders[0]?.customerName || 'Customer';

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Portal</h1>
          <p className="text-muted-foreground">Welcome, {customerName}</p>
        </div>

        {/* Quotations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Quotations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quotations available.</p>
            ) : (
              <div className="space-y-2">
                {quotations.map(q => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/portal/quotation/${q.id}?token=${token}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{q.reference}</span>
                      <Badge variant="outline" className="capitalize text-xs">{q.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">₹{q.total.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-muted-foreground">{format(parseISO(q.quotationDate), 'MMM d, yyyy')}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" /> Sales Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders available.</p>
            ) : (
              <div className="space-y-2">
                {orders.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{o.reference}</span>
                      <Badge variant="outline" className="capitalize text-xs">{o.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">₹{o.total.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-muted-foreground">{format(parseISO(o.orderDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}