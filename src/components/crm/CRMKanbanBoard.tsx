// Odoo-style CRM Kanban Board — uses TanStack Query hooks (Supabase-ready)
import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select as SelectUI, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Search,
  Star,
  Clock,
  MoreVertical,
  List,
  LayoutGrid,
  ChevronDown,
  Activity,
  Phone,
  Mail,
  BarChart3,
  Users,
  SlidersHorizontal,
  X,
  Settings,
  Trash2,
  CalendarDays,
  Map,
  Building2,
  User,
  Loader2,
} from 'lucide-react';
import {
  type Opportunity,
  type Pipeline,
  type PipelineStage,
  type OpportunityStage,
} from '@/lib/services/crm';
import {
  useOpportunities,
  useDefaultPipeline,
  useUpdateOpportunityStage,
  useSaveOpportunity,
  useSaveActivity,
} from '@/hooks/crm/useCRMQueries';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { CRMSearchDropdown, useFilteredOpportunities, type ActiveFilters, EMPTY_FILTERS } from '@/components/crm/CRMSearchDropdown';
import { displayRevenue } from '@/lib/crm/fieldMask';

// Star rating (Odoo-style — golden stars)
export function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly && !onChange}
          onClick={(e) => {
            e.stopPropagation();
            onChange?.(value === star ? 0 : star);
          }}
          className={cn(
            'p-0 h-5 w-5 transition-colors',
            !readonly && 'cursor-pointer hover:text-amber-400',
            readonly && 'cursor-default',
          )}
        >
          <Star
            className={cn(
              'h-4 w-4',
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// Contact avatar (Odoo circle avatar with colored background)
function ContactAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = ['bg-[#00A09D]', 'bg-[#875A7B]', 'bg-[#F06050]', 'bg-[#6CC1ED]', 'bg-[#21B799]', 'bg-[#2C8397]', 'bg-[#E4A900]', 'bg-[#D5653E]'];
  const colorIndex = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const s = size === 'md' ? 'h-8 w-8 text-sm' : 'h-7 w-7 text-xs';
  return (
    <div className={cn('rounded-full text-white flex items-center justify-center font-bold shrink-0', colors[colorIndex], s)}>
      {initial}
    </div>
  );
}

// Revenue progress bar (colored segmented bar under column header)
function RevenueBar({ opportunities }: { opportunities: Opportunity[] }) {
  if (opportunities.length === 0) return null;
  const total = opportunities.reduce((s, o) => s + o.expectedRevenue, 0);
  if (total === 0) return null;

  return (
    <div className="flex h-[4px] w-full rounded-full overflow-hidden gap-[1px] mt-1">
      {opportunities.map((opp) => {
        const width = Math.max((opp.expectedRevenue / total) * 100, 5);
        const color = opp.probability >= 60 ? 'bg-[#00A09D]' : opp.probability >= 30 ? 'bg-[#21B799]' : 'bg-[#00A09D]';
        return (
          <div key={opp.id} className={cn('h-full rounded-sm', color)} style={{ flex: `${width} 0 0%` }} />
        );
      })}
    </div>
  );
}

// Kanban card — exact Odoo style from screenshot
function KanbanCard({
  opportunity,
  onPriorityChange,
  isFocused,
  onFocus,
  onKeyboardMove,
  cardRef,
  userId,
}: {
  opportunity: Opportunity;
  onPriorityChange: (p: 0 | 1 | 2 | 3) => void;
  isFocused: boolean;
  onFocus: () => void;
  onKeyboardMove: (dir: 'left' | 'right' | 'up' | 'down') => void;
  cardRef?: (el: HTMLDivElement | null) => void;
  userId?: string;
}) {
  const navigate = useNavigate();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [activityData, setActivityData] = useState({ type: 'task' as 'call' | 'meeting' | 'task' | 'follow_up', dueDate: '', note: '' });
  const [callData, setCallData] = useState({ duration: '', notes: '', outcome: '' });
  const saveActivityMutation = useSaveActivity();

  const handleSchedule = () => {
    if (!activityData.note.trim()) return;
    saveActivityMutation.mutate({
      type: activityData.type,
      subject: activityData.note.slice(0, 80),
      description: activityData.note,
      relatedTo: 'opportunity',
      relatedId: opportunity.id,
      userId: userId || '1',
      userName: opportunity.assignedTo || 'User',
      dueDate: activityData.dueDate || undefined,
      completed: false,
    } as any);
    setScheduleOpen(false);
    setActivityData({ type: 'task', dueDate: '', note: '' });
  };

  const handleLogCall = () => {
    saveActivityMutation.mutate({
      type: 'call',
      subject: `Call: ${callData.outcome || opportunity.name}`,
      description: `Duration: ${callData.duration || 'N/A'}\nNotes: ${callData.notes}\nOutcome: ${callData.outcome}`,
      relatedTo: 'opportunity',
      relatedId: opportunity.id,
      userId: userId || '1',
      userName: opportunity.assignedTo || 'User',
      completed: true,
      completedAt: new Date().toISOString(),
    } as any);
    setCallOpen(false);
    setCallData({ duration: '', notes: '', outcome: '' });
  };

  return (
    <>
    <div
      ref={cardRef}
      tabIndex={0}
      role="button"
      aria-label={`Opportunity ${opportunity.name}. Use arrow keys to navigate, Alt+arrow to move between stages, Enter to open.`}
      className={cn(
        'bg-card border border-border rounded px-3 py-2.5 cursor-pointer hover:shadow-md transition-shadow group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isFocused && 'ring-2 ring-primary ring-offset-1'
      )}
      onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          navigate(`/crm/opportunities/${opportunity.id}`);
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const dir = e.key.replace('Arrow', '').toLowerCase() as 'left' | 'right' | 'up' | 'down';
          onKeyboardMove(dir);
        }
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', opportunity.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      {/* Title — bold, uppercase-like as in Odoo */}
      <div className="font-semibold text-[13px] text-foreground leading-snug line-clamp-2">
        {opportunity.name}
      </div>

      {/* Revenue */}
      <div className="text-[13px] text-foreground mt-0.5">
        {displayRevenue(opportunity.expectedRevenue, userId, 'crm')}
      </div>

      {/* Contact with avatar */}
      {opportunity.contactName && (
        <div className="flex items-center gap-1.5 mt-1">
          <ContactAvatar name={opportunity.contactName} size="sm" />
          <span className="text-xs text-muted-foreground truncate">{opportunity.contactName}</span>
        </div>
      )}

      {/* Bottom: priority stars + activity icons + assignee avatar */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <StarRating value={opportunity.priority} onChange={onPriorityChange} />
          <div className="flex items-center gap-1 ml-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/40 hover:text-[#00A09D] transition-colors" onClick={(e) => { e.stopPropagation(); setScheduleOpen(true); }}>
                  <Clock className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Schedule Activity</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/40 hover:text-[#00A09D] transition-colors" onClick={(e) => { e.stopPropagation(); setCallOpen(true); }}>
                  <Phone className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Log Call</TooltipContent>
            </Tooltip>
          </div>
        </div>
        {/* Assignee avatar on right */}
        <ContactAvatar name={opportunity.assignedTo || opportunity.companyName || 'U'} />
      </div>
    </div>

    {/* Schedule Activity Dialog */}
    <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
      <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Schedule Activity — {opportunity.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Type</Label>
            <SelectUI value={activityData.type} onValueChange={(v) => setActivityData(d => ({ ...d, type: v as any }))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
              </SelectContent>
            </SelectUI>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Due Date</Label>
            <Input type="date" className="h-8 text-sm" value={activityData.dueDate} onChange={(e) => setActivityData(d => ({ ...d, dueDate: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Note</Label>
            <Textarea className="min-h-[80px] text-sm" value={activityData.note} onChange={(e) => setActivityData(d => ({ ...d, note: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setScheduleOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSchedule}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Log Call Dialog */}
    <Dialog open={callOpen} onOpenChange={setCallOpen}>
      <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Log Call — {opportunity.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Duration</Label>
            <Input className="h-8 text-sm" placeholder="e.g. 15 min" value={callData.duration} onChange={(e) => setCallData(d => ({ ...d, duration: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Outcome</Label>
            <Input className="h-8 text-sm" placeholder="e.g. Interested, Follow-up needed" value={callData.outcome} onChange={(e) => setCallData(d => ({ ...d, outcome: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Notes</Label>
            <Textarea className="min-h-[80px] text-sm" value={callData.notes} onChange={(e) => setCallData(d => ({ ...d, notes: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setCallOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={handleLogCall}>Log Call</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

// Kanban column — Odoo style with colored top border
function KanbanColumn({
  stage,
  opportunities,
  onDrop,
  onPriorityChange,
  onQuickCreate,
  focusedId,
  onCardFocus,
  onKeyboardMove,
  registerCardRef,
  userId,
}: {
  stage: PipelineStage;
  opportunities: Opportunity[];
  onDrop: (oppId: string, stageId: string, stage: OpportunityStage) => void;
  onPriorityChange: (oppId: string, priority: 0 | 1 | 2 | 3) => void;
  onQuickCreate: (stageId: string, stage: OpportunityStage) => void;
  focusedId: string | null;
  onCardFocus: (oppId: string) => void;
  onKeyboardMove: (oppId: string, dir: 'left' | 'right' | 'up' | 'down') => void;
  registerCardRef: (oppId: string, el: HTMLDivElement | null) => void;
  userId?: string;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickData, setQuickData] = useState({
    company: '', contact: '', name: '', email: '', phone: '', revenue: '',
  });
  const [quickPriority, setQuickPriority] = useState(0);
  const totalValue = opportunities.reduce((sum, o) => sum + o.expectedRevenue, 0);
  const stageMap: Record<string, OpportunityStage> = {
    new: 'new', qualified: 'qualified', proposition: 'proposition', won: 'won',
  };
  const saveOpportunityMutation = useSaveOpportunity();

  const handleQuickAdd = () => {
    if (quickData.name.trim() || quickData.company.trim()) {
      const oppStage = stageMap[stage.id] || 'new';
      saveOpportunityMutation.mutate({
        name: quickData.name || quickData.company,
        contactName: quickData.contact,
        companyName: quickData.company,
        email: quickData.email,
        phone: quickData.phone,
        expectedRevenue: parseFloat(quickData.revenue) || 0,
        priority: quickPriority as 0 | 1 | 2 | 3,
        stageId: stage.id,
        stage: oppStage,
      }, {
        onSuccess: () => {
          toast({ title: 'Opportunity created' });
          onQuickCreate(stage.id, oppStage);
        },
      });
      setShowQuickAdd(false);
      setQuickData({ company: '', contact: '', name: '', email: '', phone: '', revenue: '' });
      setQuickPriority(0);
    }
  };

  const handleEditClick = async () => {
    // Save as draft then navigate to detail
    if (quickData.name.trim() || quickData.company.trim()) {
      const oppStage = stageMap[stage.id] || 'new';
      const opp = await saveOpportunityMutation.mutateAsync({
        name: quickData.name || quickData.company,
        contactName: quickData.contact,
        companyName: quickData.company,
        email: quickData.email,
        phone: quickData.phone,
        expectedRevenue: parseFloat(quickData.revenue) || 0,
        priority: quickPriority as 0 | 1 | 2 | 3,
        stageId: stage.id,
        stage: oppStage,
      });
      navigate(`/crm/opportunities/${opp.id}`);
    }
    setShowQuickAdd(false);
    setQuickData({ company: '', contact: '', name: '', email: '', phone: '', revenue: '' });
    setQuickPriority(0);
  };

  return (
    <div
      className={cn(
        'w-[280px] flex flex-col shrink-0 transition-all',
        isDragOver && 'bg-primary/5 rounded'
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const oppId = e.dataTransfer.getData('text/plain');
        if (oppId) onDrop(oppId, stage.id, stageMap[stage.id] || 'new');
      }}
    >
      {/* Column header — Odoo style */}
      <div className="px-2 py-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-foreground">{stage.name}</span>
          <div className="flex items-center gap-1">
            {totalValue > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                ₹{(totalValue / 1000).toFixed(0)}k
              </span>
            )}
            <button
              onClick={() => setShowQuickAdd(true)}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <RevenueBar opportunities={opportunities} />
      </div>

      {/* Cards area */}
      <div className="flex-1 overflow-y-auto px-1 pb-1 space-y-1 min-h-[120px]">
        {opportunities.map((opp) => (
          <KanbanCard
            key={opp.id}
            opportunity={opp}
            onPriorityChange={(p) => onPriorityChange(opp.id, p)}
            isFocused={focusedId === opp.id}
            onFocus={() => onCardFocus(opp.id)}
            onKeyboardMove={(dir) => onKeyboardMove(opp.id, dir)}
            cardRef={(el) => registerCardRef(opp.id, el)}
            userId={userId}
          />
        ))}

        {/* Quick create form — exact Odoo style from screenshot 3 */}
        {showQuickAdd ? (
          <div className="bg-card border border-border rounded p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Company"
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.company}
                onChange={(e) => setQuickData({ ...quickData, company: e.target.value })}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Contact name"
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.contact}
                onChange={(e) => setQuickData({ ...quickData, contact: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Opportunity name"
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.name}
                onChange={(e) => setQuickData({ ...quickData, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Email"
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.email}
                onChange={(e) => setQuickData({ ...quickData, email: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Phone"
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.phone}
                onChange={(e) => setQuickData({ ...quickData, phone: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium w-3.5 text-center shrink-0">₹</span>
              <Input
                placeholder="Revenue"
                type="number"
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary flex-1"
                value={quickData.revenue}
                onChange={(e) => setQuickData({ ...quickData, revenue: e.target.value })}
              />
              <StarRating value={quickPriority} onChange={(v) => setQuickPriority(v)} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <Button size="sm" className="h-7 text-xs px-3 bg-[#875A7B] hover:bg-[#6e4a64] text-white" onClick={handleQuickAdd}>Add</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={handleEditClick}>
                  Edit
                </Button>
              </div>
              <button
                className="text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => { setShowQuickAdd(false); setQuickData({ company: '', contact: '', name: '', email: '', phone: '', revenue: '' }); setQuickPriority(0); }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface CRMKanbanBoardProps {
  onNewOpportunity?: () => void;
  view?: 'kanban' | 'list';
  onViewChange?: (view: 'kanban' | 'list') => void;
}

export function CRMKanbanBoard({ onNewOpportunity, view = 'kanban', onViewChange }: CRMKanbanBoardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canCreateOpportunities, canEditOpportunities, filterByScope } = useCRMPermissions();
  const { user } = useAuth();

  const { data: allOpportunities = [], isFetching } = useOpportunities();
  const { data: pipelineData } = useDefaultPipeline();
  const updateStageMutation = useUpdateOpportunityStage();
  const saveOpportunityMutation = useSaveOpportunity();
  const opportunities = useMemo(() => filterByScope(allOpportunities), [allOpportunities, filterByScope]);

  // Fallback empty pipeline while loading so hooks below remain stable
  const pipeline: Pipeline = pipelineData ?? { id: '', name: '', description: '', stages: [], isDefault: false, createdAt: '', updatedAt: '' };
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

  const activeStages = useMemo(() => {
    const stages = pipeline.stages.filter(s => s.id !== 'lost');
    // Show the Lost column when the Lost filter is active
    if (activeFilters.filters.has('lost')) {
      const lostStage = pipeline.stages.find(s => s.id === 'lost');
      if (lostStage && !stages.find(s => s.id === 'lost')) {
        stages.push(lostStage);
      }
    }
    return stages;
  }, [pipeline.stages, activeFilters.filters]);

  // Apply filters
  const filteredOpportunities = useFilteredOpportunities(
    // Default: exclude lost unless "Lost" filter is active
    activeFilters.filters.has('lost') ? opportunities : opportunities.filter(o => o.stage !== 'lost'),
    activeFilters,
    user?.id,
  );

  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<string, Opportunity[]> = {};
    activeStages.forEach((stage) => {
      grouped[stage.id] = filteredOpportunities.filter((o) => o.stageId === stage.id);
    });
    return grouped;
  }, [filteredOpportunities, activeStages]);

  const handleDrop = useCallback(
    (oppId: string, stageId: string, stage: OpportunityStage) => {
      if (!canEditOpportunities) return;
      updateStageMutation.mutate({ id: oppId, stageId, stage });
      const stageName = pipeline.stages.find((s) => s.id === stageId)?.name;
      toast({ title: `Moved to ${stageName}` });
    },
    [canEditOpportunities, pipeline.stages, toast, updateStageMutation]
  );

  const handlePriorityChange = useCallback(
    (oppId: string, priority: 0 | 1 | 2 | 3) => {
      const opp = opportunities.find(o => o.id === oppId);
      if (opp) {
        saveOpportunityMutation.mutate({ ...opp, priority });
      }
    },
    [opportunities, saveOpportunityMutation]
  );

  const handleQuickCreate = useCallback(
    (_stageId: string, _stage: OpportunityStage) => {
      // React Query invalidation in useSaveOpportunity handles refresh.
    },
    []
  );

  // ============== Keyboard navigation ==============
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement>>({});

  const registerCardRef = useCallback((oppId: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current[oppId] = el;
    else delete cardRefs.current[oppId];
  }, []);

  const focusCard = useCallback((oppId: string | null) => {
    setFocusedId(oppId);
    if (oppId) {
      // Defer focus to next frame so DOM updates settle
      requestAnimationFrame(() => {
        cardRefs.current[oppId]?.focus();
      });
    }
  }, []);

  const stageMap: Record<string, OpportunityStage> = {
    new: 'new', qualified: 'qualified', proposition: 'proposition', won: 'won', lost: 'lost' as OpportunityStage,
  };

  const handleKeyboardMove = useCallback(
    (oppId: string, dir: 'left' | 'right' | 'up' | 'down') => {
      const opp = allOpportunities.find(o => o.id === oppId);
      if (!opp) return;
      const stageIdx = activeStages.findIndex(s => s.id === opp.stageId);
      if (stageIdx === -1) return;
      const currentColumn = opportunitiesByStage[opp.stageId] || [];
      const cardIdx = currentColumn.findIndex(o => o.id === oppId);

      // Up/Down — move focus within column
      if (dir === 'up' || dir === 'down') {
        const nextIdx = dir === 'up' ? cardIdx - 1 : cardIdx + 1;
        const target = currentColumn[nextIdx];
        if (target) focusCard(target.id);
        return;
      }

      // Left/Right — move card to adjacent stage (requires edit permission)
      if (!canEditOpportunities) {
        toast({ title: 'You don\'t have permission to move opportunities', variant: 'destructive' });
        return;
      }
      const nextStageIdx = dir === 'left' ? stageIdx - 1 : stageIdx + 1;
      const nextStage = activeStages[nextStageIdx];
      if (!nextStage) return;
      const nextStageType = stageMap[nextStage.id] || 'new';
      updateStageMutation.mutate({ id: oppId, stageId: nextStage.id, stage: nextStageType });
      toast({ title: `Moved to ${nextStage.name}` });
      // Re-focus the same card after re-render
      focusCard(oppId);
    },
    [allOpportunities, activeStages, opportunitiesByStage, canEditOpportunities, focusCard, toast, updateStageMutation]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Odoo-style control panel */}
      <div className="border-b border-border bg-card px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          {/* Left: New + Pipeline label */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onNewOpportunity}
              className="gap-1 bg-[#875A7B] hover:bg-[#6e4a64] text-white h-8 text-xs font-semibold rounded"
              disabled={!canCreateOpportunities}
            >
              New
            </Button>
            <span className="text-sm font-semibold text-foreground">Pipeline</span>
            <Settings className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => navigate('/settings/crm-pipelines')} />
          </div>

          <CRMSearchDropdown activeFilters={activeFilters} onFiltersChange={setActiveFilters} />

          {/* Right: View toggle icons */}
          <div className="flex items-center gap-1">
            {[
              { icon: LayoutGrid, id: 'kanban' as const, title: 'Kanban' },
              { icon: List, id: 'list' as const, title: 'List' },
              { icon: Clock, id: null, title: 'Activity' },
            ].map(({ icon: Icon, id, title }) => (
              <Tooltip key={title}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => id && onViewChange?.(id)}
                    disabled={!id}
                    className={cn(
                      'h-8 w-8 flex items-center justify-center rounded transition-colors',
                      id && view === id ? 'bg-muted text-foreground' : !id ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{!id ? 'Coming soon' : title}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-3 pb-3 pt-2 bg-muted/20">
        <div className="flex gap-1 h-full min-w-max">
          {activeStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              opportunities={opportunitiesByStage[stage.id] || []}
              onDrop={handleDrop}
              onPriorityChange={handlePriorityChange}
              onQuickCreate={handleQuickCreate}
              focusedId={focusedId}
              onCardFocus={(id) => setFocusedId(id)}
              onKeyboardMove={handleKeyboardMove}
              registerCardRef={registerCardRef}
              userId={user?.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
