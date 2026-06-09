import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HR_NAV } from '@/lib/navigation/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useAppraisalsForEmployee } from '@/hooks/hr';

export default function MyAppraisals() {
  const { data: me } = useCurrentEmployee();
  const { data: list = [] } = useAppraisalsForEmployee(me?.id);
  return (
    <AppLayout title="Appraisals" subtitle="My Appraisals" moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-3">
        {list.length === 0 ? <Card className="p-6 text-sm text-muted-foreground">No appraisals yet.</Card> : list.map((a: any) => (
          <Link key={a.id} to={pathFor(a)}>
            <Card className="p-4 hover:bg-accent cursor-pointer flex justify-between">
              <div>
                <p className="font-medium">{a.appraisal_cycles?.name}</p>
                <p className="text-xs text-muted-foreground">{a.appraisal_cycles?.period_start_date} → {a.appraisal_cycles?.period_end_date}</p>
              </div>
              <div className="text-right space-y-1">
                <Badge variant="outline">{a.status}</Badge>
                {a.final_overall_rating != null && <p className="text-sm">Rating: {a.final_overall_rating}</p>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}

function pathFor(a: any) {
  if (a.status === 'self_review') return `/appraisals/${a.id}/self-review`;
  return `/appraisals/${a.id}`;
}