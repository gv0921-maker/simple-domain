import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HR_NAV } from '@/lib/navigation/hr';
import { useBalances, useEmployees, useLeaveTypes, useUpsertBalance, useCarryForward } from '@/hooks/hr';
import { toast } from 'sonner';

export default function AdminBalances() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data: balances = [] } = useBalances(year);
  const { data: employees = [] } = useEmployees();
  const { data: types = [] } = useLeaveTypes();
  const upsert = useUpsertBalance();
  const carry = useCarryForward();

  function get(empId: string, typeId: string) {
    return balances.find((b) => b.employee_id === empId && b.leave_type_id === typeId);
  }

  return (
    <AppLayout title="Leave Balances (Admin)" moduleNav={HR_NAV}>
      <div className="p-6 space-y-3">
        <div className="flex justify-between items-center">
          <Input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || year)} className="w-32" />
          <Button onClick={async () => { await carry.mutateAsync(year); toast.success(`Carried forward to ${year + 1}`); }}>
            Carry forward {year} → {year + 1}
          </Button>
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr><th className="text-left p-2">Employee</th>
                {types.map((t) => <th key={t.id} className="text-left p-2">{t.code}</th>)}</tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="p-2 font-medium">{emp.full_name}</td>
                  {types.map((t) => {
                    const b = get(emp.id, t.id);
                    return (
                      <td key={t.id} className="p-1">
                        <Input type="number" className="h-7 w-16" defaultValue={Number(b?.opening_balance ?? 0)}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            upsert.mutate({
                              employee_id: emp.id, leave_type_id: t.id, year,
                              opening_balance: v,
                              accrued: Number(b?.accrued ?? 0),
                              used: Number(b?.used ?? 0),
                              pending_approval: Number(b?.pending_approval ?? 0),
                              carried_forward: Number(b?.carried_forward ?? 0),
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