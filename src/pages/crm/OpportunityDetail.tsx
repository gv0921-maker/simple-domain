// Odoo-style Opportunity Detail Form
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Trophy,
  XCircle,
  Phone,
  Mail,
  Building,
  User,
  Calendar,
  DollarSign,
  Clock,
  MessageSquare,
  Send,
} from 'lucide-react';
import {
  getOpportunity,
  saveOpportunity,
  updateOpportunityStage,
  getDefaultPipeline,
  getActivities,
  saveActivity,
  getNotes,
  saveNote,
  type Opportunity,
  type OpportunityStage,
  type Activity,
  type Note,
} from '@/lib/data/crm';
import { StarRating } from '@/components/crm/CRMKanbanBoard';
import { CRM_NAV } from '@/lib/navigation/crm';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const pipeline = getDefaultPipeline();

  const [opportunity, setOpportunity] = useState<Opportunity | undefined>(() =>
    id ? getOpportunity(id) : undefined
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newLogMessage, setNewLogMessage] = useState('');

  const activities = useMemo(() =>
    id ? getActivities('opportunity', id) : [],
    [id]
  );

  const notes = useMemo(() =>
    id ? getNotes('opportunity', id) : [],
    [id]
  );

  if (!opportunity) {
    return (
      <AppLayout title="CRM" moduleNav={CRM_NAV}>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Opportunity not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/crm/pipeline')}>
            Back to Pipeline
          </Button>
        </div>
      </AppLayout>
    );
  }

  const activeStages = pipeline.stages.filter(s => s.id !== 'lost');
  const currentStageIndex = activeStages.findIndex(s => s.id === opportunity.stageId);

  const handleStageClick = (stageId: string) => {
    const stageMap: Record<string, OpportunityStage> = {
      new: 'new', qualified: 'qualified', proposition: 'proposition', won: 'won',
    };
    const stage = stageMap[stageId];
    if (stage) {
      updateOpportunityStage(opportunity.id, stageId, stage);
      setOpportunity(getOpportunity(opportunity.id));
      toast({ title: `Stage updated to ${activeStages.find(s => s.id === stageId)?.name}` });
    }
  };

  const handleWon = () => {
    updateOpportunityStage(opportunity.id, 'won', 'won');
    setOpportunity(getOpportunity(opportunity.id));
    toast({ title: '🎉 Opportunity Won!' });
  };

  const handleLost = () => {
    saveOpportunity({ ...opportunity, lostReason, stage: 'lost', stageId: 'lost', lostAt: new Date().toISOString(), probability: 0 });
    setShowLostDialog(false);
    setOpportunity(getOpportunity(opportunity.id));
    toast({ title: 'Opportunity marked as lost' });
  };

  const handleSave = (updates: Partial<Opportunity>) => {
    saveOpportunity({ ...opportunity, ...updates });
    setOpportunity(getOpportunity(opportunity.id));
    setIsEditing(false);
    toast({ title: 'Opportunity updated' });
  };

  const handleSendNote = () => {
    if (!newNote.trim()) return;
    saveNote({
      content: newNote,
      relatedTo: 'opportunity',
      relatedId: opportunity.id,
      userId: '1',
      userName: 'You',
      visibility: 'team',
    });
    setNewNote('');
    toast({ title: 'Note added' });
  };

  const handleLogMessage = () => {
    if (!newLogMessage.trim()) return;
    saveActivity({
      type: 'note',
      subject: newLogMessage,
      relatedTo: 'opportunity',
      relatedId: opportunity.id,
      userId: '1',
      userName: 'You',
      completed: true,
      completedAt: new Date().toISOString(),
    });
    setNewLogMessage('');
    toast({ title: 'Log added' });
  };

  const isWon = opportunity.stage === 'won';
  const isLost = opportunity.stage === 'lost';

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        {/* Top bar: back, actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/crm/pipeline')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{opportunity.name}</h1>
              {opportunity.companyName && (
                <p className="text-sm text-muted-foreground">{opportunity.companyName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isWon && !isLost && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  onClick={handleWon}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Won
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setShowLostDialog(true)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Lost
                </Button>
              </>
            )}
            {(isWon || isLost) && (
              <Badge className={cn(
                'text-sm px-3 py-1',
                isWon ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}>
                {isWon ? '🏆 Won' : '❌ Lost'}
              </Badge>
            )}
          </div>
        </div>

        {/* Stage progress bar (Odoo-style clickable stages) */}
        {!isLost && (
          <div className="flex items-center gap-0 bg-muted/50 rounded-lg overflow-hidden border border-border">
            {activeStages.map((stage, index) => {
              const isActive = stage.id === opportunity.stageId;
              const isPast = index < currentStageIndex;
              const isFuture = index > currentStageIndex;

              return (
                <button
                  key={stage.id}
                  onClick={() => handleStageClick(stage.id)}
                  className={cn(
                    'flex-1 py-2 px-3 text-xs font-medium text-center transition-all relative',
                    'border-r border-border last:border-r-0',
                    isActive && 'bg-primary text-primary-foreground',
                    isPast && 'bg-primary/20 text-primary',
                    isFuture && 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {stage.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Main form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: form fields */}
          <Card className="lg:col-span-2 p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Contact Name</Label>
                {isEditing ? (
                  <Input defaultValue={opportunity.contactName} onChange={(e) => handleSave({ contactName: e.target.value })} />
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {opportunity.contactName || '—'}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {opportunity.email ? (
                    <a href={`mailto:${opportunity.email}`} className="text-primary hover:underline">{opportunity.email}</a>
                  ) : '—'}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {opportunity.phone || '—'}
                </div>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Company</Label>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  {opportunity.companyName || '—'}
                </div>
              </div>

              {/* Expected Revenue */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Expected Revenue</Label>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  {opportunity.expectedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Probability */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Probability</Label>
                <p className="text-sm font-medium">{opportunity.probability}%</p>
              </div>

              {/* Close Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Expected Closing</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {format(parseISO(opportunity.expectedCloseDate), 'MMM d, yyyy')}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <StarRating
                  value={opportunity.priority}
                  onChange={(p) => handleSave({ priority: p as 0 | 1 | 2 | 3 })}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {opportunity.tags.length > 0 ? opportunity.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                )) : (
                  <span className="text-xs text-muted-foreground">No tags</span>
                )}
              </div>
            </div>

            {/* Salesperson */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Salesperson</Label>
                <p className="text-sm">{opportunity.assignedTo || '—'}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Sales Team</Label>
                <p className="text-sm">{opportunity.salesTeam || '—'}</p>
              </div>
            </div>
          </Card>

          {/* Right: quick info */}
          <div className="space-y-4">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stage</span>
                  <span className="font-medium capitalize">{opportunity.stage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-semibold">${opportunity.expectedRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Probability</span>
                  <span>{opportunity.probability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weighted</span>
                  <span>${Math.round(opportunity.expectedRevenue * opportunity.probability / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(parseISO(opportunity.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </Card>

            {/* Schedule activity */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Activities
              </h3>
              {activities.filter(a => !a.completed).length > 0 ? (
                <div className="space-y-2">
                  {activities.filter(a => !a.completed).slice(0, 3).map(a => (
                    <div key={a.id} className="text-xs p-2 bg-muted/50 rounded">
                      <p className="font-medium">{a.subject}</p>
                      {a.dueDate && <p className="text-muted-foreground mt-0.5">Due {format(parseISO(a.dueDate), 'MMM d')}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No pending activities</p>
              )}
            </Card>
          </div>
        </div>

        {/* Bottom: Chatter (Odoo-style tabs) */}
        <Card className="p-4">
          <Tabs defaultValue="notes">
            <TabsList className="mb-3">
              <TabsTrigger value="notes" className="gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Send message
              </TabsTrigger>
              <TabsTrigger value="log" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Log note
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a message..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <Button size="icon" onClick={handleSendNote} disabled={!newNote.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="log">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Log an internal note..."
                  value={newLogMessage}
                  onChange={(e) => setNewLogMessage(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <Button size="icon" onClick={handleLogMessage} disabled={!newLogMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Activity/Notes timeline */}
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {[...notes, ...activities.filter(a => a.completed)]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((item) => {
                const isNote = 'content' in item;
                return (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                      {isNote ? 'N' : 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{(item as any).userName || 'System'}</span>
                        <span className="text-xs text-muted-foreground">{format(parseISO(item.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        {isNote ? (item as Note).content : (item as Activity).subject}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Lost reason dialog */}
      <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Mark as Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Lost Reason</Label>
            <Select value={lostReason} onValueChange={setLostReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Too expensive">Too expensive</SelectItem>
                <SelectItem value="No budget">No budget</SelectItem>
                <SelectItem value="Competitor won">Competitor won</SelectItem>
                <SelectItem value="No decision">No decision</SelectItem>
                <SelectItem value="Not interested">Not interested</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLostDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLost}>Mark as Lost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
