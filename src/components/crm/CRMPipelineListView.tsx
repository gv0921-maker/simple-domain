// Odoo-style List View for Pipeline — uses TanStack Query hooks (Supabase-ready)
import React, { useState, useMemo } from 'react';
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
  List, LayoutGrid, ChevronDown, ChevronUp,
  Clock, Settings, Loader2,
} from 'lucide-react';
import { type Opportunity, type Pipeline } from '@/lib/services/crm';
import { useOpportunities, useDefaultPipeline, useActivities, useContacts } from '@/hooks/crm/useCRMQueries';
import { StarRating } from '@/components/crm/CRMKanbanBoard';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { FilterBar } from '@/components/filters/FilterBar';
import { crmOpportunitiesFilterConfig } from '@/lib/filters/modules/crmOpportunities';
import { applyFilterState, groupByFieldsNested, type NestedGroup } from '@/lib/filters/clientFilter';
import { EMPTY_FILTER_STATE, type FilterState } from '@/lib/filters/types';
import { displayRevenue, canViewSensitive } from '@/lib/crm/fieldMask';

interface CRMPipelineListViewProps {
  onNewOpportunity?: () => void;
  view: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
}

type SortField = 'name' | 'contactName' | 'expectedRevenue' | 'expectedCloseDate' | 'stage' | 'salesTeam';
type SortDir = 'asc' | 'desc';

export function CRMPipelineListView({ onNewOpportunity, view, onViewChange }: CRMPipelineListViewProps) {
  const navigate = useNavigate();
  const { canCreateOpportunities, filterByScope } = useCRMPermissions();
  const { user } = useAuth();
  const { data: pipelineData } = useDefaultPipeline();
  const pipeline: Pipeline = pipelineData ?? { id: '', name: '', description: '', stages: [], isDefault: false, createdAt: '', updatedAt: '' };

  const { data: allOpportunities = [], isFetching } = useOpportunities();
  const opportunities = useMemo(() => filterByScope(allOpportunities), [allOpportunities, filterByScope]);
  const [filterState, setFilterState] = useState<FilterState>(EMPTY_FILTER_STATE);
  const [sortField, setSortField] = useState<SortField>('expectedRevenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: allActivities = [] } = useActivities();
  const { data: allContacts = [] } = useContacts();
  const contactsById = useMemo(() => {
    const m: Record<string, typeof allContacts[number]> = {};
    for (const c of allContacts) m[c.id] = c;
    return m;
  }, [allContacts]);

  const filteredByFilters = useMemo(
    () => applyFilterState(opportunities as unknown as Record<string, unknown>[], filterState,
      ['name','contactName','companyName','phone','email'],
      { currentUserId: user?.id, currentUserName: user?.name, currentUserEmail: user?.email }) as unknown as typeof opportunities,
    [opportunities, filterState, user?.id, user?.name, user?.email],
  );

  const filtered = useMemo(() => {
    let list = [...filteredByFilters];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'contactName') cmp = (a.contactName || '').localeCompare(b.contactName || '');
      else if (sortField === 'expectedRevenue') cmp = a.expectedRevenue - b.expectedRevenue;
      else if (sortField === 'expectedCloseDate') cmp = a.expectedCloseDate.localeCompare(b.expectedCloseDate);
      else if (sortField === 'salesTeam') cmp = (a.salesTeam || '').localeCompare(b.salesTeam || '');
      else if (sortField === 'stage') {
        const stageOrder = pipeline.stages.map(s => s.id);
        cmp = stageOrder.indexOf(a.stageId) - stageOrder.indexOf(b.stageId);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [filteredByFilters, sortField, sortDir, pipeline.stages]);

  const stageNames = useMemo(() => {
    const m: Record<string, string> = {};
    pipeline.stages.forEach(s => { m[s.id] = s.name; });
    return m;
  }, [pipeline.stages]);

  const groupChain = useMemo<string[]>(() => {
    if (filterState.group_by_fields?.length) return filterState.group_by_fields;
    return filterState.group_by ? [filterState.group_by] : [];
  }, [filterState.group_by_fields, filterState.group_by]);

  const groupedNested = useMemo(() => {
    if (!groupChain.length) return null;
    return groupByFieldsNested(
      filtered as unknown as Record<string, unknown>[],
      groupChain,
      (field, k) => field === 'stage' ? (stageNames[k] || k) : k,
    ) as NestedGroup<typeof filtered[number] & Record<string, unknown>>[];
  }, [filtered, groupChain, stageNames]);

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

  const renderLeafRow = (opp: typeof filtered[number], indent = 0) => {
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
        <TableCell style={{ paddingLeft: indent ? `${indent * 16 + 16}px` : undefined }}>
          <span className="font-medium">{opp.name}</span>
        </TableCell>
        <TableCell className="text-muted-foreground">{opp.contactName || '—'}</TableCell>
        <TableCell className="text-muted-foreground">{opp.salesTeam || '—'}</TableCell>
        <TableCell className="text-right font-medium">{displayRevenue(opp.expectedRevenue, user?.id, 'crm')}</TableCell>
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
  };

  const renderNestedGroups = (
    groups: NestedGroup<typeof filtered[number] & Record<string, unknown>>[],
    depth: number,
  ): React.ReactNode => {
    const shades = ['bg-muted/50', 'bg-muted/35', 'bg-muted/25'];
    return groups.map((g) => (
      <React.Fragment key={`grp-${depth}-${g.field}-${g.key}`}>
        <TableRow className={cn(shades[Math.min(depth, shades.length - 1)], 'hover:bg-muted/40')}>
          <TableCell
            colSpan={8}
            className="py-1.5 text-xs font-semibold"
            style={{ paddingLeft: `${depth * 16 + 16}px` }}
          >
            {g.label} <span className="text-muted-foreground font-normal">({g.records.length})</span>
          </TableCell>
        </TableRow>
        {g.children
          ? renderNestedGroups(g.children, depth + 1)
          : (g.records as unknown as typeof filtered).map((opp) => renderLeafRow(opp, depth + 1))}
      </React.Fragment>
    ));
  };

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
            {isFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>

          <div className="flex-1 max-w-3xl">
            <FilterBar config={crmOpportunitiesFilterConfig} value={filterState} onChange={setFilterState} />
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
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground text-sm">
                  No opportunity found. Let's create one!
                </TableCell>
              </TableRow>
            ) : groupedNested ? (
              <>{renderNestedGroups(groupedNested, 0)}</>
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
                      <TableCell className="text-right font-medium">{displayRevenue(opp.expectedRevenue, user?.id, 'crm')}</TableCell>
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
                  <TableCell className="text-right text-xs">{canViewSensitive(user?.id, 'crm', 'revenue') ? `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
