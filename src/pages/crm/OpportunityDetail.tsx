// Odoo-style Opportunity Detail Form — pixel-perfect replica
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
  Pencil,
  CalendarClock,
  ChevronRight,
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
  const [editData, setEditData] = useState<Partial<Opportunity>>({});
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newLogMessage, setNewLogMessage] = useState('');
  const [activeTab, setActiveTab] = useState('internal');

  const activities = useMemo(() => id ? getActivities('opportunity', id) : [], [id]);
  const notes = useMemo(() => id ? getNotes('opportunity', id) : [], [id]);

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

  const handleSave = () => {
    saveOpportunity({ ...opportunity, ...editData });
    setOpportunity(getOpportunity(opportunity.id));
    setIsEditing(false);
    setEditData({});
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
      <div className="flex flex-col h-full">
        {/* Top control panel — Odoo style */}
        <div className="border-b border-border bg-card px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <button
                onClick={() => navigate('/crm/pipeline')}
                className="text-primary hover:underline font-medium"
              >
                Pipeline
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground font-medium">{opportunity.name}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {!isWon && !isLost && (
                <>
                  {isEditing ? (
                    <>
                      <Button size="sm" className="h-7 text-xs" onClick={handleSave}>Save</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setIsEditing(false); setEditData({}); }}>Discard</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                  )}
                  <div className="h-4 w-px bg-border" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 text-[#00A09D] border-[#00A09D]/30 hover:bg-[#00A09D]/10"
                    onClick={handleWon}
                  >
                    <Trophy className="h-3 w-3" />
                    Won
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setShowLostDialog(true)}
                  >
                    <XCircle className="h-3 w-3" />
                    Lost
                  </Button>
                </>
              )}
              {(isWon || isLost) && (
                <Badge className={cn(
                  'text-xs px-2.5 py-0.5',
                  isWon ? 'bg-[#00A09D] text-white' : 'bg-destructive text-destructive-foreground'
                )}>
                  {isWon ? '🏆 Won' : '❌ Lost'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
            {/* Odoo-style Chevron Stage Bar */}
            {!isLost && (
              <div className="flex items-stretch overflow-hidden">
                {activeStages.map((stage, index) => {
                  const isActive = stage.id === opportunity.stageId;
                  const isPast = index < currentStageIndex;
                  const isLast = index === activeStages.length - 1;

                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleStageClick(stage.id)}
                      className={cn(
                        'relative flex-1 py-1.5 text-center text-xs font-semibold transition-all',
                        'clip-chevron',
                        isActive && 'bg-primary text-primary-foreground z-10',
                        isPast && 'bg-primary/20 text-primary',
                        !isActive && !isPast && 'bg-muted/60 text-muted-foreground hover:bg-muted',
                      )}
                      style={{
                        clipPath: isLast
                          ? 'polygon(0 0, calc(100% - 0px) 0, 100% 50%, calc(100% - 0px) 100%, 0 100%, 12px 50%)'
                          : index === 0
                            ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                            : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
                      }}
                    >
                      {stage.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main form — Odoo 2-column layout */}
            <div className="bg-card border border-border rounded-sm p-5">
              {/* Title */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                <StarRating
                  value={opportunity.priority}
                  onChange={(p) => {
                    saveOpportunity({ ...opportunity, priority: p as 0 | 1 | 2 | 3 });
                    setOpportunity(getOpportunity(opportunity.id));
                  }}
                />
                <h1 className="text-xl font-bold text-foreground flex-1">{opportunity.name}</h1>
                {opportunity.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[10px] font-medium">{tag}</Badge>
                ))}
              </div>

              {/* Two-column form fields — Odoo style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {/* Left column */}
                <FormField label="Contact Name" icon={User}>
                  {isEditing ? (
                    <Input defaultValue={opportunity.contactName} className="h-8 text-sm" onChange={e => setEditData({...editData, contactName: e.target.value})} />
                  ) : (
                    <span className="text-sm text-primary hover:underline cursor-pointer">{opportunity.contactName || '—'}</span>
                  )}
                </FormField>

                <FormField label="Expected Revenue" icon={DollarSign}>
                  {isEditing ? (
                    <Input type="number" defaultValue={opportunity.expectedRevenue} className="h-8 text-sm" onChange={e => setEditData({...editData, expectedRevenue: parseFloat(e.target.value) || 0})} />
                  ) : (
                    <span className="text-sm font-semibold">${opportunity.expectedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  )}
                </FormField>

                <FormField label="Email" icon={Mail}>
                  {isEditing ? (
                    <Input defaultValue={opportunity.email} className="h-8 text-sm" onChange={e => setEditData({...editData, email: e.target.value})} />
                  ) : (
                    opportunity.email ? <a href={`mailto:${opportunity.email}`} className="text-sm text-primary hover:underline">{opportunity.email}</a> : <span className="text-sm text-muted-foreground">—</span>
                  )}
                </FormField>

                <FormField label="Probability" icon={BarChart3Icon}>
                  {isEditing ? (
                    <Input type="number" defaultValue={opportunity.probability} className="h-8 text-sm w-20" onChange={e => setEditData({...editData, probability: parseInt(e.target.value) || 0})} />
                  ) : (
                    <span className="text-sm">{opportunity.probability} %</span>
                  )}
                </FormField>

                <FormField label="Phone" icon={Phone}>
                  {isEditing ? (
                    <Input defaultValue={opportunity.phone} className="h-8 text-sm" onChange={e => setEditData({...editData, phone: e.target.value})} />
                  ) : (
                    <span className="text-sm">{opportunity.phone || '—'}</span>
                  )}
                </FormField>

                <FormField label="Expected Closing" icon={Calendar}>
                  {isEditing ? (
                    <Input type="date" defaultValue={opportunity.expectedCloseDate} className="h-8 text-sm" onChange={e => setEditData({...editData, expectedCloseDate: e.target.value})} />
                  ) : (
                    <span className="text-sm">{format(parseISO(opportunity.expectedCloseDate), 'MM/dd/yyyy')}</span>
                  )}
                </FormField>

                <FormField label="Company" icon={Building}>
                  {isEditing ? (
                    <Input defaultValue={opportunity.companyName} className="h-8 text-sm" onChange={e => setEditData({...editData, companyName: e.target.value})} />
                  ) : (
                    <span className="text-sm text-primary hover:underline cursor-pointer">{opportunity.companyName || '—'}</span>
                  )}
                </FormField>

                <FormField label="Salesperson" icon={User}>
                  {isEditing ? (
                    <Input defaultValue={opportunity.assignedTo} className="h-8 text-sm" onChange={e => setEditData({...editData, assignedTo: e.target.value})} />
                  ) : (
                    <span className="text-sm">{opportunity.assignedTo || '—'}</span>
                  )}
                </FormField>

                <div /> {/* spacer */}

                <FormField label="Sales Team" icon={Users}>
                  {isEditing ? (
                    <Input defaultValue={opportunity.salesTeam} className="h-8 text-sm" onChange={e => setEditData({...editData, salesTeam: e.target.value})} />
                  ) : (
                    <span className="text-sm">{opportunity.salesTeam || '—'}</span>
                  )}
                </FormField>
              </div>
            </div>

            {/* Notebook tabs — Odoo style */}
            <div className="bg-card border border-border rounded-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border">
                  <TabsList className="bg-transparent h-auto p-0 rounded-none">
                    <TabsTrigger
                      value="internal"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs font-semibold"
                    >
                      Internal Notes
                    </TabsTrigger>
                    <TabsTrigger
                      value="extra"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs font-semibold"
                    >
                      Extra Info
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="internal" className="p-4 mt-0">
                  {isEditing ? (
                    <Textarea
                      placeholder="Internal notes..."
                      defaultValue={opportunity.internalNotes}
                      className="min-h-[80px] text-sm"
                      onChange={e => setEditData({...editData, internalNotes: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {opportunity.internalNotes || 'No internal notes yet.'}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="extra" className="p-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <FormField label="Created on">
                      <span className="text-sm">{format(parseISO(opportunity.createdAt), 'MM/dd/yyyy HH:mm:ss')}</span>
                    </FormField>
                    <FormField label="Last Updated">
                      <span className="text-sm">{format(parseISO(opportunity.updatedAt), 'MM/dd/yyyy HH:mm:ss')}</span>
                    </FormField>
                    {isWon && opportunity.wonAt && (
                      <FormField label="Won on">
                        <span className="text-sm">{format(parseISO(opportunity.wonAt), 'MM/dd/yyyy HH:mm:ss')}</span>
                      </FormField>
                    )}
                    {isLost && opportunity.lostAt && (
                      <>
                        <FormField label="Lost on">
                          <span className="text-sm">{format(parseISO(opportunity.lostAt), 'MM/dd/yyyy HH:mm:ss')}</span>
                        </FormField>
                        <FormField label="Lost Reason">
                          <span className="text-sm text-destructive">{opportunity.lostReason || '—'}</span>
                        </FormField>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Chatter — Odoo style */}
            <div className="bg-card border border-border rounded-sm p-4">
              {/* Chatter action buttons */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant={newNote !== '' || (newLogMessage === '' && newNote === '') ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setNewLogMessage('')}
                >
                  <MessageSquare className="h-3 w-3" />
                  Send message
                </Button>
                <Button
                  variant={newLogMessage !== '' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setNewNote('')}
                >
                  <Clock className="h-3 w-3" />
                  Log note
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                >
                  <CalendarClock className="h-3 w-3" />
                  Activities
                </Button>
              </div>

              {/* Compose area */}
              <div className="flex gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                  Y
                </div>
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a note..."
                    value={newNote || newLogMessage}
                    onChange={(e) => {
                      if (newLogMessage !== '') setNewLogMessage(e.target.value);
                      else setNewNote(e.target.value);
                    }}
                    className="min-h-[50px] text-sm border-border"
                  />
                  <div className="flex justify-end mt-1.5">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={!(newNote || newLogMessage).trim()}
                      onClick={() => {
                        if (newLogMessage) handleLogMessage();
                        else handleSendNote();
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {newLogMessage ? 'Log' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3 border-t border-border pt-4">
                {[...notes, ...activities.filter(a => a.completed)]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((item) => {
                    const isNoteItem = 'content' in item;
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold shrink-0 text-muted-foreground">
                          {isNoteItem ? '📝' : '📋'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-foreground">{(item as any).userName || 'System'}</span>
                            <span className="text-muted-foreground">{format(parseISO(item.createdAt), 'MM/dd/yyyy HH:mm:ss')}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {isNoteItem ? (item as Note).content : (item as Activity).subject}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                {notes.length === 0 && activities.filter(a => a.completed).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No messages yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lost reason dialog */}
      <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Lost Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold">Why was this opportunity lost?</Label>
            <Select value={lostReason} onValueChange={setLostReason}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select a lost reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Too expensive">Too expensive</SelectItem>
                <SelectItem value="We don't have people/skills">We don't have people/skills</SelectItem>
                <SelectItem value="Not enough direct benefit">Not enough direct benefit</SelectItem>
                <SelectItem value="Customer not interested">Customer not interested</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowLostDialog(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleLost}>Mark as Lost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Helper: Odoo-style form field row
function FormField({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <label className="text-xs font-semibold text-muted-foreground w-32 shrink-0 text-right">
        {label}
      </label>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
        {children}
      </div>
    </div>
  );
}

// Inline icon component
function BarChart3Icon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  );
}

function Users(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
