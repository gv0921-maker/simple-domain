// CRM Pipelines management (multi-pipeline + drag-and-drop stage editor)
import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Trash2, GripVertical, Star, Edit, Save, X, GitBranch,
  ChevronDown, Zap,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SETTINGS_NAV } from '@/lib/navigation/settings';

const AUTOMATION_HOOKS = [
  { id: 'notify', label: 'Send notification' },
  { id: 'follow_up', label: 'Create follow-up activity' },
  { id: 'update_prob', label: 'Update probability' },
  { id: 'assign_team', label: 'Assign to team' },
];
import {
  getPipelines, savePipeline, getDefaultPipeline,
  deletePipeline, setDefaultPipeline,
  type Pipeline, type PipelineStage,
} from '@/lib/data/crm';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function CRMPipelinesSettings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canModifyPipeline } = useCRMPermissions();
  const [pipelines, setPipelines] = useState<Pipeline[]>(() => getPipelines());
  const [selectedId, setSelectedId] = useState<string>(() => getDefaultPipeline().id);
  const selected = useMemo(() => pipelines.find(p => p.id === selectedId), [pipelines, selectedId]);
  const [draggedStage, setDraggedStage] = useState<string | null>(null);

  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const refresh = () => setPipelines(getPipelines());

  useEffect(() => {
    if (!selected && pipelines[0]) setSelectedId(pipelines[0].id);
  }, [selected, pipelines]);

  if (!canModifyPipeline) {
    return (
      <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">You do not have permission to modify pipeline stages.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/settings')}>Back to Settings</Button>
        </div>
      </AppLayout>
    );
  }

  const handleCreatePipeline = () => {
    if (!newName.trim()) return;
    const p = savePipeline({
      name: newName,
      isDefault: false,
      stages: [
        { id: crypto.randomUUID(), pipelineId: '', name: 'New', order: 1, probability: 10, color: 'hsl(210, 70%, 55%)' },
        { id: crypto.randomUUID(), pipelineId: '', name: 'Won', order: 2, probability: 100, color: 'hsl(142, 60%, 45%)' },
      ],
    });
    // Patch stages with the actual pipelineId
    savePipeline({ ...p, stages: p.stages.map(s => ({ ...s, pipelineId: p.id })) });
    refresh();
    setSelectedId(p.id);
    setNewDialogOpen(false);
    setNewName('');
    toast({ title: 'Pipeline created' });
  };

  const handleDeletePipeline = (id: string) => {
    const r = deletePipeline(id);
    if (!r.success) {
      toast({ title: 'Cannot delete pipeline', description: r.reason, variant: 'destructive' });
      return;
    }
    refresh();
    toast({ title: 'Pipeline deleted' });
  };

  const handleMakeDefault = (id: string) => {
    setDefaultPipeline(id);
    refresh();
    toast({ title: 'Default pipeline updated' });
  };

  // Stage operations on the selected pipeline
  const updateStages = (next: PipelineStage[]) => {
    if (!selected) return;
    savePipeline({ ...selected, stages: next });
    refresh();
  };

  const handleAddStage = () => {
    if (!selected) return;
    const newStage: PipelineStage = {
      id: crypto.randomUUID(),
      pipelineId: selected.id,
      name: 'New stage',
      order: selected.stages.length + 1,
      probability: 50,
      color: 'hsl(220, 50%, 60%)',
    };
    updateStages([...selected.stages, newStage]);
  };

  const handleStageChange = (id: string, patch: Partial<PipelineStage>) => {
    if (!selected) return;
    updateStages(selected.stages.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const handleDeleteStage = (id: string) => {
    if (!selected) return;
    if (selected.stages.length <= 2) {
      toast({ title: 'A pipeline must have at least 2 stages', variant: 'destructive' });
      return;
    }
    updateStages(selected.stages.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleReorder = (draggedId: string, overId: string) => {
    if (!selected || draggedId === overId) return;
    const stages = [...selected.stages];
    const fromIdx = stages.findIndex(s => s.id === draggedId);
    const toIdx = stages.findIndex(s => s.id === overId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = stages.splice(fromIdx, 1);
    stages.splice(toIdx, 0, moved);
    updateStages(stages.map((s, i) => ({ ...s, order: i + 1 })));
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-medium">CRM Pipelines</h1>
              <p className="text-sm text-muted-foreground">Manage multiple sales pipelines and their stages</p>
            </div>
          </div>
          <Button onClick={() => setNewDialogOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> New Pipeline
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pipelines list */}
          <div className="space-y-2">
            {pipelines.map(p => (
              <Card
                key={p.id}
                className={cn(
                  'p-3 cursor-pointer transition-colors',
                  selectedId === p.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                )}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {p.name}
                      {p.isDefault && <Badge variant="default" className="text-[10px] h-4 px-1.5">Default</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.stages.length} stages</div>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {!p.isDefault && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMakeDefault(p.id)} title="Make default">
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePipeline(p.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Stage editor */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-medium">Stages — {selected.name}</h2>
                  <Button size="sm" variant="outline" onClick={handleAddStage} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add stage
                  </Button>
                </div>

                <div className="space-y-2">
                  {selected.stages.map(stage => (
                    <div key={stage.id} className="space-y-0">
                    <div
                      draggable
                      onDragStart={() => setDraggedStage(stage.id)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => { if (draggedStage) { handleReorder(draggedStage, stage.id); setDraggedStage(null); } }}
                      className="flex items-center gap-2 border border-border rounded-md p-2 bg-card hover:bg-muted/30 transition-colors"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                      <div
                        className="h-6 w-6 rounded shrink-0 border border-border"
                        style={{ backgroundColor: stage.color }}
                      />
                      <Input
                        value={stage.name}
                        onChange={e => handleStageChange(stage.id, { name: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <Label className="text-xs text-muted-foreground">Prob</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={stage.probability}
                          onChange={e => handleStageChange(stage.id, { probability: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                          className="h-8 text-sm w-16"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      <Input
                        type="color"
                        value={hslToHex(stage.color)}
                        onChange={e => handleStageChange(stage.id, { color: hexToHsl(e.target.value) })}
                        className="h-8 w-12 p-1 cursor-pointer shrink-0"
                        title="Stage color"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => handleDeleteStage(stage.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {/* Automation hooks */}
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-8 -mt-1 mb-1">
                        <Zap className="h-3 w-3" />
                        <span>Automation hooks</span>
                        <ChevronDown className="h-3 w-3" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-8 mb-2 pl-2 border-l-2 border-muted space-y-1">
                        {AUTOMATION_HOOKS.map(hook => {
                          const checked = stage.automationHooks?.includes(hook.id) ?? false;
                          return (
                            <label key={hook.id} className="flex items-center gap-2 text-xs cursor-pointer">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={v => {
                                  const hooks = stage.automationHooks ?? [];
                                  const next = v ? [...hooks, hook.id] : hooks.filter(h => h !== hook.id);
                                  handleStageChange(stage.id, { automationHooks: next });
                                }}
                              />
                              {hook.label}
                            </label>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Drag the handle on the left to reorder stages. Changes save automatically.
                </p>
              </Card>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">Select a pipeline to edit its stages</Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs">Pipeline name</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePipeline}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Color converters (HSL string <-> hex) for native color picker
function hslToHex(hslStr: string): string {
  const m = hslStr.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/);
  if (!m) return '#888888';
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  const toHex = (x: number) => x.toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}
