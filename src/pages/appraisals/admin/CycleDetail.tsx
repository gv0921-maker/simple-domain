import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { APPRAISALS_NAV } from '@/lib/navigation/appraisals';
import { useAppraisalCycle, useAppraisalsByCycle, useLaunchAppraisalCycle, useUpdateAppraisalCycle } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

export default function CycleDetail() {
  const { id } = useParams();
  const { data: cycle } = useAppraisalCycle(id);
  const { data: list = [] } = useAppraisalsByCycle(id);
  const launch = useLaunchAppraisalCycle();
  const upd = useUpdateAppraisalCycle();

  const stats = useMemo(() => {
    const by = (s: string) => list.filter((a: any) => a.status === s).length;
    return { total: list.length, self: by('self_review'), mgr: by('manager_review'), hr: by('hr_review'), done: by('completed') + by('closed') };
  }, [list]);

  const exportCSV = () => {
    const rows = [['employee','status','final_rating','recommendation','increment%']];
    for (const a of list as any[]) {
      rows.push([a.employees?.full_name ?? '', a.status, String(a.final_overall_rating ?? ''), a.recommendation ?? '', String(a.increment_percentage_recommended ?? '')]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `appraisals-${id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!cycle) return <AppLayout title="Appraisals" moduleNav={APPRAISALS_NAV}><div className="p-6">Loading…</div></AppLayout>;

  return (
    <AppLayout title="Appraisals" subtitle={cycle.name} moduleNav={APPRAISALS_NAV}>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <Card className="p-6 flex justify-between items-start">
          <div>
            <p className="font-semibold">{cycle.name}</p>
            <p className="text-xs text-muted-foreground">{cycle.cycle_type} · {cycle.period_start_date} → {cycle.period_end_date}</p>
            <Badge variant="outline" className="mt-2">{cycle.status}</Badge>
          </div>
          <div className="flex gap-2">
            {cycle.status === 'draft' && (
              <Button onClick={async () => { const n = await launch.mutateAsync(id!); toast({ title: `Launched (${n} employees)` }); }}>Launch</Button>
            )}
            {cycle.status !== 'closed' && cycle.status !== 'draft' && (
              <Button variant="outline" onClick={async () => { await upd.mutateAsync({ id: id!, patch: { status: 'closed' } }); toast({ title: 'Closed' }); }}>Close</Button>
            )}
            <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
          </div>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Total" value={stats.total} />
          <Stat label="Self" value={stats.self} />
          <Stat label="Manager" value={stats.mgr} />
          <Stat label="HR" value={stats.hr} />
          <Stat label="Done" value={stats.done} />
        </div>
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Appraisals</h3>
          <div className="space-y-2">
            {(list as any[]).map((a) => (
              <div key={a.id} className="flex justify-between p-2 border rounded">
                <span>{a.employees?.full_name} <span className="text-xs text-muted-foreground">({a.employees?.employee_code})</span></span>
                <div className="flex gap-2 items-center">
                  {a.final_overall_rating != null && <span className="text-sm">{a.final_overall_rating}</span>}
                  <Badge variant="outline">{a.status}</Badge>
                </div>
              </div>
            ))}
          </div>
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