// Odoo-style CRM Kanban Board — pixel-perfect replica from reference screenshots
import { useState, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import {
  getOpportunities,
  getDefaultPipeline,
  updateOpportunityStage,
  saveOpportunity,
  type Opportunity,
  type Pipeline,
  type PipelineStage,
  type OpportunityStage,
} from '@/lib/data/crm';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { cn } from '@/lib/utils';

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
function KanbanCard({ opportunity, onPriorityChange }: { opportunity: Opportunity; onPriorityChange: (p: 0 | 1 | 2 | 3) => void }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-card border border-border rounded px-3 py-2.5 cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
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
        ₹ {opportunity.expectedRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                <button className="text-muted-foreground/40 hover:text-[#00A09D] transition-colors" onClick={(e) => e.stopPropagation()}>
                  <Clock className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Schedule Activity</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/40 hover:text-[#00A09D] transition-colors" onClick={(e) => e.stopPropagation()}>
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
  );
}

// Kanban column — Odoo style with colored top border
function KanbanColumn({
  stage,
  opportunities,
  onDrop,
  onPriorityChange,
  onQuickCreate,
}: {
  stage: PipelineStage;
  opportunities: Opportunity[];
  onDrop: (oppId: string, stageId: string, stage: OpportunityStage) => void;
  onPriorityChange: (oppId: string, priority: 0 | 1 | 2 | 3) => void;
  onQuickCreate: (stageId: string, stage: OpportunityStage) => void;
}) {
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

  const handleQuickAdd = () => {
    if (quickData.name.trim() || quickData.company.trim()) {
      onQuickCreate(stage.id, stageMap[stage.id] || 'new');
      setShowQuickAdd(false);
      setQuickData({ company: '', contact: '', name: '', email: '', phone: '', revenue: '' });
      setQuickPriority(0);
    }
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
          />
        ))}

        {/* Quick create form — exact Odoo style from screenshot 3 */}
        {showQuickAdd ? (
          <div className="bg-card border border-border rounded p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder=""
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.company}
                onChange={(e) => setQuickData({ ...quickData, company: e.target.value })}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder=""
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.contact}
                onChange={(e) => setQuickData({ ...quickData, contact: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder=""
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.name}
                onChange={(e) => setQuickData({ ...quickData, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder=""
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.email}
                onChange={(e) => setQuickData({ ...quickData, email: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                placeholder=""
                className="h-7 text-xs border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary"
                value={quickData.phone}
                onChange={(e) => setQuickData({ ...quickData, phone: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium w-3.5 text-center shrink-0">₹</span>
              <Input
                placeholder=""
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
                <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={() => { setShowQuickAdd(false); setQuickData({ company: '', contact: '', name: '', email: '', phone: '', revenue: '' }); setQuickPriority(0); }}>
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

  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>(() => getOpportunities());
  const opportunities = useMemo(() => filterByScope(allOpportunities), [allOpportunities, filterByScope]);
  const [pipeline] = useState<Pipeline>(() => getDefaultPipeline());
  const [search, setSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const activeStages = useMemo(() => pipeline.stages.filter(s => s.id !== 'lost'), [pipeline.stages]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(
      (o) =>
        o.stage !== 'lost' &&
        (o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.contactName.toLowerCase().includes(search.toLowerCase()) ||
        (o.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false))
    );
  }, [opportunities, search]);

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
      updateOpportunityStage(oppId, stageId, stage);
      setAllOpportunities(getOpportunities());
      const stageName = pipeline.stages.find((s) => s.id === stageId)?.name;
      toast({ title: `Moved to ${stageName}` });
    },
    [canEditOpportunities, pipeline.stages, toast]
  );

  const handlePriorityChange = useCallback(
    (oppId: string, priority: 0 | 1 | 2 | 3) => {
      const opp = opportunities.find(o => o.id === oppId);
      if (opp) {
        saveOpportunity({ ...opp, priority });
        setAllOpportunities(getOpportunities());
      }
    },
    [opportunities]
  );

  const handleQuickCreate = useCallback(
    (stageId: string, stage: OpportunityStage) => {
      onNewOpportunity?.();
    },
    [onNewOpportunity]
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
            <Settings className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
          </div>

          {/* Center: Search bar with dropdown */}
          <div className="relative flex-1 max-w-md">
            <div className="relative flex items-center border border-border rounded bg-card overflow-hidden">
              <Search className="h-4 w-4 text-muted-foreground ml-2.5" />
              <input
                placeholder=""
                className="h-8 w-full text-sm bg-transparent border-0 outline-none px-2 placeholder:text-muted-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              />
              <button
                className="h-8 w-8 flex items-center justify-center border-l border-border text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Odoo search dropdown — 3 columns: Filters, Group By, Favorites */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 p-4">
                <div className="grid grid-cols-3 gap-6 text-sm">
                  {/* Filters */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-[#875A7B]" />
                      <span className="font-bold text-foreground">Filters</span>
                    </div>
                    <div className="space-y-1">
                      {['My Pipeline', 'Unassigned', 'Open Opportunities', '', 'Unread Messages', '', 'Creation Date', 'Closed Date', '', 'Won', 'Ongoing', 'Rotting', 'Lost', '', 'Custom Filter...'].map((item, i) =>
                        item === '' ? <div key={i} className="h-1" /> : (
                          <button key={i} className="block w-full text-left px-1 py-0.5 text-sm text-primary hover:bg-muted/50 rounded transition-colors">
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Group By */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="h-3.5 w-3.5 text-[#00A09D]" />
                      <span className="font-bold text-foreground">Group By</span>
                    </div>
                    <div className="space-y-1">
                      {['Salesperson', 'Sales Team', 'Stage', 'City', 'Country', 'Lost Reason', 'Campaign', 'Medium', 'Source', '', 'Creation Date', 'Expected Closing', 'Closed Date', '', 'Properties', '', 'Custom Group'].map((item, i) =>
                        item === '' ? <div key={i} className="h-1" /> : (
                          <button key={i} className="block w-full text-left px-1 py-0.5 text-sm text-foreground hover:bg-muted/50 rounded transition-colors">
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Favorites */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-foreground">Favorites</span>
                    </div>
                    <div className="space-y-1">
                      {['Follow-Up Report', 'Monthly Report', 'Weekly Report', '', 'Default Pipeline', '', 'Save current search'].map((item, i) =>
                        item === '' ? <div key={i} className="h-1" /> : (
                          <button key={i} className="block w-full text-left px-1 py-0.5 text-sm text-foreground hover:bg-muted/50 rounded transition-colors">
                            {item}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                    className={cn(
                      'h-8 w-8 flex items-center justify-center rounded transition-colors',
                      id && view === id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{title}</TooltipContent>
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
