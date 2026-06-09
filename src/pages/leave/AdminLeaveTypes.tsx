import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HR_NAV } from '@/lib/navigation/hr';
import { useLeaveTypes, useCreateLeaveType, useUpdateLeaveType, useDeleteLeaveType } from '@/hooks/hr';
import { Trash2 } from 'lucide-react';

export default function AdminLeaveTypes() {
  const { data: types = [] } = useLeaveTypes();
  const create = useCreateLeaveType();
  const update = useUpdateLeaveType();
  const del = useDeleteLeaveType();
  const [form, setForm] = useState({ name: '', code: '', default_days_per_year: 0 });

  return (
    <AppLayout title="Leave Types" moduleNav={HR_NAV}>
      <div className="p-6 space-y-3">
        <Card className="p-4 flex gap-2 items-end">
          <div><label className="text-xs">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="text-xs">Code</label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
          <div><label className="text-xs">Default days/yr</label><Input type="number" value={form.default_days_per_year}
            onChange={(e) => setForm({ ...form, default_days_per_year: parseFloat(e.target.value) || 0 })} /></div>
          <Button onClick={() => {
            if (form.name && form.code) {
              create.mutate(form);
              setForm({ name: '', code: '', default_days_per_year: 0 });
            }
          }}>Add</Button>
        </Card>
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs"><tr>
              <th className="text-left p-2">Name</th><th className="text-left p-2">Code</th>
              <th className="text-left p-2">Days/Yr</th><th className="text-left p-2">CF Max</th>
              <th className="text-left p-2">Notice</th><th className="text-left p-2">Gender</th><th></th>
            </tr></thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.name}</td>
                  <td className="p-2">{t.code}</td>
                  <td className="p-2"><Input className="h-7 w-20" type="number" defaultValue={Number(t.default_days_per_year)}
                    onBlur={(e) => update.mutate({ id: t.id, patch: { default_days_per_year: parseFloat(e.target.value) || 0 } })} /></td>
                  <td className="p-2"><Input className="h-7 w-20" type="number" defaultValue={Number(t.default_carry_forward_max_days)}
                    onBlur={(e) => update.mutate({ id: t.id, patch: { default_carry_forward_max_days: parseFloat(e.target.value) || 0 } })} /></td>
                  <td className="p-2"><Input className="h-7 w-16" type="number" defaultValue={t.default_min_notice_days}
                    onBlur={(e) => update.mutate({ id: t.id, patch: { default_min_notice_days: parseInt(e.target.value) || 0 } })} /></td>
                  <td className="p-2">{t.gender_restriction}</td>
                  <td className="p-2"><Button size="sm" variant="ghost" onClick={() => del.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}