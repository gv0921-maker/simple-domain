import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HR_NAV } from '@/lib/navigation/hr';
import { useAppraisalCycles, useAppraisalsByCycle, usePendingIncrements } from '@/hooks/hr';

export default function AppraisalsOverview() {
  const { data: cycles = [] } = useAppraisalCycles();
  const active = cycles.find((c) => c.status === 'in_progress' || c.status === 'active') ?? cycles[0];
  const { data: appraisals = [] } = useAppraisalsByCycle(active?.id);
  const { data: pending = [] } = usePendingIncrements();

  const stats = useMemo(() => {
    const by = (s: string) => appraisals.filter((a: any) => a.status === s).length;
    return {
      total: appraisals.length,
      self: by('self_review'),
      mgr: by('manager_review'),
      hr: by('hr_review'),
      done: by('completed') + by('closed'),
    };
  }, [appraisals]);

  return (
    <AppLayout title="Appraisals" subtitle={active?.name} moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
        {!active ? (
          <Card className="p-6 text-sm text-muted-foreground">
            No active appraisal cycle. <Link to="/appraisals/admin/cycles" className="text-primary underline">Create one</Link>.
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Stat label="Total" value={stats.total} />
              <Stat label="Self Review" value={stats.self} />
              <Stat label="Manager Review" value={stats.mgr} />
              <Stat label="HR Review" value={stats.hr} />
              <Stat label="Completed" value={stats.done} />
            </div>
            <Card className="p-6">
              <h2 className="font-semibold mb-3">Active Cycle</h2>
              <p className="text-sm">{active.name} · {active.cycle_type} · {active.period_start_date} → {active.period_end_date}</p>
              <Badge variant="outline" className="mt-2">{active.status}</Badge>
            </Card>
          </>
        )}
        <Card className="p-6">
          <h2 className="font-semibold mb-3">Pending Increment Recommendations</h2>
          {pending.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
            <ul className="text-sm divide-y">
              {pending.map((p: any) => (
                <li key={p.id} className="py-2 flex justify-between">
                  <span>{p.employees?.full_name} ({p.employees?.employee_code})</span>
                  <span>{p.recommendation} {p.increment_percentage_recommended ? `· +${p.increment_percentage_recommended}%` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </Card>
  );
}