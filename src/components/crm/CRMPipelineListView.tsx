// Odoo-style List View for Pipeline — pixel-perfect replica
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  List,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Star,
  SlidersHorizontal,
  Users,
  BarChart3,
  Activity,
  X,
} from 'lucide-react';
import {
  getOpportunities,
  getDefaultPipeline,
  type Opportunity,
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

  // Totals row
  const totalRevenue = filtered.reduce((s, o) => s + o.expectedRevenue, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Odoo-style control panel */}
      <div className="border-b border-border bg-card px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onNewOpportunity} className="gap-1 h-8 text-xs font-semibold" disabled={!canCreateOpportunities}>
              New
            </Button>
            <div className="h-4 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filters <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>My Pipeline</DropdownMenuItem>
                <DropdownMenuItem>Unassigned</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Won</DropdownMenuItem>
                <DropdownMenuItem>Lost</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8 text-xs">
                  <Users className="h-3.5 w-3.5" /> Group By <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>Salesperson</DropdownMenuItem>
                <DropdownMenuItem>Sales Team</DropdownMenuItem>
                <DropdownMenuItem>Stage</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-8 text-xs">
                  <Star className="h-3.5 w-3.5" /> Favorites <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>Save current search</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {/* Selected count */}
            {selected.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {selected.size} selected
              </span>
            )}

            {/* Search */}
            <div className="relative flex items-center border border-border rounded bg-card overflow-hidden">
              <Search className="h-3.5 w-3.5 text-muted-foreground ml-2" />
              <input
                placeholder="Search..."
                className="h-7 w-40 text-xs bg-transparent border-0 outline-none px-1.5 placeholder:text-muted-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center border border-border rounded overflow-hidden">
              <button onClick={() => onViewChange('list')} className={cn('h-7 w-7 flex items-center justify-center transition-colors', view === 'list' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground')}>
                <List className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onViewChange('kanban')} className={cn('h-7 w-7 flex items-center justify-center transition-colors', view === 'kanban' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground')}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button className="h-7 w-7 flex items-center justify-center hover:bg-muted text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
              <button className="h-7 w-7 flex items-center justify-center hover:bg-muted text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Pager */}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              1-{filtered.length} / {filtered.length}
            </span>
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
                      <TableCell>
                        <span className="font-medium">{opp.name}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{opp.contactName || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{opp.salesTeam || '—'}</TableCell>
                      <TableCell className="text-right font-medium">${opp.expectedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{opp.probability}%</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[11px] capitalize font-medium border-0 px-2 py-0.5"
                          style={{ backgroundColor: stageColor ? `${stageColor}20` : undefined, color: stageColor || undefined }}
                        >
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
                {/* Totals row — Odoo style */}
                <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                  <TableCell colSpan={4} className="pl-4 text-xs text-muted-foreground">
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="text-right text-xs">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
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
