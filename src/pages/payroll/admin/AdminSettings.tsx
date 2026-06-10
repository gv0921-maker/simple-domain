import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PAYROLL_NAV } from '@/lib/navigation/payroll';
import { usePayrollSettings, useUpdatePayrollSettings, useTaxSlabs, useUpsertTaxSlab, useDeleteTaxSlab } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

export default function AdminSettings() {
  const { data: settings } = usePayrollSettings();
  const update = useUpdatePayrollSettings();
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const regime = (form.tds_regime ?? 'new') as 'old' | 'new';
  const fy = form.financial_year ?? '2026-27';
  const { data: slabs = [] } = useTaxSlabs(fy, regime);
  const upsertSlab = useUpsertTaxSlab();
  const delSlab = useDeleteTaxSlab();
  const [newSlab, setNewSlab] = useState({ from_amount: 0, to_amount: 0, rate_percentage: 0, slab_order: 1 });

  if (!settings) return <AppLayout title="Payroll Settings" moduleNav={PAYROLL_NAV}><div className="p-6">Loading…</div></AppLayout>;

  const setField = (k: string, v: any) => setForm({ ...form, [k]: v });
  const Num = ({ label, k }: { label: string; k: string }) => (
    <div><label className="text-xs">{label}</label>
      <Input type="number" value={form[k] ?? ''} onChange={(e) => setField(k, parseFloat(e.target.value) || 0)} /></div>
  );
  const Txt = ({ label, k }: { label: string; k: string }) => (
    <div><label className="text-xs">{label}</label>
      <Input value={form[k] ?? ''} onChange={(e) => setField(k, e.target.value)} /></div>
  );

  return (
    <AppLayout title="Payroll Settings" moduleNav={PAYROLL_NAV}>
      <div className="p-6 space-y-6">
        <Card className="p-6 grid md:grid-cols-3 gap-4">
          <Txt label="Financial Year" k="financial_year" />
          <Num label="PF Rate (%)" k="pf_rate" />
          <Num label="PF Basic Cap (₹)" k="pf_basic_cap" />
          <Num label="ESI Employee (%)" k="esi_rate_employee" />
          <Num label="ESI Employer (%)" k="esi_rate_employer" />
          <Num label="ESI Gross Threshold (₹)" k="esi_gross_threshold" />
          <Num label="Professional Tax (₹)" k="pt_amount" />
          <Txt label="PT State" k="pt_state" />
          <div><label className="text-xs">TDS Regime</label>
            <select className="border rounded px-2 py-1 h-9 text-sm w-full" value={form.tds_regime ?? 'new'} onChange={(e) => setField('tds_regime', e.target.value)}>
              <option value="new">New</option><option value="old">Old</option>
            </select></div>
          <Num label="Working Days/Month" k="working_days_per_month" />
          <Num label="Working Hours/Day" k="working_hours_per_day" />
          <Num label="Overtime Multiplier" k="overtime_rate_multiplier" />
          <Num label="Standard Deduction (₹)" k="standard_deduction" />
          <div className="md:col-span-3">
            <Button onClick={async () => { await update.mutateAsync({ id: settings.id, patch: form }); toast({ title: 'Saved' }); }}>Save Settings</Button>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h3 className="font-semibold">Tax Slabs — FY {fy} · {regime} regime</h3>
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="p-2 text-left">Order</th><th className="text-right p-2">From (₹)</th><th className="text-right p-2">To (₹)</th><th className="text-right p-2">Rate (%)</th><th></th></tr></thead>
            <tbody>
              {slabs.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">{s.slab_order}</td>
                  <td className="p-2 text-right">{Number(s.from_amount).toLocaleString('en-IN')}</td>
                  <td className="p-2 text-right">{s.to_amount ? Number(s.to_amount).toLocaleString('en-IN') : '∞'}</td>
                  <td className="p-2 text-right">{s.rate_percentage}</td>
                  <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => delSlab.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 items-end pt-2 border-t">
            <div><label className="text-xs">Order</label><Input type="number" value={newSlab.slab_order} onChange={(e) => setNewSlab({ ...newSlab, slab_order: parseInt(e.target.value) || 1 })} className="w-20" /></div>
            <div><label className="text-xs">From</label><Input type="number" value={newSlab.from_amount} onChange={(e) => setNewSlab({ ...newSlab, from_amount: parseFloat(e.target.value) || 0 })} /></div>
            <div><label className="text-xs">To (blank = ∞)</label><Input type="number" value={newSlab.to_amount || ''} onChange={(e) => setNewSlab({ ...newSlab, to_amount: parseFloat(e.target.value) || 0 })} /></div>
            <div><label className="text-xs">Rate %</label><Input type="number" value={newSlab.rate_percentage} onChange={(e) => setNewSlab({ ...newSlab, rate_percentage: parseFloat(e.target.value) || 0 })} className="w-24" /></div>
            <Button onClick={() => upsertSlab.mutate({ ...newSlab, to_amount: newSlab.to_amount || null, financial_year: fy, regime })}>Add Slab</Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}