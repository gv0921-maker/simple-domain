import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { APPRAISALS_NAV } from '@/lib/navigation/appraisals';
import { useAppraisal, useAppraisalRatings, useUpsertRating, useFinalizeAppraisal, useUpdateAppraisal } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

export default function HRReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: appraisal } = useAppraisal(id);
  const { data: ratings = [] } = useAppraisalRatings(id);
  const upsert = useUpsertRating();
  const finalize = useFinalizeAppraisal();
  const updateA = useUpdateAppraisal();
  const [hrComments, setHrComments] = useState('');

  useEffect(() => { if (appraisal) setHrComments(appraisal.hr_comments ?? ''); }, [appraisal]);
  if (!id || !appraisal) return <AppLayout title="Appraisals" moduleNav={APPRAISALS_NAV}><div className="p-6">Loading…</div></AppLayout>;

  const onFinalize = async () => {
    await updateA.mutateAsync({ id, patch: { hr_comments: hrComments } });
    await finalize.mutateAsync(id);
    toast({ title: 'Appraisal finalized' });
    nav('/appraisals/admin/cycles');
  };

  return (
    <AppLayout title="Appraisals" subtitle="HR Finalization" moduleNav={APPRAISALS_NAV}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Criteria (Self · Manager · Final)</h2>
          {ratings.map((r: any) => (
            <div key={r.id} className="border-b pb-3 grid md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <p className="font-medium">{r.appraisal_criteria?.criterion_name}</p>
                <p className="text-xs text-muted-foreground">weight {r.appraisal_criteria?.weightage_percentage}%</p>
              </div>
              <div className="text-xs space-y-1">
                <p>Self: <b>{r.self_rating ?? '—'}</b></p>
                <p>Manager: <b>{r.manager_rating ?? '—'}</b></p>
              </div>
              <div>
                <Label className="text-xs">Final</Label>
                <Input type="number" step="0.5" defaultValue={r.final_rating ?? r.manager_rating ?? ''}
                  onBlur={(e) => upsert.mutate({ appraisal_id: id, criterion_id: r.criterion_id, final_rating: e.target.value ? Number(e.target.value) : null } as any)} />
              </div>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <Label>HR Comments</Label>
          <Textarea value={hrComments} onChange={(e) => setHrComments(e.target.value)} />
        </Card>
        <div className="flex justify-end">
          <Button onClick={onFinalize} disabled={appraisal.status !== 'hr_review'}>Finalize</Button>
        </div>
      </div>
    </AppLayout>
  );
}