import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APPRAISALS_NAV } from '@/lib/navigation/appraisals';
import { useAppraisal, useAppraisalRatings, useUpsertRating, useSubmitManagerReview, useUpdateAppraisal } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

const RECS = ['promote','increment','maintain','improve','pip'] as const;

export default function ManagerReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: appraisal } = useAppraisal(id);
  const { data: ratings = [] } = useAppraisalRatings(id);
  const upsert = useUpsertRating();
  const submit = useSubmitManagerReview();
  const updateA = useUpdateAppraisal();

  const [mgrComments, setMgrComments] = useState('');
  const [rec, setRec] = useState<string>('maintain');
  const [incPct, setIncPct] = useState<string>('');
  const [training, setTraining] = useState('');

  useEffect(() => {
    if (appraisal) {
      setMgrComments(appraisal.manager_comments ?? '');
      setRec(appraisal.recommendation ?? 'maintain');
      setIncPct(appraisal.increment_percentage_recommended?.toString() ?? '');
      setTraining(appraisal.training_recommendations ?? '');
    }
  }, [appraisal]);

  if (!id || !appraisal) return <AppLayout title="Appraisals" moduleNav={APPRAISALS_NAV}><div className="p-6">Loading…</div></AppLayout>;

  const saveDraft = async () => {
    await updateA.mutateAsync({ id, patch: {
      manager_comments: mgrComments, recommendation: rec as any,
      increment_percentage_recommended: incPct ? Number(incPct) : null,
      training_recommendations: training,
    }});
    toast({ title: 'Draft saved' });
  };
  const onSubmit = async () => {
    await saveDraft();
    await submit.mutateAsync(id);
    toast({ title: 'Submitted to HR' });
    nav('/appraisals/team');
  };

  return (
    <AppLayout title="Appraisals" subtitle={`Manager Review: ${(appraisal as any).employees?.full_name ?? ''}`} moduleNav={APPRAISALS_NAV}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Criteria (Self vs Manager)</h2>
          {ratings.map((r: any) => (
            <div key={r.id} className="border-b pb-3 grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">{r.appraisal_criteria?.criterion_name}</p>
                <p className="text-xs text-muted-foreground">weight {r.appraisal_criteria?.weightage_percentage}%</p>
                <p className="text-xs mt-1">Self: <b>{r.self_rating ?? '—'}</b></p>
                {r.self_comments && <p className="text-xs text-muted-foreground mt-1">"{r.self_comments}"</p>}
              </div>
              <div className="space-y-2">
                <Input type="number" step="0.5" defaultValue={r.manager_rating ?? ''}
                  onBlur={(e) => upsert.mutate({ appraisal_id: id, criterion_id: r.criterion_id, manager_rating: e.target.value ? Number(e.target.value) : null } as any)} />
                <Textarea defaultValue={r.manager_comments ?? ''}
                  onBlur={(e) => upsert.mutate({ appraisal_id: id, criterion_id: r.criterion_id, manager_comments: e.target.value } as any)} />
              </div>
            </div>
          ))}
        </Card>
        <Card className="p-6 grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><Label>Manager Comments</Label><Textarea value={mgrComments} onChange={(e) => setMgrComments(e.target.value)} /></div>
          <div>
            <Label>Recommendation</Label>
            <Select value={rec} onValueChange={setRec}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RECS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Increment %</Label>
            <Input type="number" value={incPct} onChange={(e) => setIncPct(e.target.value)} />
          </div>
          <div className="md:col-span-2"><Label>Training Recommendations</Label><Textarea value={training} onChange={(e) => setTraining(e.target.value)} /></div>
        </Card>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={saveDraft}>Save Draft</Button>
          <Button onClick={onSubmit} disabled={appraisal.status !== 'manager_review'}>Submit</Button>
        </div>
      </div>
    </AppLayout>
  );
}