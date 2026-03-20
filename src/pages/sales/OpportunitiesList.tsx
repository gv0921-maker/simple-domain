import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Plus,
  Filter,
  DollarSign,
  Calendar,
  Building,
  TrendingUp,
} from 'lucide-react';
import { getOpportunities, type Opportunity, type OpportunityStage } from '@/lib/data/sales';
import { SALES_NAV } from '@/lib/navigation/sales';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const STAGES: { id: OpportunityStage; label: string; weight: number }[] = [
  { id: 'qualification', label: 'Qualification', weight: 10 },
  { id: 'needs_analysis', label: 'Needs Analysis', weight: 30 },
  { id: 'proposal', label: 'Proposal', weight: 50 },
  { id: 'negotiation', label: 'Negotiation', weight: 75 },
  { id: 'closed_won', label: 'Closed Won', weight: 100 },
  { id: 'closed_lost', label: 'Closed Lost', weight: 0 },
];

function getStageLabel(stage: OpportunityStage): string {
  return STAGES.find((s) => s.id === stage)?.label || stage;
}

function getStageWeight(stage: OpportunityStage): number {
  return STAGES.find((s) => s.id === stage)?.weight || 0;
}

export default function OpportunitiesList() {
  const navigate = useNavigate();
  const [opportunities] = useState<Opportunity[]>(() => getOpportunities());
  const [search, setSearch] = useState('');

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(
      (o) =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.contactName.toLowerCase().includes(search.toLowerCase()) ||
        (o.company?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }, [opportunities, search]);

  const totalPipeline = useMemo(() => {
    return opportunities
      .filter((o) => o.stage !== 'closed_lost')
      .reduce((sum, o) => sum + o.expectedRevenue * (o.probability / 100), 0);
  }, [opportunities]);

  return (
    <AppLayout title="CRM" moduleNav={SALES_NAV}>
      <div className="p-4">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-semibold">₹{totalPipeline.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Won This Month</p>
                <p className="text-2xl font-semibold">
                  ₹{opportunities
                    .filter((o) => o.stage === 'closed_won')
                    .reduce((sum, o) => sum + o.expectedRevenue, 0)
                    .toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Building className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Opportunities</p>
                <p className="text-2xl font-semibold">
                  {opportunities.filter((o) => !o.stage.startsWith('closed')).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-lg font-medium text-foreground">Opportunities</h1>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder=""
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Button className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Opportunity</span>
            </Button>
          </div>
        </div>

        {/* Opportunities grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOpportunities.map((opp, index) => (
            <Card
              key={opp.id}
              className="p-4 cursor-pointer card-hover animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/sales/opportunities/${opp.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground line-clamp-1">{opp.name}</h3>
                  <p className="text-sm text-muted-foreground">{opp.contactName}</p>
                  {opp.company && (
                    <p className="text-sm text-muted-foreground">{opp.company}</p>
                  )}
                </div>
                <Badge
                  variant={opp.stage === 'closed_won' ? 'default' : opp.stage === 'closed_lost' ? 'destructive' : 'secondary'}
                  className="shrink-0"
                >
                  {getStageLabel(opp.stage)}
                </Badge>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{opp.probability}%</span>
                </div>
                <Progress value={getStageWeight(opp.stage)} className="h-2" />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-lg font-semibold text-foreground">
                  <DollarSign className="h-4 w-4" />
                  {opp.expectedRevenue.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(parseISO(opp.expectedCloseDate), 'MMM d, yyyy')}
                </div>
              </div>

              {opp.products.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {opp.products.length} product{opp.products.length > 1 ? 's' : ''} quoted
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No opportunities found</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
