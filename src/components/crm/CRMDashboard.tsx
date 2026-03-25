// CRM Dashboard with Analytics
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  
  Target,
  TrendingUp,
  IndianRupee,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  UserPlus,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  getCRMStats,
  getLeadsBySource,
  getOpportunitiesByStage,
  getOpportunities,
  getLeads,
  getActivities,
  type CRMStats,
} from '@/lib/data/crm';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { cn } from '@/lib/utils';
import { format, parseISO, isThisWeek } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  color?: string;
  delay?: number;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'primary', delay = 0 }: StatCardProps) {
  return (
    <Card className="animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', `text-${color}`)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs mt-1', trend.positive ? 'text-success' : 'text-destructive')}>
            <TrendingUp className={cn('h-3 w-3', !trend.positive && 'rotate-180')} />
            {trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CRMDashboard() {
  const navigate = useNavigate();
  
  const stats = useMemo(() => getCRMStats(), []);
  const leadsBySource = useMemo(() => getLeadsBySource(), []);
  const opportunitiesByStage = useMemo(() => getOpportunitiesByStage(), []);
  const allOpportunities = useMemo(() => getOpportunities(), []);
  const allLeads = useMemo(() => getLeads(), []);
  const activities = useMemo(() => getActivities(), []);

  // Note: Dashboard shows aggregate stats for all users (admin view)
  // Individual list pages enforce record scope filtering
  const opportunities = allOpportunities;
  const leads = allLeads;

  const upcomingDeals = useMemo(() => {
    return opportunities
      .filter((o) => o.stage !== 'won' && o.stage !== 'lost')
      .sort((a, b) => new Date(a.expectedCloseDate).getTime() - new Date(b.expectedCloseDate).getTime())
      .slice(0, 5);
  }, [opportunities]);

  const pendingActivities = useMemo(() => {
    return activities
      .filter((a) => !a.completed && a.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [activities]);

  const recentLeads = useMemo(() => {
    return leads
      .filter((l) => l.status === 'new')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [leads]);

  const pipelineChartData = useMemo(() => {
    const colors: Record<string, 'blue' | 'teal' | 'orange' | 'coral'> = {
      new: 'blue',
      qualified: 'teal',
      proposition: 'orange',
      won: 'coral',
    };
    return opportunitiesByStage
      .filter((s) => s.stageId !== 'lost')
      .map((stage) => ({
        value: stage.count,
        color: colors[stage.stageId] || 'blue',
      }));
  }, [opportunitiesByStage]);

  const sourceChartData = useMemo(() => {
    const colors: ('blue' | 'teal' | 'orange' | 'coral')[] = ['blue', 'teal', 'orange', 'coral'];
    return leadsBySource.slice(0, 4).map((source, i) => ({
      value: source.count,
      color: colors[i % colors.length],
    }));
  }, [leadsBySource]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">CRM Dashboard</h1>
          <p className="text-muted-foreground">Overview of your customer relationships and sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/crm')}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
          <Button onClick={() => navigate('/crm/pipeline')}>
            View Pipeline
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={stats.totalContacts}
          subtitle={`${stats.totalCompanies} companies`}
          icon={Users}
          delay={0}
        />
        <StatCard
          title="Active Leads"
          value={stats.totalLeads}
          subtitle={`${stats.newLeadsThisMonth} new this month`}
          icon={Target}
          color="warning"
          delay={50}
        />
        <StatCard
          title="Pipeline Value"
          value={`₹${stats.pipelineValue.toLocaleString('en-IN')}`}
          subtitle={`${stats.activeOpportunities} active deals`}
          icon={IndianRupee}
          color="success"
          delay={100}
        />
        <StatCard
          title="Win Rate"
          value={`${stats.winRate}%`}
          subtitle={`Avg deal: ₹${stats.avgDealSize.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="info"
          delay={150}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Weighted Pipeline"
          value={`₹${stats.weightedPipelineValue.toLocaleString('en-IN')}`}
          subtitle="Probability-adjusted"
          icon={BarChart3}
          delay={200}
        />
        <StatCard
          title="Won Revenue"
          value={`₹${stats.wonRevenue.toLocaleString('en-IN')}`}
          icon={CheckCircle2}
          color="success"
          delay={250}
        />
        <StatCard
          title="Pending Activities"
          value={stats.activitiesPending}
          subtitle={`${stats.activitiesCompleted} completed`}
          icon={Clock}
          color="warning"
          delay={300}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Chart */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Opportunity Pipeline
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/crm/pipeline')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4 mb-4">
              {opportunitiesByStage
                .filter((s) => s.stageId !== 'lost')
                .map((stage, i) => (
                  <div key={stage.stageId} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className={cn('w-2 h-2 rounded-full',
                      i === 0 ? 'bg-chart-blue' :
                      i === 1 ? 'bg-chart-teal' :
                      i === 2 ? 'bg-chart-orange' : 'bg-chart-coral'
                    )} />
                    {stage.stage}
                  </div>
                ))}
            </div>
            <SimpleBarChart data={pipelineChartData} height={180} />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              {opportunitiesByStage
                .filter((s) => s.stageId !== 'lost')
                .map((stage) => (
                  <div key={stage.stageId} className="flex justify-between">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <span className="font-medium">₹{stage.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Source */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Leads by Source
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4 mb-4">
              {leadsBySource.slice(0, 4).map((source, i) => (
                <div key={source.source} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className={cn('w-2 h-2 rounded-full',
                    i === 0 ? 'bg-chart-blue' :
                    i === 1 ? 'bg-chart-teal' :
                    i === 2 ? 'bg-chart-orange' : 'bg-chart-coral'
                  )} />
                  {source.source}
                </div>
              ))}
            </div>
            <SimpleBarChart data={sourceChartData} height={180} />
            <div className="mt-4 space-y-2">
              {leadsBySource.map((source) => (
                <div key={source.source} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{source.source.replace('_', ' ')}</span>
                  <div className="flex items-center gap-4">
                    <span>{source.count} leads</span>
                    <span className="font-medium">₹{source.value.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deals */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Deals</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/crm/pipeline')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming deals</p>
              ) : (
                upcomingDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/crm/opportunities/${deal.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm truncate">{deal.name}</p>
                      <span className="text-sm font-semibold">₹{deal.expectedRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(deal.expectedCloseDate), 'MMM d')}
                      <span>•</span>
                      <span>{deal.probability}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* New Leads */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">New Leads</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/crm/leads')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No new leads</p>
              ) : (
                recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                  >
                    <p className="font-medium text-sm truncate">{lead.title}</p>
                    <p className="text-xs text-muted-foreground">{lead.contactName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {lead.source.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs font-medium">₹{lead.expectedRevenue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Activities */}
        <Card className="animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Pending Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pending activities</p>
              ) : (
                pendingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.subject}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.type.replace('_', ' ')}
                          </Badge>
                          <span>Due {format(parseISO(activity.dueDate!), 'MMM d')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="justify-start gap-2" onClick={() => navigate('/crm/contacts')}>
              <Users className="h-4 w-4" />
              Manage Contacts
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => navigate('/crm/leads')}>
              <Target className="h-4 w-4" />
              View Leads
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => navigate('/crm/pipeline')}>
              <TrendingUp className="h-4 w-4" />
              Sales Pipeline
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
