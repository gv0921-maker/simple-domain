// Odoo-style List View for Pipeline
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search, List, LayoutGrid, ChevronDown, ChevronUp, Star,
  SlidersHorizontal, Users, BarChart3, Activity, Clock, Settings,
  CalendarDays, Map,
} from 'lucide-react';
import {
  getOpportunities, getDefaultPipeline, type Opportunity,
} from '@/lib/data/crm';
import { StarRating } from '@/components/crm/CRMKanbanBoard';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface CRMPipelineListViewProps {
  onNewOpportunity?: () => void;
  view: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
}

type SortField = 'name' | 'contactName' | 'expectedRevenue' | 'probability' | 'expectedCloseDate' | 'stage' | 'salesTeam';
type SortDir = 'asc' | 'desc';

export function CRMPipelineListView({ onNewOpportunity, view, onViewChange }: CRMPipelineListViewProps) {
  const navigate = useNavigate();
  const { canCreateOpportunities } = useCRMPermissions();
  const pipeline = getDefaultPipeline();

  const [opportunities] = useState<Opportunity[]>(() => getOpportunities());
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('expectedRevenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = opportunities.filter(o => o.stage !== 'lost');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.contactName.toLowerCase().includes(q) ||
        (o.companyName?.toLowerCase().includes(q) ?? false)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'contactName') cmp = (a.contactName || '').localeCompare(b.contactName || '');
      else if (sortField === 'expectedRevenue') cmp = a.expectedRevenue - b.expectedRevenue;
      else if (sortField === 'probability') cmp = a.probability - b.probability;
      else if (sortField === 'expectedCloseDate') cmp = a.expectedCloseDate.localeCompare(b.expectedCloseDate);
      else if (sortField === 'salesTeam') cmp = (a.salesTeam || '').localeCompare(b.salesTeam || '');
      else if (sortField === 'stage') {
        const stageOrder = pipeline.stages.map(s => s.id);
        cmp = stageOrder.indexOf(a.stageId) - stageOrder.indexOf(b.stageId);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [opportunities, search, sortField, sortDir, pipeline.stages]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(o => o.id)));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const totalRevenue = filtered.reduce((s, o) => s + o.expectedRevenue, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar — matching kanban */}
      <div className="border-b border-border bg-card px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onNewOpportunity} className="gap-1 h-8 text-xs font-semibold bg-[#875A7B] hover:bg-[#6e4a64] text-white" disabled={!canCreateOpportunities}>
              New
            </Button>
            <span className="text-sm font-semibold text-foreground">Pipeline</span>
            <Settings className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
          </div>

          <div className="relative flex-1 max-w-md">
            <div className="relative flex items-center border border-border rounded bg-card overflow-hidden">
              <Search className="h-4 w-4 text-muted-foreground ml-2.5" />
              <input
                placeholder="Search..."
                className="h-8 w-full text-sm bg-transparent border-0 outline-none px-2 placeholder:text-muted-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="h-8 w-8 flex items-center justify-center border-l border-border text-muted-foreground hover:bg-muted">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {[
              { icon: LayoutGrid, id: 'kanban' as const, title: 'Kanban' },
              { icon: List, id: 'list' as const, title: 'List' },
              { icon: Clock, id: null, title: 'Activity' },
            ].map(({ icon: Icon, id, title }) => (
              <Tooltip key={title}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => id && onViewChange(id)}
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

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10 pl-4">
                <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="cursor-pointer select-none text-xs font-semibold" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1">Opportunity <SortIcon field="name" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-xs font-semibold" onClick={() => toggleSort('contactName')}>
                <div className="flex items-center gap-1">Contact Name <SortIcon field="contactName" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-xs font-semibold" onClick={() => toggleSort('salesTeam')}>
                <div className="flex items-center gap-1">Sales Team <SortIcon field="salesTeam" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-xs font-semibold text-right" onClick={() => toggleSort('expectedRevenue')}>
                <div className="flex items-center justify-end gap-1">Expected Revenue <SortIcon field="expectedRevenue" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-xs font-semibold text-right" onClick={() => toggleSort('probability')}>
                <div className="flex items-center justify-end gap-1">Probability <SortIcon field="probability" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-xs font-semibold" onClick={() => toggleSort('stage')}>
                <div className="flex items-center gap-1">Stage <SortIcon field="stage" /></div>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-xs font-semibold" onClick={() => toggleSort('expectedCloseDate')}>
                <div className="flex items-center gap-1">Expected Closing <SortIcon field="expectedCloseDate" /></div>
              </TableHead>
              <TableHead className="text-xs font-semibold">Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground text-sm">
                  No opportunity found. Let's create one!
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filtered.map((opp) => {
                  const stageName = pipeline.stages.find(s => s.id === opp.stageId)?.name || opp.stage;
                  const stageColor = pipeline.stages.find(s => s.id === opp.stageId)?.color;
                  return (
                    <TableRow
                      key={opp.id}
                      className={cn('cursor-pointer hover:bg-primary/5 text-[13px]', selected.has(opp.id) && 'bg-primary/5')}
                      onClick={() => navigate(`/crm/opportunities/${opp.id}`)}
                    >
                      <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(opp.id)}
                          onCheckedChange={() => {
                            const next = new Set(selected);
                            next.has(opp.id) ? next.delete(opp.id) : next.add(opp.id);
                            setSelected(next);
                          }}
                        />
                      </TableCell>
                      <TableCell><span className="font-medium">{opp.name}</span></TableCell>
                      <TableCell className="text-muted-foreground">{opp.contactName || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{opp.salesTeam || '—'}</TableCell>
                      <TableCell className="text-right font-medium">₹{opp.expectedRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{opp.probability}%</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] capitalize font-medium border-0 px-2 py-0.5"
                          style={{ backgroundColor: stageColor ? `${stageColor}20` : undefined, color: stageColor || undefined }}>
                          {stageName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(parseISO(opp.expectedCloseDate), 'MM/dd/yyyy')}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <StarRating value={opp.priority} readonly />
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                  <TableCell colSpan={4} className="pl-4 text-xs text-muted-foreground">
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="text-right text-xs">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
