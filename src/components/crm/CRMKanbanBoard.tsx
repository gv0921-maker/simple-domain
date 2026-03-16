// Odoo-style CRM Kanban Board with revenue bars, star ratings, colored tags, activity icons
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
  Plus,
  Search,
  Filter,
  Star,
  Mail,
  Phone,
  Clock,
  MoreVertical,
  List,
  LayoutGrid,
  ChevronDown,
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

// Odoo tag colors
const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'Design': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'Product': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  'Information': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  'Training': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  'Consulting': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
  'Services': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
  'Other': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
};

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || { bg: 'bg-muted', text: 'text-muted-foreground' };
}

// Star rating component (like Odoo)
function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
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
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
            )}
          />
        </button>
      ))}
    </div>
  );
}

// Revenue progress bar for column header (Odoo-style segmented bar)
function RevenueBar({ opportunities, stage }: { opportunities: Opportunity[]; stage: PipelineStage }) {
  if (opportunities.length === 0) return null;

  // Each segment represents an opportunity, colored by probability
  const maxRevenue = Math.max(...opportunities.map(o => o.expectedRevenue), 1);
  
  return (
    <div className="flex h-1 w-full rounded-full overflow-hidden gap-px mt-1">
      {opportunities.map((opp) => {
        const width = Math.max((opp.expectedRevenue / maxRevenue) * 100, 8);
        const color = opp.probability >= 60 ? 'bg-emerald-500' : opp.probability >= 30 ? 'bg-amber-500' : 'bg-red-400';
        return (
          <div
            key={opp.id}
            className={cn('h-full rounded-sm', color)}
            style={{ flex: `${width} 0 0%` }}
          />
        );
      })}
    </div>
  );
}

// Contact avatar
function ContactAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
      {initials}
    </div>
  );
}

// Kanban card (Odoo-style)
interface KanbanCardProps {
  opportunity: Opportunity;
  onPriorityChange: (priority: 0 | 1 | 2 | 3) => void;
}

function KanbanCard({ opportunity, onPriorityChange }: KanbanCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-shadow border border-border group"
      onClick={() => navigate(`/crm/opportunities/${opportunity.id}`)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', opportunity.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      {/* Title & Revenue */}
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-medium text-sm text-foreground leading-tight line-clamp-2 flex-1">
          {opportunity.name}
        </h4>
      </div>

      {/* Revenue */}
      <p className="text-sm font-semibold text-foreground mt-1">
        $ {opportunity.expectedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>

      {/* Company */}
      {opportunity.companyName && (
        <p className="text-xs text-muted-foreground mt-0.5">{opportunity.companyName}</p>
      )}

      {/* Tags */}
      {opportunity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {opportunity.tags.map((tag) => {
            const c = getTagColor(tag);
            return (
              <span key={tag} className={cn('text-[10px] px-1.5 py-0.5 rounded-sm font-medium', c.bg, c.text)}>
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {/* Bottom row: stars, activity icons, avatar */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <StarRating
            value={opportunity.priority}
            onChange={onPriorityChange}
          />
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            <Phone className="h-3 w-3" />
            <Mail className="h-3 w-3" />
          </div>
        </div>
        <ContactAvatar name={opportunity.contactName || opportunity.companyName || 'U'} />
      </div>
    </Card>
  );
}

// Kanban column
interface KanbanColumnProps {
  stage: PipelineStage;
  opportunities: Opportunity[];
  onDrop: (oppId: string, stageId: string, stage: OpportunityStage) => void;
  onPriorityChange: (oppId: string, priority: 0 | 1 | 2 | 3) => void;
  onQuickCreate: (stageId: string, stage: OpportunityStage) => void;
}

function KanbanColumn({ stage, opportunities, onDrop, onPriorityChange, onQuickCreate }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const totalValue = opportunities.reduce((sum, o) => sum + o.expectedRevenue, 0);
  const stageMap: Record<string, OpportunityStage> = {
    new: 'new', qualified: 'qualified', proposition: 'proposition', won: 'won',
  };

  return (
    <div
      className={cn(
        'w-[280px] md:w-[300px] flex flex-col rounded-t-md shrink-0 transition-all',
        isDragOver && 'ring-2 ring-primary/30 bg-primary/5'
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
      {/* Column header - Odoo-style */}
      <div className="px-3 py-2.5 bg-muted/50 rounded-t-md border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">{stage.name}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQuickCreate(stage.id, stageMap[stage.id] || 'new')}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-medium text-muted-foreground ml-1">
              {totalValue > 0 && `${(totalValue / 1000).toFixed(0)}k`}
            </span>
          </div>
        </div>
        <RevenueBar opportunities={opportunities} stage={stage} />
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 min-h-[200px] bg-muted/20">
        {opportunities.map((opp) => (
          <KanbanCard
            key={opp.id}
            opportunity={opp}
            onPriorityChange={(p) => onPriorityChange(opp.id, p)}
          />
        ))}
        {opportunities.length === 0 && (
          <div className="text-center py-12 text-muted-foreground/50 text-sm">
            No opportunities
          </div>
        )}
      </div>
    </div>
  );
}

// Quick create inline form
function QuickCreateForm({ onSubmit, onCancel }: { onSubmit: (name: string, companyName: string, revenue: number) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [revenue, setRevenue] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={onCancel}>
      <Card className="p-4 w-[360px] space-y-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-sm">New Opportunity</h3>
        <Input placeholder="Opportunity name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Input placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
        <Input placeholder="Expected Revenue" type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={() => { if (name) onSubmit(name, company, parseFloat(revenue) || 0); }}>Add</Button>
        </div>
      </Card>
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
  const [quickCreate, setQuickCreate] = useState<{ stageId: string; stage: OpportunityStage } | null>(null);

  // Filter out lost opportunities from main kanban (they go to a separate archive)
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
    (name: string, companyName: string, revenue: number) => {
      if (!quickCreate) return;
      saveOpportunity({
        name,
        companyName,
        contactName: '',
        expectedRevenue: revenue,
        stageId: quickCreate.stageId,
        stage: quickCreate.stage,
      });
      setOpportunities(getOpportunities());
      setQuickCreate(null);
      toast({ title: 'Opportunity created' });
    },
    [quickCreate, toast]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Odoo-style toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onNewOpportunity}
            className="gap-1"
            disabled={!canCreateOpportunities}
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                Opportunities <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => navigate('/crm/pipeline')}>
                My Pipeline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/crm/pipeline')}>
                All Opportunities
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* Search with filter tags (Odoo-style) */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 h-8 w-48 md:w-56 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>

          {/* View toggle */}
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => onViewChange?.('kanban')}
              className={cn(
                'h-8 w-8 flex items-center justify-center transition-colors',
                view === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onViewChange?.('list')}
              className={cn(
                'h-8 w-8 flex items-center justify-center transition-colors',
                view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-4 pb-4 pt-2">
        <div className="flex gap-2 h-full min-w-max">
          {activeStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              opportunities={opportunitiesByStage[stage.id] || []}
              onDrop={handleDrop}
              onPriorityChange={handlePriorityChange}
              onQuickCreate={(stageId, stageType) => setQuickCreate({ stageId, stage: stageType })}
            />
          ))}
        </div>
      </div>

      {/* Quick create modal */}
      {quickCreate && (
        <QuickCreateForm
          onSubmit={handleQuickCreate}
          onCancel={() => setQuickCreate(null)}
        />
      )}
    </div>
  );
}

export { StarRating };
