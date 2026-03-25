// Odoo-style Opportunity Detail Form — exact replica from reference screenshots
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  ChevronRight,
  ChevronLeft,
  Trophy,
  XCircle,
  
  MessageSquare,
  Clock,
  Send,
  Search,
  Paperclip,
  Maximize2,
  Smile,
  Settings,
  ShoppingCart,
  FileText,
  Package,
  User,
} from 'lucide-react';
import {
  getOpportunity,
  getOpportunities,
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

// Contact avatar
function ChatterAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  const colors = ['bg-[#00A09D]', 'bg-[#875A7B]', 'bg-[#F06050]', 'bg-[#6CC1ED]'];
  const colorIndex = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={cn('h-9 w-9 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0', colors[colorIndex])}>
      {initial}
    </div>
  );
}

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const pipeline = getDefaultPipeline();
  const allOpportunities = getOpportunities();

  const [opportunity, setOpportunity] = useState<Opportunity | undefined>(() =>
    id ? getOpportunity(id) : undefined
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Opportunity>>({});
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [chatterTab, setChatterTab] = useState<'message' | 'note' | 'activity'>('note');
  const [chatterInput, setChatterInput] = useState('');
  const [formTab, setFormTab] = useState('notes');

  const activities = useMemo(() => id ? getActivities('opportunity', id) : [], [id]);
  const notes = useMemo(() => id ? getNotes('opportunity', id) : [], [id]);

  // Navigation between records
  const currentIndex = allOpportunities.findIndex(o => o.id === id);
  const totalRecords = allOpportunities.length;

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

  const handleChatterSubmit = () => {
    if (!chatterInput.trim()) return;
    if (chatterTab === 'note') {
      saveNote({
        content: chatterInput,
        relatedTo: 'opportunity',
        relatedId: opportunity.id,
        userId: '1',
        userName: 'Management',
        visibility: 'team',
      });
    } else {
      saveActivity({
        type: 'note',
        subject: chatterInput,
        relatedTo: 'opportunity',
        relatedId: opportunity.id,
        userId: '1',
        userName: 'Management',
        completed: true,
        completedAt: new Date().toISOString(),
      });
    }
    setChatterInput('');
    toast({ title: chatterTab === 'note' ? 'Note logged' : 'Message sent' });
  };

  const navigateRecord = (dir: 'prev' | 'next') => {
    const newIndex = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < totalRecords) {
      navigate(`/crm/opportunities/${allOpportunities[newIndex].id}`);
    }
  };

  const isWon = opportunity.stage === 'won';
  const isLost = opportunity.stage === 'lost';
  const currentData = { ...opportunity, ...editData };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="flex flex-col h-full">
        {/* Top control panel — Odoo style */}
        <div className="border-b border-border bg-card px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            {/* Left: breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <Button
                size="sm"
                className="h-8 text-xs font-semibold bg-[#875A7B] hover:bg-[#6e4a64] text-white"
                onClick={() => navigate('/crm/pipeline')}
              >
                New
              </Button>
              <button
                onClick={() => navigate('/crm/pipeline')}
                className="text-primary hover:underline font-medium text-sm"
              >
                Pipeline
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground font-medium">{opportunity.name}</span>
              <Settings className="h-3.5 w-3.5 text-muted-foreground ml-1 cursor-pointer" />
            </div>


            {/* Right: record pager */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{currentIndex + 1} / {totalRecords}</span>
              <button
                onClick={() => navigateRecord('prev')}
                disabled={currentIndex <= 0}
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigateRecord('next')}
                disabled={currentIndex >= totalRecords - 1}
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content area — split: form left, chatter right */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Form */}
          <div className="flex-1 overflow-y-auto border-r border-border">
            <div className="p-4 max-w-4xl">
              {/* Won/Lost buttons + Chevron Stage Bar */}
              <div className="flex items-center gap-2 mb-4">
                {!isWon && !isLost && (
                  <>
                    <Button
                      size="sm"
                      className="h-8 text-xs font-semibold bg-[#00A09D] hover:bg-[#008f8c] text-white rounded"
                      onClick={handleWon}
                    >
                      Won
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-semibold rounded"
                      onClick={() => setShowLostDialog(true)}
                    >
                      Lost
                    </Button>
                  </>
                )}
                {(isWon || isLost) && (
                  <Badge className={cn(
                    'text-xs px-2.5 py-1',
                    isWon ? 'bg-[#00A09D] text-white' : 'bg-destructive text-destructive-foreground'
                  )}>
                    {isWon ? '🏆 Won' : '❌ Lost'}
                  </Badge>
                )}

                {/* Chevron stage bar */}
                {!isLost && (
                  <div className="flex items-stretch flex-1 ml-2">
                    {activeStages.map((stage, index) => {
                      const isActive = stage.id === opportunity.stageId;
                      const isPast = index < currentStageIndex;
                      const isLast = index === activeStages.length - 1;
                      const isFirst = index === 0;

                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleStageClick(stage.id)}
                          className={cn(
                            'relative flex-1 py-1.5 text-center text-xs font-semibold transition-all flex items-center justify-center gap-1',
                            isActive && 'bg-[#875A7B] text-white z-10',
                            isPast && 'bg-[#875A7B]/20 text-[#875A7B]',
                            !isActive && !isPast && 'bg-muted/60 text-muted-foreground hover:bg-muted',
                          )}
                          style={{
                            clipPath: isFirst
                              ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                              : isLast
                                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                                : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)',
                          }}
                        >
                          {stage.name}
                          {isActive && opportunity.createdAt && (
                            <span className="text-[10px] font-normal opacity-80">
                              {Math.ceil((Date.now() - new Date(opportunity.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Opportunity title */}
              <h1 className="text-2xl font-normal text-foreground mb-4">
                {isEditing ? (
                  <Input
                    defaultValue={opportunity.name}
                    className="text-2xl font-normal h-auto py-1 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0"
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                  />
                ) : (
                  opportunity.name
                )}
              </h1>

              {/* Expected Revenue + Probability row — exact Odoo layout */}
              <div className="flex items-start gap-16 mb-6">
                <div>
                  <div className="text-sm font-bold text-foreground mb-1">Expected Revenue</div>
                  <div className="text-lg text-foreground">
                    {isEditing ? (
                      <Input type="number" defaultValue={opportunity.expectedRevenue} className="h-8 text-sm w-32" onChange={e => setEditData({ ...editData, expectedRevenue: parseFloat(e.target.value) || 0 })} />
                    ) : (
                      `₹ ${currentData.expectedRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground mb-1 flex items-center gap-1">
                    Probability
                    <span className="text-[10px] text-muted-foreground bg-muted rounded px-1">AI</span>
                  </div>
                  <div className="text-lg text-foreground flex items-center gap-1">
                    {isEditing ? (
                      <Input type="number" defaultValue={opportunity.probability} className="h-8 text-sm w-20" onChange={e => setEditData({ ...editData, probability: parseInt(e.target.value) || 0 })} />
                    ) : (
                      <><span className="text-muted-foreground">at</span> {currentData.probability} <span className="text-muted-foreground">%</span></>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Two-column form — exact Odoo layout from screenshot 4 */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-6">
                {/* Left column */}
                <OdooField label="Contact" link>
                  {isEditing ? (
                    <Input defaultValue={opportunity.contactName} className="h-8 text-sm" onChange={e => setEditData({ ...editData, contactName: e.target.value })} />
                  ) : (
                    currentData.contactName || '—'
                  )}
                </OdooField>

                {/* Right column */}
                <OdooField label="Salesperson" avatar>
                  {isEditing ? (
                    <Input defaultValue={opportunity.assignedTo} className="h-8 text-sm" onChange={e => setEditData({ ...editData, assignedTo: e.target.value })} />
                  ) : (
                    currentData.assignedTo || '—'
                  )}
                </OdooField>

                <OdooField label="Email">
                  {isEditing ? (
                    <Input defaultValue={opportunity.email} className="h-8 text-sm" onChange={e => setEditData({ ...editData, email: e.target.value })} />
                  ) : (
                    currentData.email ? (
                      <a href={`mailto:${currentData.email}`} className="text-primary hover:underline">{currentData.email}</a>
                    ) : '—'
                  )}
                </OdooField>

                <OdooField label="Expected Closing">
                  {isEditing ? (
                    <Input type="date" defaultValue={opportunity.expectedCloseDate} className="h-8 text-sm" onChange={e => setEditData({ ...editData, expectedCloseDate: e.target.value })} />
                  ) : (
                    currentData.expectedCloseDate ? format(parseISO(currentData.expectedCloseDate), 'MM/dd/yyyy') : 'No closing estimate'
                  )}
                  {!isEditing && (
                    <div className="ml-4">
                      <StarRating
                        value={opportunity.priority}
                        onChange={(p) => {
                          saveOpportunity({ ...opportunity, priority: p as 0 | 1 | 2 | 3 });
                          setOpportunity(getOpportunity(opportunity.id));
                        }}
                      />
                    </div>
                  )}
                </OdooField>

                <OdooField label="Phone">
                  {isEditing ? (
                    <Input defaultValue={opportunity.phone} className="h-8 text-sm" onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                  ) : (
                    currentData.phone || '—'
                  )}
                </OdooField>

                <OdooField label="Tags">
                  <div className="flex gap-1">
                    {opportunity.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[11px] font-medium">{tag}</Badge>
                    ))}
                    {opportunity.tags.length === 0 && <span className="text-muted-foreground">—</span>}
                  </div>
                </OdooField>
              </div>

              {/* Notebook Tabs — Notes + Contacts (exact Odoo from screenshot 7) */}
              <Tabs value={formTab} onValueChange={setFormTab}>
                <TabsList className="bg-transparent h-auto p-0 rounded-none border-b border-border w-full justify-start">
                  <TabsTrigger
                    value="notes"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium"
                  >
                    Notes
                  </TabsTrigger>
                  <TabsTrigger
                    value="contacts"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm font-medium"
                  >
                    Contacts
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="mt-4">
                  {isEditing ? (
                    <Textarea
                      placeholder=""
                      defaultValue={opportunity.internalNotes}
                      className="min-h-[120px] text-sm"
                      onChange={e => setEditData({ ...editData, internalNotes: e.target.value })}
                    />
                  ) : (
                    <div className="min-h-[80px] text-sm text-muted-foreground whitespace-pre-wrap">
                      {opportunity.internalNotes || (
                        <span className="text-muted-foreground/50 italic">Type "/" for commands</span>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="contacts" className="mt-4">
                  {/* Company Information + Contact Information — Odoo Extra Info layout */}
                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-[#875A7B] uppercase tracking-wide mb-3 border-b border-border pb-1">
                        Company Information
                      </h3>
                      <div className="space-y-2">
                        <OdooField label="Company Name" labelHint>
                          {currentData.companyName || '—'}
                        </OdooField>
                        <OdooField label="Address">
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <div>Street...</div>
                            <div>Street 2...</div>
                            <div className="flex gap-4">
                              <span>City</span>
                              <span>ZIP</span>
                              <span>State</span>
                            </div>
                            <div>Country</div>
                          </div>
                        </OdooField>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#875A7B] uppercase tracking-wide mb-3 border-b border-border pb-1">
                        Contact Information
                      </h3>
                      <div className="space-y-2">
                        <OdooField label="Contact Name">
                          {currentData.contactName || '—'}
                        </OdooField>
                        <OdooField label="Job Position">
                          —
                        </OdooField>
                        <OdooField label="Website" labelHint>
                          <span className="text-muted-foreground">e.g. https://www.odoo.com</span>
                        </OdooField>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#875A7B] uppercase tracking-wide mb-3 border-b border-border pb-1">
                        Marketing
                      </h3>
                      <div className="space-y-2">
                        <OdooField label="Campaign" labelHint>—</OdooField>
                        <OdooField label="Medium" labelHint>—</OdooField>
                        <OdooField label="Source" labelHint>—</OdooField>
                        <OdooField label="Referred By">—</OdooField>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#875A7B] uppercase tracking-wide mb-3 border-b border-border pb-1">
                        Ownership
                      </h3>
                      <div className="space-y-2">
                        <OdooField label="Sales Team">
                          {currentData.salesTeam || 'Sales'}
                        </OdooField>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Cross-module Links */}
              <div className="mt-4 pt-3 border-t border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Linked Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => navigate(`/sales/quotations/new?contact=${encodeURIComponent(currentData.contactName)}&amount=${currentData.expectedRevenue}&ref=${opportunity.name}`)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Create Quotation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => navigate(`/sales/orders/new?contact=${encodeURIComponent(currentData.contactName)}&amount=${currentData.expectedRevenue}&ref=${opportunity.name}`)}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Create Sales Order
                  </Button>
                  {currentData.contactId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => navigate(`/crm/contacts/${currentData.contactId}`)}
                    >
                      <User className="h-3.5 w-3.5" />
                      View Contact
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => navigate('/inventory/products')}
                  >
                    <Package className="h-3.5 w-3.5" />
                    Browse Products
                  </Button>
                </div>
              </div>

              {/* Edit/Save bar */}
              {!isWon && !isLost && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  {isEditing ? (
                    <>
                      <Button size="sm" className="h-8 text-xs bg-[#875A7B] hover:bg-[#6e4a64] text-white" onClick={handleSave}>Save</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setIsEditing(false); setEditData({}); }}>Discard</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Chatter panel — exact Odoo style from screenshot 5 */}
          <div className="w-[380px] flex flex-col shrink-0 bg-card">
            {/* Chatter tabs */}
            <div className="flex items-center border-b border-border px-3 py-2 gap-1">
              <Button
                variant={chatterTab === 'message' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-7 text-xs',
                  chatterTab === 'message' && 'bg-[#875A7B] hover:bg-[#6e4a64] text-white'
                )}
                onClick={() => setChatterTab('message')}
              >
                Send message
              </Button>
              <Button
                variant={chatterTab === 'note' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-7 text-xs',
                  chatterTab === 'note' && 'bg-foreground text-background hover:bg-foreground/90'
                )}
                onClick={() => setChatterTab('note')}
              >
                Log note
              </Button>
              <Button
                variant={chatterTab === 'activity' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setChatterTab('activity')}
              >
                Activity
              </Button>
              <div className="flex-1" />
              <button className="text-muted-foreground hover:text-foreground">
                <Search className="h-4 w-4" />
              </button>
              <button className="text-muted-foreground hover:text-foreground">
                <Paperclip className="h-4 w-4" />
              </button>
              <button className="relative text-muted-foreground hover:text-foreground">
                <span className="text-[10px] font-bold">👤</span>
                <span className="absolute -top-1 -right-1 bg-[#875A7B] text-white text-[8px] rounded-full h-3 w-3 flex items-center justify-center">1</span>
              </button>
            </div>

            {/* Compose area */}
            {(chatterTab === 'message' || chatterTab === 'note') && (
              <div className="p-3 border-b border-border">
                <div className="flex gap-2.5">
                  <ChatterAvatar name="Management" />
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        placeholder={chatterTab === 'note' ? 'Log an internal note...' : 'Send a message...'}
                        className="h-9 text-sm pr-8 rounded-full border-[#00A09D] focus-visible:ring-[#00A09D]"
                        value={chatterInput}
                        onChange={(e) => setChatterInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleChatterSubmit(); }}
                      />
                      <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Button
                        size="sm"
                        className={cn(
                          'h-7 text-xs px-3',
                          chatterTab === 'note'
                            ? 'bg-[#875A7B]/20 text-[#875A7B] hover:bg-[#875A7B]/30'
                            : 'bg-[#00A09D] hover:bg-[#008f8c] text-white'
                        )}
                        disabled={!chatterInput.trim()}
                        onClick={handleChatterSubmit}
                      >
                        {chatterTab === 'note' ? 'Log' : 'Send'}
                      </Button>
                      <div className="flex-1" />
                      <button className="text-muted-foreground hover:text-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                      </button>
                      <button className="text-muted-foreground hover:text-foreground">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {/* Date separator */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">Today</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {[...notes, ...activities.filter(a => a.completed)]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 20)
                .map((item) => {
                  const isNoteItem = 'content' in item;
                  const userName = (item as any).userName || 'System';
                  return (
                    <div key={item.id} className="flex gap-2.5 mb-3">
                      <ChatterAvatar name={userName} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-foreground">{userName}</span>
                          <span className="text-xs text-muted-foreground">{format(parseISO(item.createdAt), 'h:mm a')}</span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5">
                          {isNoteItem ? (item as Note).content : (item as Activity).subject}
                        </p>
                      </div>
                    </div>
                  );
                })}

              {/* Default creation message */}
              {notes.length === 0 && activities.filter(a => a.completed).length === 0 && (
                <div className="flex gap-2.5">
                  <ChatterAvatar name="Management" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-foreground">Management</span>
                      <span className="text-xs text-muted-foreground">{format(parseISO(opportunity.createdAt), 'h:mm a')}</span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5">Lead/Opportunity created</p>
                  </div>
                </div>
              )}
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

// Odoo-style form field — label left, value right
function OdooField({ label, children, link, avatar, labelHint }: {
  label: string;
  children: React.ReactNode;
  link?: boolean;
  avatar?: boolean;
  labelHint?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <label className="text-sm font-bold text-foreground w-36 shrink-0 flex items-center gap-0.5">
        {label}
        {labelHint && <span className="text-muted-foreground/50 text-xs cursor-help">?</span>}
      </label>
      <div className={cn('flex items-center gap-1.5 flex-1 min-w-0 text-sm', link && 'text-primary')}>
        {avatar && (
          <div className="h-6 w-6 rounded-full bg-[#00A09D] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            M
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
