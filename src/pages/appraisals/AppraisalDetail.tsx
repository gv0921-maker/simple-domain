import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { APPRAISALS_NAV } from '@/lib/navigation/appraisals';
import { useAppraisal, useAppraisalRatings, useAcknowledgeAppraisal } from '@/hooks/hr';
import { useCurrentEmployee } from '@/hooks/hr/useCurrentEmployee';
import { toast } from '@/hooks/use-toast';

export default function AppraisalDetail() {
  const { id } = useParams();
  const { data: appraisal } = useAppraisal(id);
  const { data: ratings = [] } = useAppraisalRatings(id);
  const { data: me } = useCurrentEmployee();
  const ack = useAcknowledgeAppraisal();
  const [response, setResponse] = useState('');

  if (!id || !appraisal) return <AppLayout title="Appraisals" moduleNav={APPRAISALS_NAV}><div className="p-6">Loading…</div></AppLayout>;
  const isOwner = me?.id === appraisal.employee_id;
  const finalized = appraisal.status === 'completed' || appraisal.status === 'closed';
  const showManager = isOwner ? finalized : true;

  const onAck = async () => {
    await ack.mutateAsync({ id, response });
    toast({ title: 'Acknowledged' });
  };

  return (
    <AppLayout title="Appraisals" subtitle={(appraisal as any).appraisal_cycles?.name} moduleNav={APPRAISALS_NAV}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <Card className="p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Employee</p>
              <p className="font-medium">{(appraisal as any).employees?.full_name}</p>
            </div>
            <Badge variant="outline">{appraisal.status}</Badge>
          </div>
          {appraisal.final_overall_rating != null && (
            <p className="mt-3 text-lg">Final Rating: <b>{appraisal.final_overall_rating}</b></p>
          )}
          {appraisal.recommendation && (
            <p className="text-sm mt-1">Recommendation: <b>{appraisal.recommendation}</b>{appraisal.increment_percentage_recommended ? ` (+${appraisal.increment_percentage_recommended}%)` : ''}</p>
          )}
        </Card>
        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">Criteria</h2>
          {ratings.map((r: any) => (
            <div key={r.id} className="grid md:grid-cols-4 gap-2 text-sm border-b pb-2">
              <p className="md:col-span-2 font-medium">{r.appraisal_criteria?.criterion_name}</p>
              <p>Self: {r.self_rating ?? '—'}</p>
              {showManager && <p>Mgr: {r.manager_rating ?? '—'} · Final: {r.final_rating ?? '—'}</p>}
            </div>
          ))}
        </Card>
        {appraisal.strengths && <Card className="p-6"><h3 className="font-semibold mb-1">Strengths</h3><p className="text-sm whitespace-pre-wrap">{appraisal.strengths}</p></Card>}
        {appraisal.areas_of_improvement && <Card className="p-6"><h3 className="font-semibold mb-1">Improvements</h3><p className="text-sm whitespace-pre-wrap">{appraisal.areas_of_improvement}</p></Card>}
        {appraisal.hr_comments && finalized && <Card className="p-6"><h3 className="font-semibold mb-1">HR Comments</h3><p className="text-sm whitespace-pre-wrap">{appraisal.hr_comments}</p></Card>}

        {isOwner && appraisal.status === 'completed' && !appraisal.employee_acknowledgement && (
          <Card className="p-6 space-y-3">
            <h3 className="font-semibold">Acknowledge</h3>
            <Textarea value={response} onChange={(e) => setResponse(e.target.value)} />
            <Button onClick={onAck}>Acknowledge</Button>
          </Card>
        )}
        <div className="text-xs"><Link to="/appraisals/my-appraisals" className="text-primary underline">Back</Link></div>
      </div>
    </AppLayout>
  );
}