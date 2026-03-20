import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ACCOUNTING_NAV } from '@/lib/navigation/accounting';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPayments, createPayment, Payment } from '@/lib/data/accounting';
import { Plus, Search, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function Payments() {
  const [payments, setPayments] = useState(getPayments());
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'inbound' as Payment['type'],
    partnerName: '',
    amount: 0,
    method: 'bank_transfer' as Payment['method'],
    date: new Date().toISOString().split('T')[0],
    reference: '',
  });

  const filteredPayments = payments.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.partnerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!formData.partnerName || formData.amount <= 0) {
      toast.error('Please fill in required fields');
      return;
    }

    createPayment({
      ...formData,
      partnerId: `PART-${Date.now()}`,
      status: 'draft',
    });
    setPayments(getPayments());
    setDialogOpen(false);
    setFormData({
      type: 'inbound',
      partnerName: '',
      amount: 0,
      method: 'bank_transfer',
      date: new Date().toISOString().split('T')[0],
      reference: '',
    });
    toast.success('Payment created');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const inboundTotal = payments.filter(p => p.type === 'inbound').reduce((sum, p) => sum + p.amount, 0);
  const outboundTotal = payments.filter(p => p.type === 'outbound').reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppLayout title="Accounting" subtitle="Payments" moduleNav={ACCOUNTING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Payments</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Received</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(inboundTotal)}</p>
                </div>
                <ArrowDownRight className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid Out</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(outboundTotal)}</p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{payment.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {payment.type === 'inbound' ? (
                          <ArrowDownRight className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-destructive" />
                        )}
                        <span className="capitalize">{payment.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{payment.partnerName}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="capitalize">{payment.method.replace('_', ' ')}</TableCell>
                    <TableCell className={`text-right font-medium ${payment.type === 'inbound' ? 'text-success' : 'text-destructive'}`}>
                      {payment.type === 'inbound' ? '+' : '-'}{formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'reconciled' ? 'default' : payment.status === 'posted' ? 'outline' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Payment</DialogTitle>
            <DialogDescription>
              Record an incoming or outgoing payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as Payment['type'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Receive Payment</SelectItem>
                  <SelectItem value="outbound">Send Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{formData.type === 'inbound' ? 'From Customer' : 'To Vendor'}</Label>
              <Input
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                placeholder=""
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v as Payment['method'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference (Optional)</Label>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder=""
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
