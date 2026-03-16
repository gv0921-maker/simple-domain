// Odoo-style CRM Kanban Board — pixel-perfect replica
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  GripVertical,
  Activity,
  Phone,
  Mail,
  CalendarClock,
  BarChart3,
  Users,
  SlidersHorizontal,
  X,
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

// Odoo tag color palette (exact Odoo colors)
const TAG_COLORS: Record<string, string> = {
  'Design': 'bg-[#00A09D] text-white',
  'Product': 'bg-[#F06050] text-white',
  'Information': 'bg-[#6CC1ED] text-white',
  'Training': 'bg-[#F7CD1F] text-[#4c4c4c]',
  'Consulting': 'bg-[#814968] text-white',
  'Services': 'bg-[#EB7E7F] text-white',
  'Other': 'bg-[#2C8397] text-white',
};

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || 'bg-muted text-muted-foreground';
}

// Star rating (Odoo-style)
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
            'p-0 h-4 w-4 transition-colors',
            !readonly && 'cursor-pointer hover:text-amber-400',
            readonly && 'cursor-default',
          )}
        >
          <Star
            className={cn(
              'h-3.5 w-3.5',
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// Odoo-style revenue progress bar (segmented colored bar)
function RevenueBar({ opportunities }: { opportunities: Opportunity[] }) {
  if (opportunities.length === 0) return null;
  const maxRev = Math.max(...opportunities.map(o => o.expectedRevenue), 1);

  return (
    <div className="flex h-[3px] w-full rounded-full overflow-hidden gap-[1px] mt-1.5">
      {opportunities.map((opp) => {
        const width = Math.max((opp.expectedRevenue / maxRev) * 100, 8);
        const color = opp.probability >= 60 ? 'bg-[#00A09D]' : opp.probability >= 30 ? 'bg-[#F7CD1F]' : 'bg-[#F06050]';
        return (
          <div key={opp.id} className={cn('h-full rounded-sm', color)} style={{ flex: `${width} 0 0%` }} />
        );
      })}
    </div>
  );
}

// Contact avatar (Odoo circle avatar)
function ContactAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-[#00A09D]', 'bg-[#875A7B]', 'bg-[#F06050]', 'bg-[#6CC1ED]', 'bg-[#F7CD1F]', 'bg-[#2C8397]'];
  const colorIndex = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const s = size === 'md' ? 'h-8 w-8 text-xs' : 'h-6 w-6 text-[10px]';
  return (
    <div className={cn('rounded-full text-white flex items-center justify-center font-medium shrink-0', colors[colorIndex], s)}>
      {initials}
    </div>
  );
}

// Kanban card — Odoo exact style
function KanbanCard({ opportunity, onPriorityChange }: { opportunity: Opportunity; onPriorityChange: (p: 0 | 1 | 2 | 3) => void }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-card border border-border rounded px-3 py-2.5 cursor-pointer hover:shadow-sm transition-shadow group"
      onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', opportunity.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      {/* Title */}
      <div className="font-semibold text-[13px] text-foreground leading-snug line-clamp-2">
        {opportunity.name}
      </div>

      {/* Revenue */}
      <div className="text-[13px] text-foreground mt-0.5">
        $ {opportunity.expectedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>

      {/* Company */}
      {opportunity.companyName && (
        <div className="text-xs text-muted-foreground mt-0.5">{opportunity.companyName}</div>
      )}

      {/* Tags row */}
      {opportunity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {opportunity.tags.map((tag) => (
            <span key={tag} className={cn('text-[10px] px-1.5 py-[1px] rounded-sm font-medium', getTagColor(tag))}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom: priority stars + activity icons + avatar */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <StarRating value={opportunity.priority} onChange={onPriorityChange} />
          <div className="flex items-center gap-1 ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/40 hover:text-[#00A09D] transition-colors" onClick={(e) => e.stopPropagation()}>
                  <Clock className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Schedule Activity</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/40 hover:text-[#00A09D] transition-colors" onClick={(e) => e.stopPropagation()}>
                  <Phone className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Log Call</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <ContactAvatar name={opportunity.contactName || opportunity.companyName || 'U'} />
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
  const [quickName, setQuickName] = useState('');
  const [quickRevenue, setQuickRevenue] = useState('');
  const totalValue = opportunities.reduce((sum, o) => sum + o.expectedRevenue, 0);
  const stageMap: Record<string, OpportunityStage> = {
    new: 'new', qualified: 'qualified', proposition: 'proposition', won: 'won',
  };

  const handleQuickAdd = () => {
    if (quickName.trim()) {
      onQuickCreate(stage.id, stageMap[stage.id] || 'new');
    }
  };

  return (
    <div
      className={cn(
        'w-[272px] flex flex-col shrink-0 transition-all rounded-sm',
        isDragOver && 'bg-primary/5'
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
      <div
        className="px-2 py-2 rounded-t-sm"
        style={{ borderTop: `3px solid ${stage.color}` }}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-[13px] text-foreground tracking-tight">{stage.name}</span>
          <div className="flex items-center gap-1">
            {totalValue > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                ${(totalValue / 1000).toFixed(0)}k
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem>Fold</DropdownMenuItem>
                <DropdownMenuItem>Edit Stage</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Quick add inline — Odoo style */}
        {showQuickAdd ? (
          <div className="bg-card border border-border rounded p-2 space-y-1.5">
            <Input
              placeholder="Opportunity..."
              className="h-7 text-xs"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickAdd();
                if (e.key === 'Escape') { setShowQuickAdd(false); setQuickName(''); setQuickRevenue(''); }
              }}
            />
            <div className="flex items-center gap-1">
              <Input
                placeholder="Expected Revenue"
                className="h-7 text-xs flex-1"
                type="number"
                value={quickRevenue}
                onChange={(e) => setQuickRevenue(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 pt-0.5">
              <Button size="sm" className="h-6 text-xs px-2" onClick={handleQuickAdd}>Add</Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setShowQuickAdd(false); setQuickName(''); setQuickRevenue(''); }}>
                Discard
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1 hover:bg-muted/30 rounded transition-colors"
          >
            <Plus className="h-3 w-3" /> Quick add
          </button>
        )}
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
  const { canCreateOpportunities, canEditOpportunities } = useCRMPermissions();

  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => getOpportunities());
  const [pipeline] = useState<Pipeline>(() => getDefaultPipeline());
  const [search, setSearch] = useState('');
  const [searchFilters, setSearchFilters] = useState<string[]>([]);

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
      setOpportunities(getOpportunities());
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
        setOpportunities(getOpportunities());
      }
    },
    [opportunities]
  );

  const handleQuickCreate = useCallback(
    (stageId: string, stage: OpportunityStage) => {
      // This triggers the main dialog via parent
      onNewOpportunity?.();
    },
    [onNewOpportunity]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Odoo-style control panel / toolbar */}
      <div className="border-b border-border bg-card px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          {/* Left: breadcrumb + new */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onNewOpportunity}
              className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs font-semibold"
              disabled={!canCreateOpportunities}
            >
              New
            </Button>
            <div className="h-4 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>My Pipeline</DropdownMenuItem>
                <DropdownMenuItem>Unassigned</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Won</DropdownMenuItem>
                <DropdownMenuItem>Lost</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Creation Date</DropdownMenuItem>
                <DropdownMenuItem>Closing Date</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  Group By <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>Salesperson</DropdownMenuItem>
                <DropdownMenuItem>Sales Team</DropdownMenuItem>
                <DropdownMenuItem>Stage</DropdownMenuItem>
                <DropdownMenuItem>City</DropdownMenuItem>
                <DropdownMenuItem>Country</DropdownMenuItem>
                <DropdownMenuItem>Lost Reason</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Creation Date</DropdownMenuItem>
                <DropdownMenuItem>Closing Date</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8 text-xs">
                  <Star className="h-3.5 w-3.5" />
                  Favorites <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>Save current search</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>My Pipeline</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right: search + views */}
          <div className="flex items-center gap-2">
            {/* Odoo search bar with filter chips */}
            <div className="relative flex items-center border border-border rounded bg-card overflow-hidden">
              {searchFilters.map((f, i) => (
                <span key={i} className="flex items-center gap-0.5 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 mx-0.5 rounded-sm font-medium">
                  {f}
                  <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setSearchFilters(prev => prev.filter((_, idx) => idx !== i))} />
                </span>
              ))}
              <Search className="h-3.5 w-3.5 text-muted-foreground ml-2" />
              <input
                placeholder="Search..."
                className="h-7 w-40 text-xs bg-transparent border-0 outline-none px-1.5 placeholder:text-muted-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* View toggle — Odoo style */}
            <div className="flex items-center border border-border rounded overflow-hidden">
              <button
                onClick={() => onViewChange?.('list')}
                className={cn(
                  'h-7 w-7 flex items-center justify-center transition-colors',
                  view === 'list' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onViewChange?.('kanban')}
                className={cn(
                  'h-7 w-7 flex items-center justify-center transition-colors',
                  view === 'kanban' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                className="h-7 w-7 flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
                title="Pivot"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
              <button
                className="h-7 w-7 flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
                title="Activity"
              >
                <Activity className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-3 pb-3 pt-2 bg-muted/20">
        <div className="flex gap-1.5 h-full min-w-max">
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
