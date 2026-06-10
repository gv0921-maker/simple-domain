import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { APPRAISALS_NAV } from '@/lib/navigation/appraisals';
import {
  useAppraisalTemplates, useCreateTemplate, useDeleteTemplate,
  useAppraisalCriteria, useCreateCriterion, useDeleteCriterion,
} from '@/hooks/hr';

const CATS = ['kpi','competency','goal','behavioral','skill'] as const;
const SCALES = ['1_to_5','1_to_10','percentage'] as const;

export default function AdminTemplates() {
  const { data: tpls = [] } = useAppraisalTemplates();
  const createTpl = useCreateTemplate();
  const delTpl = useDeleteTemplate();
  const [sel, setSel] = useState<string | null>(null);
  const { data: crit = [] } = useAppraisalCriteria(sel ?? undefined);
  const createCrit = useCreateCriterion();
  const delCrit = useDeleteCriterion();

  const [newTplName, setNewTplName] = useState('');
  const [c, setC] = useState({ criterion_name: '', category: 'kpi' as any, weightage_percentage: 0, rating_scale: '1_to_5' as any });
  const totalWeight = crit.reduce((s, r) => s + Number(r.weightage_percentage || 0), 0);

  return (
    <AppLayout title="Appraisals" subtitle="Templates" moduleNav={APPRAISALS_NAV}>
      <div className="p-4 md:p-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Templates</h3>
          <div className="flex gap-2">
            <Input value={newTplName} onChange={(e) => setNewTplName(e.target.value)} />
            <Button size="sm" onClick={async () => { if (!newTplName) return; await createTpl.mutateAsync({ name: newTplName } as any); setNewTplName(''); }}>Add</Button>
          </div>
          <div className="space-y-1">
            {tpls.map((t) => (
              <div key={t.id} className={`p-2 rounded border cursor-pointer flex justify-between ${sel === t.id ? 'bg-accent' : ''}`} onClick={() => setSel(t.id)}>
                <span className="text-sm">{t.name}</span>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); delTpl.mutate(t.id); }}>×</Button>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4 md:col-span-2 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Criteria</h3>
            {sel && <Badge variant={totalWeight === 100 ? 'default' : 'destructive'}>Total: {totalWeight}%</Badge>}
          </div>
          {!sel ? <p className="text-sm text-muted-foreground">Select a template.</p> : (
            <>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4"><Label className="text-xs">Name</Label><Input value={c.criterion_name} onChange={(e) => setC({ ...c, criterion_name: e.target.value })} /></div>
                <div className="col-span-3"><Label className="text-xs">Category</Label>
                  <Select value={c.category} onValueChange={(v) => setC({ ...c, category: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-xs">Weight %</Label><Input type="number" value={c.weightage_percentage} onChange={(e) => setC({ ...c, weightage_percentage: Number(e.target.value) })} /></div>
                <div className="col-span-2"><Label className="text-xs">Scale</Label>
                  <Select value={c.rating_scale} onValueChange={(v) => setC({ ...c, rating_scale: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SCALES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="col-span-1" onClick={async () => {
                  if (!c.criterion_name) return;
                  await createCrit.mutateAsync({ ...c, template_id: sel } as any);
                  setC({ criterion_name: '', category: 'kpi', weightage_percentage: 0, rating_scale: '1_to_5' });
                }}>Add</Button>
              </div>
              <div className="space-y-1">
                {crit.map((r) => (
                  <div key={r.id} className="p-2 border rounded flex justify-between text-sm">
                    <span>{r.criterion_name} <span className="text-xs text-muted-foreground">({r.category}, {r.rating_scale})</span></span>
                    <div className="flex gap-2 items-center">
                      <span>{r.weightage_percentage}%</span>
                      <Button variant="ghost" size="sm" onClick={() => delCrit.mutate(r.id)}>×</Button>
                    </div>
                  </div>
                ))}
              </div>
              {totalWeight !== 100 && crit.length > 0 && (
                <p className="text-xs text-destructive">Weights must sum to 100%. Current: {totalWeight}%.</p>
              )}
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}