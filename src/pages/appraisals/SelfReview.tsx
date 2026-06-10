import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { APPRAISALS_NAV } from '@/lib/navigation/appraisals';
import { useAppraisal, useAppraisalRatings, useUpsertRating, useSubmitSelfReview, useUpdateAppraisal } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

export default function SelfReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: appraisal } = useAppraisal(id);
  const { data: ratings = [] } = useAppraisalRatings(id);
  const upsert = useUpsertRating();
  const submit = useSubmitSelfReview();
  const updateA = useUpdateAppraisal();
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  useEffect(() => {
    if (appraisal) {
      setStrengths(appraisal.strengths ?? '');
      setImprovements(appraisal.areas_of_improvement ?? '');
    }
  }, [appraisal]);

  if (!id || !appraisal) return <AppLayout title="Appraisals" moduleNav={APPRAISALS_NAV}><div className="p-6">Loading…</div></AppLayout>;

  const handleRate = async (criterionId: string, field: 'self_rating' | 'self_comments', val: any) => {
    await upsert.mutateAsync({ appraisal_id: id, criterion_id: criterionId, [field]: val } as any);
  };
  const saveDraft = async () => {
    await updateA.mutateAsync({ id, patch: { strengths, areas_of_improvement: improvements } });
    toast({ title: 'Saved draft' });
  };
  const onSubmit = async () => {
    await updateA.mutateAsync({ id, patch: { strengths, areas_of_improvement: improvements } });
    await submit.mutateAsync(id);
    toast({ title: 'Submitted to manager' });
    nav('/appraisals/my-appraisals');
  };

  return (
    <AppLayout title="Appraisals" subtitle="Self Review" moduleNav={APPRAISALS_NAV}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Criteria</h2>
          {ratings.map((r: any) => (
            <div key={r.id} className="border-b pb-3">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="font-medium">{r.appraisal_criteria?.criterion_name}</p>
                  <p className="text-xs text-muted-foreground">{r.appraisal_criteria?.category} · weight {r.appraisal_criteria?.weightage_percentage}% · scale {r.appraisal_criteria?.rating_scale}</p>
                </div>
                <Input type="number" step="0.5" defaultValue={r.self_rating ?? ''} className="w-24"
                  onBlur={(e) => handleRate(r.criterion_id, 'self_rating', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <Textarea defaultValue={r.self_comments ?? ''}
                onBlur={(e) => handleRate(r.criterion_id, 'self_comments', e.target.value)} />
            </div>
          ))}
        </Card>
        <Card className="p-6 space-y-3">
          <div><Label>Strengths</Label><Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} /></div>
          <div><Label>Areas of Improvement</Label><Textarea value={improvements} onChange={(e) => setImprovements(e.target.value)} /></div>
        </Card>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={saveDraft}>Save Draft</Button>
          <Button onClick={onSubmit} disabled={appraisal.status !== 'self_review'}>Submit</Button>
        </div>
      </div>
    </AppLayout>
  );
}