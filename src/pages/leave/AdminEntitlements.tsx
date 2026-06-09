import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HR_NAV } from '@/lib/navigation/hr';
import { useEntitlements, useEmployees, useLeaveTypes, useDepartments, useUpsertEntitlement } from '@/hooks/hr';

export default function AdminEntitlements() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [deptId, setDeptId] = useState('all');
  const { data: ents = [] } = useEntitlements(year);
  const { data: employees = [] } = useEmployees();
  const { data: types = [] } = useLeaveTypes();
  const { data: depts = [] } = useDepartments();
  const upsert = useUpsertEntitlement();

  const filtered = employees.filter((e) => deptId === 'all' || e.department_id === deptId);
  function getEnt(empId: string, typeId: string) {
    return ents.find((e) => e.employee_id === empId && e.leave_type_id === typeId);
  }

  return (
    <AppLayout title="Leave Entitlements (GLF)" moduleNav={HR_NAV}>
      <div className="p-6 space-y-3">
        <div className="flex gap-3">
          <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || year)} className="w-28" />
          <Select value={deptId} onValueChange={setDeptId}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">Empty cell = default from Leave Type. Edit a cell to override per employee.</div>
        <Card className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-2 sticky left-0 bg-muted/40">Employee</th>
                {types.map((t) => (
                  <th key={t.id} className="text-left p-2">
                    <div>{t.code}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">def {t.default_days_per_year}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="p-2 font-medium sticky left-0 bg-background">{emp.full_name}</td>
                  {types.map((t) => {
                    const ent = getEnt(emp.id, t.id);
                    return (
                      <td key={t.id} className="p-1">
                        <Input type="number" className="h-7 w-16"
                          defaultValue={ent ? Number(ent.allocated_days) : ''}
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (v === '') return;
                            upsert.mutate({
                              employee_id: emp.id, leave_type_id: t.id, year,
                              allocated_days: parseFloat(v) || 0,
                            });
                          }} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}