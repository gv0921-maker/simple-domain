import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  usePaymentAccounts, useSavePaymentAccount, useDeletePaymentAccount,
} from '@/hooks/sales/payments';
import type { PaymentAccount } from '@/lib/services/sales/payments';

export default function PaymentAccountsSettings() {
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.role === 'super_admin';
  const { toast } = useToast();
  const { data: accounts = [] } = usePaymentAccounts(false);
  const saveMut = useSavePaymentAccount();
  const deleteMut = useDeletePaymentAccount();

  const [editing, setEditing] = useState<Partial<PaymentAccount> | null>(null);

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const handleToggleActive = async (a: PaymentAccount) => {
    try {
      await saveMut.mutateAsync({ ...a, is_active: !a.is_active });
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment account?')) return;
    try { await deleteMut.mutateAsync(id); toast({ title: 'Deleted' }); }
    catch (e: any) { toast({ title: 'Failed', description: e?.message ?? String(e), variant: 'destructive' }); }
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Payment Accounts</h1>
            <p className="text-sm text-muted-foreground">Cash and bank accounts that receive payments.</p>
          </div>
          <Button onClick={() => setEditing({ account_type: 'cash', is_active: true, display_order: accounts.length })}>
            <Plus className="h-4 w-4 mr-2" />Add Account
          </Button>
        </div>

        <Card className="divide-y">
          {accounts.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No accounts yet.</div>
          )}
          {accounts.map((a) => (
            <div key={a.id} className="p-4 flex items-center gap-4">
              <Badge variant="outline" className="font-normal">
                {a.account_type === 'cash' ? 'Cash' : 'Bank'}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{a.account_name}</div>
                <div className="text-xs text-muted-foreground">
                  {a.bank_name ? `${a.bank_name}${a.account_number_last4 ? ` · ****${a.account_number_last4}` : ''}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Active</Label>
                <Switch checked={a.is_active} onCheckedChange={() => handleToggleActive(a)} />
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </Card>
      </div>

      <AccountDialog
        value={editing}
        onClose={() => setEditing(null)}
        onSave={async (v) => {
          try {
            await saveMut.mutateAsync(v as any);
            toast({ title: 'Saved' });
            setEditing(null);
          } catch (e: any) {
            toast({ title: 'Failed', description: e?.message ?? String(e), variant: 'destructive' });
          }
        }}
      />
    </AppLayout>
  );
}

function AccountDialog({ value, onClose, onSave }: {
  value: Partial<PaymentAccount> | null;
  onClose: () => void;
  onSave: (v: Partial<PaymentAccount>) => void;
}) {
  const [form, setForm] = useState<Partial<PaymentAccount>>({});

  useEffect(() => { if (value) setForm(value); }, [value]);

  if (!value) return null;
  const isBank = form.account_type === 'bank';

  return (
    <Dialog open={!!value} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Edit' : 'Add'} Payment Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Account Name *</Label>
            <Input value={form.account_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Type *</Label>
            <Select value={form.account_type ?? 'cash'} onValueChange={(v) => setForm((f) => ({ ...f, account_type: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isBank && (
            <>
              <div className="space-y-1">
                <Label>Bank Name</Label>
                <Input value={form.bank_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Account Last 4</Label>
                <Input maxLength={4} value={form.account_number_last4 ?? ''} onChange={(e) => setForm((f) => ({ ...f, account_number_last4: e.target.value }))} />
              </div>
            </>
          )}
          <div className="space-y-1">
            <Label>Display Order</Label>
            <Input type="number" value={form.display_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (!form.account_name || !form.account_type) return;
            onSave(form);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}