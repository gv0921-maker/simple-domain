import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  DollarSign,
  ArrowRight,
  User,
} from 'lucide-react';
import { getLeads, updateLeadStatus, type Lead, type LeadStatus } from '@/lib/data/sales';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PIPELINE_STAGES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: 'bg-info' },
  { id: 'qualified', label: 'Qualified', color: 'bg-accent' },
  { id: 'proposition', label: 'Proposition', color: 'bg-warning' },
  { id: 'won', label: 'Won', color: 'bg-success' },
  { id: 'lost', label: 'Lost', color: 'bg-destructive' },
];

interface LeadCardProps {
  lead: Lead;
  onMove: (status: LeadStatus) => void;
}

function LeadCard({ lead, onMove }: LeadCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="p-3 cursor-pointer card-hover animate-scale-in"
      onClick={() => navigate(`/sales/leads/${lead.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm text-foreground line-clamp-2">{lead.name}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PIPELINE_STAGES.filter((s) => s.id !== lead.status).map((stage) => (
              <DropdownMenuItem
                key={stage.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(stage.id);
                }}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Move to {stage.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate">{lead.contactName}</span>
        </div>
        {lead.company && (
          <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
          <DollarSign className="h-3 w-3" />
          {lead.expectedRevenue.toLocaleString()}
        </div>
        <Badge variant="secondary" className="text-xs">
          {lead.probability}%
        </Badge>
      </div>

      {lead.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function SalesPipeline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(() => getLeads());
  const [search, setSearch] = useState('');

  const filteredLeads = useMemo(() => {
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.contactName.toLowerCase().includes(search.toLowerCase()) ||
        (l.company?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }, [leads, search]);

  const leadsByStage = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      new: [],
      qualified: [],
      proposition: [],
      won: [],
      lost: [],
    };
    filteredLeads.forEach((lead) => {
      grouped[lead.status].push(lead);
    });
    return grouped;
  }, [filteredLeads]);

  const handleMoveLead = (leadId: string, newStatus: LeadStatus) => {
    updateLeadStatus(leadId, newStatus);
    setLeads(getLeads());
    toast({
      title: 'Lead updated',
      description: `Lead moved to ${newStatus}`,
    });
  };

  const getStageTotal = (status: LeadStatus) => {
    return leadsByStage[status].reduce((sum, l) => sum + l.expectedRevenue, 0);
  };

  return (
    <AppLayout title="CRM" moduleNav={SALES_NAV}>
      <div className="p-4 h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
          <h1 className="text-lg font-medium text-foreground">Sales Pipeline</h1>

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
            <Button onClick={() => navigate('/sales/leads/new')} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Lead</span>
            </Button>
          </div>
        </div>

        {/* Kanban board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full min-w-max pb-4">
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage.id}
                className="w-72 flex flex-col bg-muted/30 rounded-lg shrink-0"
              >
                {/* Column header */}
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', stage.color)} />
                    <h3 className="font-medium text-sm text-foreground">{stage.label}</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {leadsByStage[stage.id].length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{getStageTotal(stage.id).toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {leadsByStage[stage.id].map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onMove={(status) => handleMoveLead(lead.id, status)}
                    />
                  ))}
                  {leadsByStage[stage.id].length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
