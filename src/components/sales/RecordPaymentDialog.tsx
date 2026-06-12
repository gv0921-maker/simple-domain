import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { salesKeys } from '@/hooks/sales/keys';
import { logStatusChange } from '@/lib/services/activityLog';

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  customerId?: string | null;
  defaultAmount: number;
  onSuccess?: () => void;
}

export function RecordPaymentDialog({
  open, onOpenChange, orderId, customerId, defaultAmount, onSuccess,
}: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState(defaultAmount);
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount);
      setMethod('cash');
      setReference('');
      setPaymentDate(today);
      setNotes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultAmount]);

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error: pErr } = await supabase.from('payments').insert({
        sales_order_id: orderId,
        customer_id: customerId ?? null,
        amount,
        payment_date: paymentDate,
        method,
        reference: reference || null,
        notes: notes || null,
      });
      if (pErr) throw pErr;

      const { error: oErr } = await supabase.from('sales_orders').update({
        status: 'paid',
        paid_amount: amount,
        payment_date: paymentDate,
        payment_method: method,
        payment_reference: reference || null,
      } as any).eq('id', orderId);
      if (oErr) throw oErr;

      try {
        await logStatusChange('sales_order', orderId, 'confirmed', 'paid');
      } catch { /* ignore */ }

      qc.invalidateQueries({ queryKey: salesKeys.order(orderId) });
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'order-rich', orderId] });
      qc.invalidateQueries({ queryKey: salesKeys.orders() });
      qc.invalidateQueries({ queryKey: [...salesKeys.all, 'orders-rich'] });

      toast({ title: 'Payment recorded successfully' });
      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast({
        title: 'Failed to record payment',
        description: e?.message ?? String(e),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record customer payment for this sales order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Amount (₹) *</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label>Payment Method *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Payment Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder=""
            />
          </div>
          <div className="space-y-1">
            <Label>Payment Date *</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder=""
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Recording…' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}