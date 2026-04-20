// CRM Pipeline Stage Editor — drag-to-reorder stages, edit name/probability/color, manage multiple pipelines
import { useMemo, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  GripVertical,
  Star,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CRM_NAV } from '@/lib/navigation/crm';
import {
  getPipelines,
  savePipeline,
  deletePipeline,
  setDefaultPipeline,
  type Pipeline,
  type PipelineStage,
} from '@/lib/data/crm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminUser } from '@/lib/data/rbac';
import { cn } from '@/lib/utils';

const DEFAULT_STAGE_COLORS = [
  'hsl(210, 70%, 55%)',
  'hsl(174, 60%, 45%)',
  'hsl(38, 90%, 55%)',
  'hsl(142, 60%, 45%)',
  'hsl(280, 60%, 55%)',
  'hsl(0, 70%, 55%)',
];

function nextStageId(): string {
  return `stage_${Math.random().toString(36).slice(2, 9)}`;
}

export default function CRMPipelinesSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user ? isSuperAdminUser(user.id) || user.role === 'admin' : false;

  const [pipelines, setPipelines] = useState<Pipeline[]>(() => getPipelines());
  const [activeId, setActiveId] = useState<string>(() => {
    const all = getPipelines();
    return (all.find(p => p.isDefault) || all[0])?.id || '';
  });
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [confirmDeletePipeline, setConfirmDeletePipeline] = useState<string | null>(null);

  const active = useMemo(() => pipelines.find(p => p.id === activeId), [pipelines, activeId]);

  const refresh = useCallback(() => {
    setPipelines(getPipelines());
  }, []);

  if (!isAdmin) {
    return (
      <AppLayout title="CRM" moduleNav={CRM_NAV}>
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              You need admin privileges to manage pipelines.
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const updateActive = (mut: (p: Pipeline) => Pipeline) => {
    if (!active) return;
    const updated = mut(active);
    savePipeline(updated);
    refresh();
    setActiveId(updated.id);
  };

  const handleAddStage = () => {
    if (!active) return;
    const order = active.stages.length + 1;
    const color = DEFAULT_STAGE_COLORS[active.stages.length % DEFAULT_STAGE_COLORS.length];
    const newStage: PipelineStage = {
      id: nextStageId(),
      pipelineId: active.id,
      name: 'New Stage',
      order,
      probability: 50,
      color,
    };
    updateActive(p => ({ ...p, stages: [...p.stages, newStage] }));
    toast({ title: 'Stage added' });
  };

  const handleDeleteStage = (stageId: string) => {
    if (!active) return;
    if (active.stages.length <= 1) {
      toast({ title: 'A pipeline must have at least one stage', variant: 'destructive' });
      return;
    }
    updateActive(p => ({
      ...p,
      stages: p.stages
        .filter(s => s.id !== stageId)
        .map((s, i) => ({ ...s, order: i + 1 })),
    }));
    toast({ title: 'Stage removed' });
  };

  const handleStageField = (stageId: string, patch: Partial<PipelineStage>) => {
    updateActive(p => ({
      ...p,
      stages: p.stages.map(s => (s.id === stageId ? { ...s, ...patch } : s)),
    }));
  };

  const handleDragStart = (stageId: string) => setDraggedStageId(stageId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDropOn = (targetStageId: string) => {
    if (!active || !draggedStageId || draggedStageId === targetStageId) return;
    const stages = [...active.stages];
    const fromIdx = stages.findIndex(s => s.id === draggedStageId);
    const toIdx = stages.findIndex(s => s.id === targetStageId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = stages.splice(fromIdx, 1);
    stages.splice(toIdx, 0, moved);
    updateActive(p => ({ ...p, stages: stages.map((s, i) => ({ ...s, order: i + 1 })) }));
    setDraggedStageId(null);
  };

  const handleCreatePipeline = () => {
    const name = newPipelineName.trim();
    if (!name) return;
    const created = savePipeline({
      name,
      isDefault: false,
      stages: [
        { id: nextStageId(), pipelineId: '', name: 'New', order: 1, probability: 10, color: DEFAULT_STAGE_COLORS[0] },
        { id: nextStageId(), pipelineId: '', name: 'Qualified', order: 2, probability: 30, color: DEFAULT_STAGE_COLORS[1] },
        { id: nextStageId(), pipelineId: '', name: 'Won', order: 3, probability: 100, color: DEFAULT_STAGE_COLORS[3] },
      ],
    });
    // Patch pipelineId on stages
    savePipeline({ ...created, stages: created.stages.map(s => ({ ...s, pipelineId: created.id })) });
    refresh();
    setActiveId(created.id);
    setNewPipelineName('');
    setShowNewPipeline(false);
    toast({ title: 'Pipeline created' });
  };

  const handleDeletePipeline = () => {
    if (!confirmDeletePipeline) return;
    const result = deletePipeline(confirmDeletePipeline);
    if (!result.ok) {
      toast({ title: 'Cannot delete pipeline', description: result.reason, variant: 'destructive' });
    } else {
      toast({ title: 'Pipeline deleted' });
      const remaining = getPipelines();
      setPipelines(remaining);
      setActiveId((remaining.find(p => p.isDefault) || remaining[0])?.id || '');
    }
    setConfirmDeletePipeline(null);
  };

  const handleSetDefault = (id: string) => {
    setDefaultPipeline(id);
    refresh();
    toast({ title: 'Default pipeline updated' });
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/crm')}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1"
            >
              CRM <ChevronRight className="h-3 w-3" /> Settings <ChevronRight className="h-3 w-3" /> Pipelines
            </button>
            <h1 className="text-2xl font-semibold">Pipeline Editor</h1>
            <p className="text-muted-foreground text-sm">
              Drag to reorder stages. Configure probability, color, and multiple pipelines.
            </p>
          </div>
          <Button onClick={() => setShowNewPipeline(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" /> New Pipeline
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Pipeline list */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold">Pipelines</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {pipelines.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors',
                      activeId === p.id && 'bg-muted'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.stages.length} stages</p>
                    </div>
                    {p.isDefault && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Star className="h-2.5 w-2.5 fill-current" /> Default
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stage editor */}
          {active ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Input
                    value={active.name}
                    onChange={(e) => updateActive(p => ({ ...p, name: e.target.value }))}
                    className="text-base font-semibold h-9 max-w-md"
                  />
                  {!active.isDefault && (
                    <Button variant="outline" size="sm" onClick={() => handleSetDefault(active.id)}>
                      <Star className="h-3.5 w-3.5 mr-1" /> Set as default
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleAddStage} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add Stage
                  </Button>
                  {!active.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDeletePipeline(active.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {active.stages
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((stage) => (
                      <div
                        key={stage.id}
                        draggable
                        onDragStart={() => handleDragStart(stage.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDropOn(stage.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-md border bg-card transition-all',
                          draggedStageId === stage.id && 'opacity-50',
                          'hover:border-primary/40'
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                        <div
                          className="h-7 w-7 rounded-full shrink-0 border border-border"
                          style={{ backgroundColor: stage.color }}
                          title="Stage color"
                        >
                          <input
                            type="color"
                            value={stage.color.startsWith('#') ? stage.color : '#888888'}
                            onChange={(e) => handleStageField(stage.id, { color: e.target.value })}
                            className="opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Stage name</Label>
                            <Input
                              value={stage.name}
                              onChange={(e) => handleStageField(stage.id, { name: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Probability (%)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={stage.probability}
                              onChange={(e) =>
                                handleStageField(stage.id, {
                                  probability: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                                })
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteStage(stage.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Select or create a pipeline.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New pipeline dialog */}
      <Dialog open={showNewPipeline} onOpenChange={setShowNewPipeline}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Pipeline</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs">Pipeline name</Label>
            <Input
              autoFocus
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePipeline(); }}
              placeholder=""
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPipeline(false)}>Cancel</Button>
            <Button onClick={handleCreatePipeline} disabled={!newPipelineName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDeletePipeline} onOpenChange={(o) => !o && setConfirmDeletePipeline(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete pipeline?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The pipeline must not be in use by any opportunities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePipeline} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
