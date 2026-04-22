// TODO: Replace localStorage with Supabase queries
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Mail, Phone, Building, Target, TrendingUp, ArrowRight, Zap,
} from 'lucide-react';
import {
  getLead, updateLeadStatus, convertLeadToOpportunity,
  getActivities, getNotes, saveNote, type Lead, type LeadStatus,
} from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { WorkflowStatus, type WorkflowStep } from '@/components/forms/WorkflowStatus';
import { CRMActivityTimeline } from '@/components/crm/CRMActivityTimeline';
import { RichComposer, RichContent, type RichComposerValue } from '@/components/ui/rich-composer';
import { EmailComposerDialog } from '@/components/crm/EmailComposerDialog';
import { calculateScore, type ScoreBreakdown } from '@/lib/crm/leadScoring';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const STATUS_ORDER: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted'];

function buildWorkflow(status: LeadStatus): WorkflowStep[] {
  const idx = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER.map((s, i) => ({
    id: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
    status: i < idx ? 'completed' as const : i === idx ? 'current' as const : 'upcoming' as const,
  }));
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { canEditLeads, canConvertLeads } = useCRMPermissions();

  const [lead, setLead] = useState<Lead | undefined>(() => id ? getLead(id) : undefined);
  const [notesVersion, setNotesVersion] = useState(0);
  const [emailOpen, setEmailOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);

  const notes = useMemo(() => (id ? getNotes('lead', id) : []), [id, notesVersion]);
  const scoreData = useMemo(() => lead ? calculateScore(lead) : null, [lead]);

  if (!lead) {
    return (
      <AppLayout title="CRM" moduleNav={CRM_NAV}>
        <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <p className="text-muted-foreground">Lead not found</p>
          <Button variant="outline" onClick={() => navigate('/crm/leads')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleStatusChange = (statusId: string) => {
    if (!canEditLeads) return;
    const s = statusId as LeadStatus;
    if (s === lead.status) return;
    const updated = updateLeadStatus(lead.id, s);
    if (updated) { setLead(updated); toast({ title: `Status → ${s}` }); }
  };

  const handleConvert = () => {
    const opp = convertLeadToOpportunity(lead.id);
    if (opp) {
      toast({ title: 'Lead converted to opportunity' });
      navigate(`/crm/opportunities/${opp.id}`);
    }
  };

  const handleLost = () => {
    const updated = updateLeadStatus(lead.id, 'lost');
    if (updated) { setLead(updated); toast({ title: 'Lead marked as lost' }); }
  };

  const handleUnqualified = () => {
    const updated = updateLeadStatus(lead.id, 'unqualified');
    if (updated) { setLead(updated); toast({ title: 'Lead marked as unqualified' }); }
  };

  const handleAddNote = (value: RichComposerValue) => {
    const text = value.html.replace(/<[^>]+>/g, '').trim();
    if (!text && value.attachments.length === 0) return;
    saveNote({
      content: value.html,
      relatedTo: 'lead',
      relatedId: lead.id,
      userId: user?.id || '1',
      userName: user?.name || 'User',
      visibility: 'team',
      mentions: value.mentions,
      attachments: value.attachments,
    });
    setNotesVersion(v => v + 1);
    toast({ title: 'Note added' });
  };

  const isTerminal = lead.status === 'converted' || lead.status === 'lost' || lead.status === 'unqualified';

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crm/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">{lead.title}</h1>
            <p className="text-muted-foreground">{lead.contactName}</p>
          </div>
          {!isTerminal && canEditLeads && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
                <Mail className="h-4 w-4 mr-1" /> Email
              </Button>
              {lead.status === 'qualified' && canConvertLeads && (
                <Button size="sm" onClick={handleConvert}>
                  <ArrowRight className="h-4 w-4 mr-1" /> Convert to Opportunity
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleUnqualified}>Unqualified</Button>
              <Button variant="destructive" size="sm" onClick={handleLost}>Lost</Button>
            </div>
          )}
        </div>

        {/* Workflow status */}
        {!isTerminal && (
          <WorkflowStatus
            steps={buildWorkflow(lead.status)}
            onStepClick={canEditLeads ? handleStatusChange : undefined}
          />
        )}
        {isTerminal && (
          <Badge className={cn(
            'text-sm',
            lead.status === 'converted' && 'bg-primary/10 text-primary',
            lead.status === 'lost' && 'bg-destructive/10 text-destructive',
            lead.status === 'unqualified' && 'bg-muted text-muted-foreground',
          )}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </Badge>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Lead Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {lead.email || '—'}</p></div>
                  <div><span className="text-muted-foreground">Phone</span><p className="font-medium flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {lead.phone || '—'}</p></div>
                  <div><span className="text-muted-foreground">Company</span><p className="font-medium flex items-center gap-1"><Building className="h-3.5 w-3.5" /> {lead.companyName || '—'}</p></div>
                  <div><span className="text-muted-foreground">Source</span><p className="font-medium capitalize">{lead.source.replace('_', ' ')}</p></div>
                  <div><span className="text-muted-foreground">Priority</span><Badge variant="outline" className="capitalize">{lead.priority}</Badge></div>
                  <div><span className="text-muted-foreground">Expected Revenue</span><p className="font-medium font-mono">₹{lead.expectedRevenue.toLocaleString('en-IN')}</p></div>
                  <div><span className="text-muted-foreground">Probability</span><p className="font-medium">{lead.probability}%</p></div>
                  <div><span className="text-muted-foreground">Created</span><p className="font-medium">{format(parseISO(lead.createdAt), 'MMM d, yyyy')}</p></div>
                </div>
              </CardContent>
            </Card>

            {/* Score breakdown */}
            <Collapsible open={scoreOpen} onOpenChange={setScoreOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-warning" /> Score Breakdown
                      </CardTitle>
                      <Badge variant="outline" className="font-mono text-base">{scoreData?.score ?? lead.score} / 100</Badge>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-1.5">
                      {scoreData?.breakdown.map(({ rule, matched }) => (
                        <div key={rule.id} className={cn(
                          'flex items-center justify-between text-sm px-2 py-1 rounded',
                          matched ? 'bg-success/10' : 'bg-muted/30'
                        )}>
                          <span className={matched ? 'text-foreground' : 'text-muted-foreground'}>
                            {rule.field === 'source' && `Source = ${rule.condition}`}
                            {rule.field === 'priority' && `Priority = ${rule.condition}`}
                            {rule.field === 'revenue' && `Revenue ≥ ₹${Number(rule.condition).toLocaleString('en-IN')}`}
                            {rule.field === 'hasPhone' && 'Has phone number'}
                            {rule.field === 'hasCompany' && 'Has company'}
                          </span>
                          <span className={cn('font-mono text-xs', matched ? 'text-success' : 'text-muted-foreground')}>
                            {matched ? `+${rule.points}` : `+0`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Activity Timeline */}
            <CRMActivityTimeline relatedTo="lead" relatedId={lead.id} />

            {/* Notes */}
            <Card>
              <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <RichComposer onSubmit={handleAddNote} />
                <Separator />
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
                ) : notes.map(n => (
                  <div key={n.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{n.userName}</span>
                      <span>•</span>
                      <span>{format(parseISO(n.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <RichContent html={n.content} attachments={n.attachments} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-mono font-medium">{scoreData?.score ?? lead.score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="capitalize">{lead.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <Badge variant="outline" className="capitalize">{lead.priority}</Badge>
                </div>
                {lead.assignedTo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned</span>
                    <span>{lead.assignedTo}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <EmailComposerDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        defaultTo={lead.email}
        relatedTo="lead"
        relatedId={lead.id}
      />
    </AppLayout>
  );
}