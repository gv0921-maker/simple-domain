import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { getPayrollSettings, updatePayrollSettingsX } from '@/lib/services/hr/payrollSettings';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

export default function PayrollSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPayrollSettings()
      .then((s) => { if (!cancelled) setSettings(s); })
      .catch((e) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [toast]);

  if (loading) return <AppLayout title="Payroll Settings" moduleNav={SETTINGS_NAV}><div className="p-6">Loading…</div></AppLayout>;
  if (!settings) return <AppLayout title="Payroll Settings" moduleNav={SETTINGS_NAV}><div className="p-6">No active payroll settings found.</div></AppLayout>;

  const set = (k: string, v: any) => setSettings({ ...settings, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      await updatePayrollSettingsX(settings.id, {
        pf_rate: Number(settings.pf_rate),
        esi_rate_employee: Number(settings.esi_rate_employee),
        esi_gross_threshold: Number(settings.esi_gross_threshold),
        pt_amount: Number(settings.pt_amount),
        pt_salary_threshold: Number(settings.pt_salary_threshold),
        payslip_self_view_enabled: !!settings.payslip_self_view_enabled,
        notes: settings.notes ?? null,
      });
      toast({ title: 'Saved' });
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Payroll Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-6 max-w-3xl space-y-6">
        <Card className="p-4 border-amber-200 bg-amber-50 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            Changes apply to the next payroll period. Existing payslips retain their original calculation
            and a snapshot of the settings used at that time.
          </p>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Deduction Settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs">PF Rate (%)</label>
              <Input type="number" step="0.01" value={settings.pf_rate ?? ''} onChange={(e) => set('pf_rate', e.target.value)} />
            </div>
            <div>
              <label className="text-xs">ESI Employee Rate (%)</label>
              <Input type="number" step="0.01" value={settings.esi_rate_employee ?? ''} onChange={(e) => set('esi_rate_employee', e.target.value)} />
            </div>
            <div>
              <label className="text-xs">ESI Salary Threshold (₹)</label>
              <Input type="number" value={settings.esi_gross_threshold ?? ''} onChange={(e) => set('esi_gross_threshold', e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">ESI is deducted only if employee gross monthly salary is ≤ this amount.</p>
            </div>
            <div>
              <label className="text-xs">PT Amount (₹/month)</label>
              <Input type="number" value={settings.pt_amount ?? ''} onChange={(e) => set('pt_amount', e.target.value)} />
            </div>
            <div>
              <label className="text-xs">PT Salary Threshold (₹)</label>
              <Input type="number" value={settings.pt_salary_threshold ?? ''} onChange={(e) => set('pt_salary_threshold', e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">PT is deducted only if employee gross monthly salary is greater than this amount.</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Access Control</h2>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium text-sm">Allow employees to view own payslip</div>
              <p className="text-xs text-muted-foreground">
                When enabled, employees can view their own finalized payslips in the Employee dashboard.
                They still cannot edit or delete. Drafts remain hidden.
              </p>
            </div>
            <Switch
              checked={!!settings.payslip_self_view_enabled}
              onCheckedChange={(v) => set('payslip_self_view_enabled', v)}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">TDS Settings</h2>
          <div className="text-sm">
            <div><span className="text-muted-foreground">TDS calculation:</span> <span className="font-medium">Manual</span> (entered per employee during payroll processing)</div>
            <p className="text-xs text-muted-foreground mt-2">Auto-slab calculation coming in a future update.</p>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-semibold">Notes</h2>
          <Textarea value={settings.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
        </div>
      </div>
    </AppLayout>
  );
}