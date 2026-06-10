import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APPRAISALS_NAV } from '@/lib/navigation/appraisals';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { useAppraisalsForReviewer } from '@/hooks/hr';

export default function TeamAppraisals() {
  const { data: me } = useCurrentEmployee();
  const { data: list = [] } = useAppraisalsForReviewer(me?.id);
  return (
    <AppLayout title="Appraisals" subtitle="My Team" moduleNav={APPRAISALS_NAV}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-3">
        {list.length === 0 ? <Card className="p-6 text-sm text-muted-foreground">No team appraisals.</Card> : list.map((a: any) => {
          const href = a.status === 'manager_review' ? `/appraisals/${a.id}/manager-review` : `/appraisals/${a.id}`;
          return (
            <Link key={a.id} to={href}>
              <Card className="p-4 hover:bg-accent cursor-pointer flex justify-between">
                <div>
                  <p className="font-medium">{a.employees?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{a.appraisal_cycles?.name}</p>
                </div>
                <Badge variant={a.status === 'manager_review' ? 'default' : 'outline'}>{a.status}</Badge>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppLayout>
  );
}