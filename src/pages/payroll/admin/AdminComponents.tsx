import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PAYROLL_NAV } from '@/lib/navigation/payroll';
import { useSalaryComponents, useCreateSalaryComponent, useUpdateSalaryComponent, useDeleteSalaryComponent } from '@/hooks/hr';
import { Trash2 } from 'lucide-react';

export default function AdminComponents() {
  const { data: list = [] } = useSalaryComponents();
  const create = useCreateSalaryComponent();
  const update = useUpdateSalaryComponent();
  const del = useDeleteSalaryComponent();
  const [form, setForm] = useState({ code: '', name: '', type: 'earning', calculation_type: 'fixed', default_value: 0 });

  return (
    <AppLayout title="Salary Components" moduleNav={PAYROLL_NAV}>
      <div className="p-6 space-y-4">
        <Card className="p-4 flex flex-wrap gap-2 items-end">
          <div><label className="text-xs">Code</label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-32" /></div>
          <div><label className="text-xs">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs">Type</label>
            <select className="border rounded px-2 py-1 h-9 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="earning">Earning</option><option value="deduction">Deduction</option><option value="employer_contribution">Employer</option>
            </select></div>
          <div><label className="text-xs">Calc</label>
            <select className="border rounded px-2 py-1 h-9 text-sm" value={form.calculation_type} onChange={(e) => setForm({ ...form, calculation_type: e.target.value })}>
              <option value="fixed">Fixed</option><option value="percentage_of_basic">% of Basic</option><option value="percentage_of_gross">% of Gross</option><option value="formula">Formula</option>
            </select></div>
          <div><label className="text-xs">Default</label><Input type="number" value={form.default_value} onChange={(e) => setForm({ ...form, default_value: parseFloat(e.target.value) || 0 })} className="w-28" /></div>
          <Button onClick={() => { if (form.code && form.name) { create.mutate(form as any); setForm({ ...form, code: '', name: '' }); } }}>Add</Button>
        </Card>

        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="p-3 text-left">Code</th><th className="text-left p-3">Name</th><th className="text-left p-3">Type</th><th className="text-left p-3">Calc</th><th className="text-right p-3">Default</th><th className="text-center p-3">Active</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{c.code}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3"><Badge variant="outline">{c.type}</Badge></td>
                  <td className="p-3 text-xs">{c.calculation_type}</td>
                  <td className="p-3 text-right">{c.default_value}</td>
                  <td className="p-3 text-center"><Switch checked={c.is_active} onCheckedChange={(v) => update.mutate({ id: c.id, patch: { is_active: v } })} /></td>
                  <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => del.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}