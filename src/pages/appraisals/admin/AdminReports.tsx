import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APPRAISALS_NAV } from '@/lib/navigation/appraisals';
import { useAppraisalCycles, useAppraisalsByCycle, useDepartments, useEmployees } from '@/hooks/hr';

export default function AdminReports() {
  const { data: cycles = [] } = useAppraisalCycles();
  const active = cycles[0];
  const { data: list = [] } = useAppraisalsByCycle(active?.id);
  const { data: depts = [] } = useDepartments();
  const { data: emps = [] } = useEmployees();

  const buckets = useMemo(() => {
    const b: Record<string, number> = { '0-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 };
    for (const a of list as any[]) {
      const r = Number(a.final_overall_rating ?? 0);
      if (r > 0 && r <= 2) b['0-2']++;
      else if (r <= 3) b['2-3']++;
      else if (r <= 4) b['3-4']++;
      else if (r <= 5) b['4-5']++;
    }
    return b;
  }, [list]);

  const top = [...list].filter((a: any) => a.final_overall_rating).sort((a: any, b: any) => Number(b.final_overall_rating) - Number(a.final_overall_rating)).slice(0, 5);
  const needImp = [...list].filter((a: any) => a.recommendation === 'improve' || a.recommendation === 'pip');
  const inc = [...list].filter((a: any) => a.recommendation === 'increment' || a.recommendation === 'promote');

  const byDept = useMemo(() => {
    const m: Record<string, { sum: number; count: number; name: string }> = {};
    for (const a of list as any[]) {
      const emp = emps.find((e) => e.id === a.employee_id);
      if (!emp?.department_id || a.final_overall_rating == null) continue;
      const d = depts.find((x) => x.id === emp.department_id);
      const key = emp.department_id;
      if (!m[key]) m[key] = { sum: 0, count: 0, name: d?.name ?? '—' };
      m[key].sum += Number(a.final_overall_rating); m[key].count++;
    }
    return Object.values(m).map((v) => ({ name: v.name, avg: +(v.sum / v.count).toFixed(2) }));
  }, [list, emps, depts]);

  return (
    <AppLayout title="Appraisals" subtitle="Reports" moduleNav={APPRAISALS_NAV}>
      <div className="p-4 md:p-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Rating Distribution</h3>
          {Object.entries(buckets).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 mb-1">
              <span className="text-xs w-12">{k}</span>
              <div className="h-3 bg-primary/60 rounded" style={{ width: `${v * 20}px` }} />
              <span className="text-xs">{v}</span>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Avg Rating by Department</h3>
          {byDept.length === 0 ? <p className="text-sm text-muted-foreground">No data.</p> : byDept.map((d) => (
            <div key={d.name} className="flex justify-between text-sm py-1">
              <span>{d.name}</span><span>{d.avg}</span>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Top Performers</h3>
          {top.map((a: any) => (
            <div key={a.id} className="flex justify-between text-sm py-1">
              <span>{a.employees?.full_name}</span><span>{a.final_overall_rating}</span>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Needs Improvement</h3>
          {needImp.map((a: any) => (
            <div key={a.id} className="flex justify-between text-sm py-1">
              <span>{a.employees?.full_name}</span><Badge variant="destructive">{a.recommendation}</Badge>
            </div>
          ))}
        </Card>
        <Card className="p-6 md:col-span-2">
          <h3 className="font-semibold mb-3">Increment / Promotion Recommendations</h3>
          {inc.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : inc.map((a: any) => (
            <div key={a.id} className="flex justify-between text-sm py-1 border-b">
              <span>{a.employees?.full_name}</span>
              <span>{a.recommendation} {a.increment_percentage_recommended ? `· +${a.increment_percentage_recommended}%` : ''}</span>
            </div>
          ))}
        </Card>
      </div>
    </AppLayout>
  );
}