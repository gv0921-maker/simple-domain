// Odoo-style List View for Pipeline opportunities
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Plus,
  Search,
  Filter,
  List,
  LayoutGrid,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

type SortField = 'name' | 'expectedRevenue' | 'probability' | 'expectedCloseDate' | 'stage';
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
      else if (sortField === 'expectedRevenue') cmp = a.expectedRevenue - b.expectedRevenue;
      else if (sortField === 'probability') cmp = a.probability - b.probability;
      else if (sortField === 'expectedCloseDate') cmp = a.expectedCloseDate.localeCompare(b.expectedCloseDate);
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

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn('h-3 w-3 text-muted-foreground', sortField === field && 'text-foreground')} />
      </div>
    </TableHead>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar (matches kanban) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onNewOpportunity} className="gap-1" disabled={!canCreateOpportunities}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                Opportunities <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>My Pipeline</DropdownMenuItem>
              <DropdownMenuItem>All Opportunities</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 h-8 w-48 md:w-56 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button onClick={() => onViewChange('kanban')} className={cn('h-8 w-8 flex items-center justify-center transition-colors', view === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onViewChange('list')} className={cn('h-8 w-8 flex items-center justify-center transition-colors', view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <SortHeader field="name">Opportunity</SortHeader>
                  <TableHead>Contact</TableHead>
                  <SortHeader field="expectedRevenue">Expected Revenue</SortHeader>
                  <SortHeader field="probability">Probability</SortHeader>
                  <SortHeader field="stage">Stage</SortHeader>
                  <SortHeader field="expectedCloseDate">Closing Date</SortHeader>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No opportunities found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((opp) => {
                    const stageName = pipeline.stages.find(s => s.id === opp.stageId)?.name || opp.stage;
                    return (
                      <TableRow
                        key={opp.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/crm/opportunities/${opp.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
                          <div>
                            <p className="font-medium text-sm">{opp.name}</p>
                            {opp.companyName && <p className="text-xs text-muted-foreground">{opp.companyName}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{opp.contactName || '—'}</TableCell>
                        <TableCell className="text-sm font-semibold">${opp.expectedRevenue.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{opp.probability}%</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">{stageName}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(parseISO(opp.expectedCloseDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <StarRating value={opp.priority} readonly />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
