import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HR_NAV } from '@/lib/navigation/hr';
import { useCompOffCredits, useEmployees, useGrantCompOff, useWorkedOnWeeklyOff } from '@/hooks/hr';
import { toast } from 'sonner';

export default function AdminCompOff() {
  const past = new Date(); past.setDate(past.getDate() - 30);
  const [from, setFrom] = useState(past.toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const { data: credits = [] } = useCompOffCredits();
  const { data: employees = [] } = useEmployees();
  const { data: detected = [] } = useWorkedOnWeeklyOff(from, to);
  const grant = useGrantCompOff();

  return (
    <AppLayout title="Comp Off" moduleNav={HR_NAV}>
      <div className="p-6 space-y-4">
        <Card className="p-4">
          <div className="flex gap-2 items-end mb-3">
            <div><label className="text-xs">From</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="text-xs">To</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>
          <h3 className="font-semibold mb-2">Detected: Worked on planned weekly off</h3>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground"><tr>
              <th className="text-left p-2">Employee</th><th className="text-left p-2">Date</th><th></th>
            </tr></thead>
            <tbody>
              {detected.length === 0 && <tr><td colSpan={3} className="p-3 text-muted-foreground text-center">None detected.</td></tr>}
              {detected.map((d, i) => {
                const emp = employees.find((e) => e.id === d.employee_id);
                return (
                  <tr key={i} className="border-t">
                    <td className="p-2">{emp?.full_name}</td>
                    <td className="p-2">{d.roster_date}</td>
                    <td className="p-2 text-right">
                      <Button size="sm" onClick={async () => {
                        try { await grant.mutateAsync({ employee_id: d.employee_id, work_date: d.roster_date }); toast.success('Comp off granted'); }
                        catch (e: any) { toast.error(e.message); }
                      }}>Grant Comp Off</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">Granted Comp Off Credits</h3>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground"><tr>
              <th className="text-left p-2">Employee</th><th className="text-left p-2">Work Date</th>
              <th className="text-left p-2">Days</th><th className="text-left p-2">Expiry</th><th className="text-left p-2">Used</th>
            </tr></thead>
            <tbody>
              {credits.map((c) => {
                const emp = employees.find((e) => e.id === c.employee_id);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{emp?.full_name}</td>
                    <td className="p-2">{c.work_date}</td>
                    <td className="p-2">{c.comp_off_days}</td>
                    <td className="p-2">{c.expiry_date}</td>
                    <td className="p-2">{c.used ? 'Yes' : 'No'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}