// Odoo-style Opportunity Detail Form — inline editing, live chatter, audit logging
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
  Maximize2,
  Smile,
  Settings,
  ShoppingCart,
  FileText,
  Package,
  User,
  Pencil,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  type Opportunity,
  type OpportunityStage,
  type Activity,
  type Note,
} from '@/lib/services/crm';
import {
  useOpportunity,
  useOpportunities,
  useContact,
  useContacts,
  useDefaultPipeline,
  useSaveOpportunity,
  useUpdateOpportunityStage,
  useSaveActivity,
  useSaveNote,
  useActivities,
  useNotes,
  useActivitiesRealtime,
  useNotesRealtime,
  crmKeys,
} from '@/hooks/crm/useCRMQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { StarRating } from '@/components/crm/CRMKanbanBoard';
import { CRM_NAV } from '@/lib/navigation/crm';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { RichComposer, RichContent, type RichComposerValue } from '@/components/ui/rich-composer';
import { useAuth } from '@/contexts/AuthContext';
import { TiptapNotesEditor } from '@/components/ui/tiptap-notes-editor';
import { getQuotations, getSalesOrders } from '@/lib/services/sales/storage';
import { useStockMoves } from '@/hooks/inventory';
import type { StockMove } from '@/lib/data/inventory/types';

// Format elapsed time: <1h → "Xm", <24h → "Xh", else → "Xd"
function formatElapsed(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

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

const FIELD_LABELS: Record<string, string> = {
  name: 'Opportunity Name',
  expectedRevenue: 'Expected Revenue',
  probability: 'Probability',
  expectedCloseDate: 'Expected Closing',
  contactName: 'Contact',
   assignedTo: 'User Responsible',
  companyName: 'Company',
  tags: 'Tags',
};

const INLINE_CSS = "border-0 border-b border-transparent hover:border-border focus:border-primary bg-transparent w-full text-sm outline-none transition-colors";

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // CRM data via TanStack Query hooks
  const { data: pipelineData } = useDefaultPipeline();
  const pipeline = pipelineData ?? { id: '', name: '', description: '', stages: [], isDefault: false, createdAt: '', updatedAt: '' };
  const { data: allOpportunities = [], isFetching: isFetchingAll } = useOpportunities();
  const { data: opportunityData, isLoading: isLoadingOpp, isFetching: isFetchingOpp } = useOpportunity(id);
  const opportunity = opportunityData;

  // Mutations
  const saveOpportunityMutation = useSaveOpportunity();
  const updateStageMutation = useUpdateOpportunityStage();
  const saveActivityMutation = useSaveActivity();
  const saveNoteMutation = useSaveNote();

  // Local helpers wrapping mutations (fire-and-forget)
  const saveOpportunity = (o: Partial<Opportunity> & { id?: string }) => saveOpportunityMutation.mutate(o);
  const saveActivity = (a: Partial<Activity>) => saveActivityMutation.mutate(a as any);
  const saveNote = (n: Partial<Note>) => saveNoteMutation.mutate(n as any);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [chatterTab, setChatterTab] = useState<'message' | 'note' | 'activity'>('note');
  const [formTab, setFormTab] = useState('notes');
  const [chatterSearch, setChatterSearch] = useState('');
  const [showChatterSearch, setShowChatterSearch] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'task' as 'call' | 'meeting' | 'task' | 'follow_up', dueDate: '', assignedTo: '', summary: '' });

  // --- Bug Fix 1: Inline editing state ---
  const [editingData, setEditingData] = useState<Opportunity | undefined>(opportunity);
  const [isDirty, setIsDirty] = useState(false);
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    if (!isDirty && opportunity) {
      setEditingData(opportunity);
    }
  }, [opportunity, isDirty]);

  // Mark this opportunity as "viewed now" so the CRM search bar's
  // "Unread Messages" filter knows where the read cursor is.
  useEffect(() => {
    if (id) {
      try { localStorage.setItem(`crm_last_viewed_${id}`, new Date().toISOString()); } catch { /* noop */ }
    }
  }, [id]);

  const updateField = (field: keyof Opportunity, value: any) => {
    setEditingData(prev => prev ? { ...prev, [field]: value } : prev);
    setIsDirty(true);
  };

  // --- Reactive chatter state via hooks ---
  const { data: chatterNotes = [] } = useNotes('opportunity', id);
  const { data: chatterActivities = [] } = useActivities('opportunity', id);
  useNotesRealtime(id);
  useActivitiesRealtime(id);
  const { data: linkedContact } = useContact(opportunity?.contactId);
  const { data: allContacts = [] } = useContacts();
  const { data: allStockMoves = [] } = useStockMoves();

  // Cross-module related records (same contact across Sales, Inventory, etc.)
  const relatedRecords = useMemo(() => {
    const cId = opportunity?.contactId;
    const cName = opportunity?.contactName?.trim().toLowerCase();
    if (!cId && !cName) {
      return { quotations: [], salesOrders: [], stockMoves: [] };
    }
    const matchByContact = (rec: { customerId?: string; contactId?: string; customerName?: string; contactName?: string }) => {
      if (cId && (rec.customerId === cId || rec.contactId === cId)) return true;
      if (cName) {
        const cn = (rec.customerName || rec.contactName || '').trim().toLowerCase();
        if (cn && cn === cName) return true;
      }
      return false;
    };
    let quotations: ReturnType<typeof getQuotations> = [];
    let salesOrders: ReturnType<typeof getSalesOrders> = [];
    let stockMoves: StockMove[] = [];
    try { quotations = getQuotations().filter(matchByContact); } catch { /* noop */ }
    try { salesOrders = getSalesOrders().filter(matchByContact); } catch { /* noop */ }
    try {
      stockMoves = (allStockMoves ?? []).filter(m => {
        if (cId && m.partnerId === cId) return true;
        if (cName && (m.partnerName || '').trim().toLowerCase() === cName) return true;
        return false;
      });
    } catch { /* noop */ }
    return { quotations, salesOrders, stockMoves };
  }, [opportunity?.contactId, opportunity?.contactName, allStockMoves]);

  // refreshChatter now invalidates the React Query cache instead of calling
  // localStorage helpers directly. The hooks above re-render automatically.
  const refreshChatter = useCallback(() => {
    if (!id) return;
    queryClient.invalidateQueries({ queryKey: crmKeys.notes('opportunity', id) });
    queryClient.invalidateQueries({ queryKey: crmKeys.activities('opportunity', id) });
  }, [id, queryClient]);

  // --- Change 7: Audit logging snapshot ---
  const originalSnapshot = useRef<Partial<Opportunity>>({});

  const takeSnapshot = (opp: Opportunity) => {
    const snap: any = {};
    for (const key of Object.keys(FIELD_LABELS)) {
      snap[key] = (opp as any)[key];
    }
    originalSnapshot.current = snap;
  };

  // Initialize the audit snapshot from hook data after first load
  // (and whenever the navigated record id changes).
  const snapshotInitFor = useRef<string | null>(null);
  useEffect(() => {
    if (opportunity && snapshotInitFor.current !== opportunity.id) {
      takeSnapshot(opportunity);
      snapshotInitFor.current = opportunity.id;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity?.id, !!opportunity]);

  const formatAuditValue = (field: string, value: any): string => {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return '—';
    if (field === 'expectedRevenue') return `₹${Number(value).toLocaleString('en-IN')}`;
    if (field === 'probability') return `${value}%`;
    if (field === 'tags') return [...(value as string[])].sort().join(', ');
    return String(value);
  };

  // Navigation between records
  const currentIndex = allOpportunities.findIndex(o => o.id === id);
  const totalRecords = allOpportunities.length;

  if (isLoadingOpp) {
    return (
      <AppLayout title="CRM" moduleNav={CRM_NAV}>
        <div className="p-6 flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!opportunity) {
    return (
      <AppLayout title="CRM" moduleNav={CRM_NAV}>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Opportunity not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/crm')}>
            Back to Pipeline
          </Button>
        </div>
      </AppLayout>
    );
  }

  const activeStages = pipeline.stages.filter(s => s.id !== 'lost');
  const currentStageIndex = activeStages.findIndex(s => s.id === opportunity.stageId);
  const currentData = editingData || opportunity;

  const resolveStageEnum = (stageId: string): OpportunityStage => {
    const known: OpportunityStage[] = ['new', 'qualified', 'proposition', 'won', 'lost'];
    if ((known as string[]).includes(stageId)) return stageId as OpportunityStage;
    const stageDef = pipeline.stages.find(s => s.id === stageId);
    const nameKey = stageDef?.name.trim().toLowerCase();
    if (nameKey && (known as string[]).includes(nameKey)) return nameKey as OpportunityStage;
    // Custom stage — treat as in-progress
    return 'proposition';
  };

  const handleStageClick = (stageId: string) => {
    if (stageId === opportunity.stageId && !isWon && !isLost) return;
    const stage = resolveStageEnum(stageId);
    const previousStageName = pipeline.stages.find(s => s.id === opportunity.stageId)?.name || opportunity.stageId;
    const newStageName = pipeline.stages.find(s => s.id === stageId)?.name || stageId;
    updateStageMutation.mutate({ id: opportunity.id, stageId, stage });
    toast({ title: `Stage updated to ${newStageName}` });
    saveNote({
      content: `<p><strong>Stage changed</strong><br/>${previousStageName} → ${newStageName} (Stage)</p>`,
      relatedTo: 'opportunity',
      relatedId: opportunity.id,
      userId: user?.id || '1',
      userName: 'System',
      visibility: 'team',
    } as any);
    refreshChatter();
  };

  const handleWon = () => {
    const previousStageName = activeStages.find(s => s.id === opportunity.stageId)?.name || opportunity.stageId;
    updateStageMutation.mutate({ id: opportunity.id, stageId: 'won', stage: 'won' });
    toast({ title: '🎉 Opportunity Won!' });
    saveNote({
      content: `<p><strong>Opportunity won</strong><br/>${previousStageName} → Won (Stage)</p>`,
      relatedTo: 'opportunity',
      relatedId: opportunity.id,
      userId: user?.id || '1',
      userName: 'System',
      visibility: 'team',
    } as any);
    refreshChatter();
  };

  const handleLost = () => {
    const previousStageName = activeStages.find(s => s.id === opportunity.stageId)?.name || opportunity.stageId;
    saveOpportunity({ ...opportunity, lostReason, stage: 'lost', stageId: 'lost', lostAt: new Date().toISOString(), probability: 0 });
    setShowLostDialog(false);
    toast({ title: 'Opportunity marked as lost' });
    saveNote({
      content: `<p><strong>Opportunity lost</strong><br/>${previousStageName} → Lost (Won/Lost)</p>`,
      relatedTo: 'opportunity',
      relatedId: opportunity.id,
      userId: user?.id || '1',
      userName: 'System',
      visibility: 'team',
    } as any);
    refreshChatter();
  };

  const handleSave = () => {
    if (!editingData) return;
    // Change 7: Audit diff before saving
    const diffs: string[] = [];
    for (const key of Object.keys(FIELD_LABELS)) {
      const oldVal = (originalSnapshot.current as any)[key];
      const newVal = (editingData as any)[key];
      const oldStr = formatAuditValue(key, oldVal);
      const newStr = formatAuditValue(key, newVal);
      if (key === 'tags') {
        const oldTags = [...(oldVal || [])].sort().join(', ');
        const newTags = [...(newVal || [])].sort().join(', ');
        if (oldTags !== newTags) diffs.push(`${FIELD_LABELS[key]}: ${oldStr} → ${newStr}`);
      } else if (String(oldVal ?? '') !== String(newVal ?? '')) {
        diffs.push(`${FIELD_LABELS[key]}: ${oldStr} → ${newStr}`);
      }
    }

    // Optimistic update + mutation; the useOpportunity hook will refresh
    // once the mutation completes (it invalidates the opportunity cache).
    saveOpportunityMutation.mutate(
      { ...opportunity, ...editingData },
      {
        onSuccess: (refreshed) => {
          setEditingData(refreshed);
          takeSnapshot(refreshed);
        },
      },
    );
    setIsDirty(false);

    if (diffs.length > 0) {
      saveNote({
        content: `<p><strong>Record updated</strong><br/>${diffs.join('<br/>')}</p>`,
        relatedTo: 'opportunity',
        relatedId: opportunity.id,
        userId: user?.id || '1',
        userName: 'System',
        visibility: 'team',
      } as any);
    }

    refreshChatter();
    toast({ title: 'Opportunity updated' });
  };

  const handleDiscard = () => {
    setEditingData(opportunity);
    setIsDirty(false);
  };

  const handleChatterSubmit = (value: RichComposerValue) => {
    const text = value.html.replace(/<[^>]+>/g, '').trim();
    if (!text && value.attachments.length === 0) return;
    if (chatterTab === 'note') {
      saveNote({
        content: value.html,
        relatedTo: 'opportunity',
        relatedId: opportunity.id,
        userId: user?.id || '1',
        userName: user?.name || 'User',
        visibility: 'team',
        mentions: value.mentions,
        attachments: value.attachments,
      } as any);
    } else {
      saveActivity({
        type: 'note',
        subject: text || '(attachment)',
        description: value.html,
        relatedTo: 'opportunity',
        relatedId: opportunity.id,
        userId: user?.id || '1',
        userName: user?.name || 'User',
        completed: true,
        completedAt: new Date().toISOString(),
        mentions: value.mentions,
        attachments: value.attachments,
      } as any);
    }
    toast({ title: chatterTab === 'note' ? 'Note logged' : 'Message sent' });
    refreshChatter();
  };

  const handleActivitySubmit = () => {
    if (!activityForm.summary.trim()) return;
    saveActivity({
      type: activityForm.type,
      subject: activityForm.summary,
      description: activityForm.summary,
      relatedTo: 'opportunity',
      relatedId: opportunity.id,
      userId: user?.id || '1',
      userName: user?.name || 'User',
      dueDate: activityForm.dueDate || undefined,
      completed: false,
    } as any);
    setActivityForm({ type: 'task', dueDate: '', assignedTo: '', summary: '' });
    toast({ title: 'Activity scheduled' });
    refreshChatter();
  };

  const navigateRecord = (dir: 'prev' | 'next') => {
    const newIndex = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < totalRecords) {
      navigate(`/crm/opportunities/${allOpportunities[newIndex].id}`);
    }
  };

  const isWon = opportunity.stage === 'won';
  const isLost = opportunity.stage === 'lost';

  return (
    <>
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="flex flex-col h-full">
        {/* Top control panel — Odoo style */}
        <div className="border-b border-border bg-card px-4 py-2 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Left: breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <Button
                size="sm"
                className="h-8 text-xs font-semibold bg-[#875A7B] hover:bg-[#6e4a64] text-white"
                onClick={() => navigate('/crm/opportunities/new')}
              >
                New
              </Button>
              <button
                onClick={() => navigate('/crm')}
                className="text-primary hover:underline font-medium text-sm"
              >
                Pipeline
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-none">{opportunity.name}</span>
              <Settings className="h-3.5 w-3.5 text-muted-foreground ml-1 cursor-pointer" />
              {(isFetchingOpp || isFetchingAll) && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />}
            </div>
            <div className="flex items-center gap-1.5">
              {!isWon && !isLost && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Mark As ▾
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleWon} className="text-xs gap-2">
                      <Trophy className="h-3.5 w-3.5 text-green-600" /> Won
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowLostDialog(true)} className="text-xs gap-2">
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" /> Lost
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left: Form */}
          <div className="w-full lg:flex-1 overflow-y-auto border-b lg:border-b-0 lg:border-r border-border">
            <div className="p-4 w-full relative overflow-hidden">
              {/* Won/Lost Ribbon Overlay */}
              {isWon && (
                <div className="absolute top-5 -right-8 rotate-45 bg-green-600 text-white text-xs font-bold px-10 py-1 z-20 shadow-md">
                  WON
                </div>
              )}
              {isLost && (
                <div className="absolute top-5 -right-8 rotate-45 bg-gray-500 text-white text-xs font-bold px-10 py-1 z-20 shadow-md">
                  LOST
                </div>
              )}

              {/* Chevron Stage Bar */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
                <div className="flex items-stretch flex-1">
                    {activeStages.map((stage, index) => {
                      const isActive = stage.id === opportunity.stageId;
                      const isPast = index < currentStageIndex;
                      const isLast = index === activeStages.length - 1;
                      const isFirst = index === 0;

                      const history = opportunity.stageHistory || [];
                      const stageEntry = history.find(h => h.stageId === stage.id);
                      let timeLabel = '';
                      if (stageEntry) {
                        const enteredAt = new Date(stageEntry.enteredAt).getTime();
                        if (isActive) {
                          timeLabel = formatElapsed(Date.now() - enteredAt);
                        } else if (isPast) {
                          const entryIndex = history.indexOf(stageEntry);
                          const nextEntry = history[entryIndex + 1];
                          if (nextEntry) {
                            timeLabel = formatElapsed(new Date(nextEntry.enteredAt).getTime() - enteredAt);
                          }
                        }
                      }

                      return (
                        <button
                          key={stage.id}
                          onClick={() => handleStageClick(stage.id)}
                          className={cn(
                            'relative flex-1 py-1.5 text-center text-xs font-semibold transition-all flex flex-col items-center justify-center min-w-[100px] lg:min-w-0 flex-shrink-0',
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
                          {timeLabel && (
                            <span className="text-[10px] font-normal opacity-80 leading-none">
                              {timeLabel}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Opportunity title — inline editable */}
              {/* Unsaved changes bar */}
              {isDirty && (
                <div className="bg-amber-50 border-t border-b border-amber-200 px-4 py-2 flex items-center gap-3 -mx-4 mb-4">
                  <span className="text-sm text-amber-700 font-medium">Unsaved changes</span>
                  <Button size="sm" className="h-8 text-xs bg-[#875A7B] hover:bg-[#6e4a64] text-white" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleDiscard}>Discard</Button>
                </div>
              )}

              {/* Opportunity title — inline editable */}
              <input
                className="text-2xl font-normal text-foreground mb-4 w-full border-0 border-b border-transparent hover:border-border focus:border-primary bg-transparent outline-none transition-colors"
                value={currentData.name}
                onChange={e => updateField('name', e.target.value)}
              />

              {/* Expected Revenue */}
              <div className="flex items-start gap-16 mb-6">
                <div>
                  <div className="text-sm font-bold text-foreground mb-1">Expected Revenue</div>
                  <div className="text-lg text-foreground">
                    <input
                      type="number"
                      className="border-0 border-b border-transparent hover:border-border focus:border-primary bg-transparent w-32 text-lg outline-none transition-colors"
                      value={currentData.expectedRevenue}
                      onChange={e => updateField('expectedRevenue', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Two-column form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 mb-6">
                {/* Contact — clickable name + pencil popover */}
                <OdooField label="Contact" link>
                  <div className="flex items-center gap-1 group">
                    {currentData.contactId ? (
                      <button onClick={() => navigate(`/crm/contacts/${currentData.contactId}`)} className="text-primary hover:underline text-sm">
                        {currentData.contactName || '—'}
                      </button>
                    ) : (
                      <span className="text-sm">{currentData.contactName || '—'}</span>
                    )}
                    <Popover open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5">
                          <Pencil className="h-3 w-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="start">
                        <Input
                          autoFocus
                          className="h-7 text-xs mb-1"
                          value={contactSearch}
                          onChange={e => setContactSearch(e.target.value)}
                        />
                        <div className="max-h-40 overflow-y-auto">
                          {allContacts.filter(c => {
                            const q = contactSearch.toLowerCase();
                            return !q || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
                          }).slice(0, 20).map(c => (
                            <button
                              key={c.id}
                              className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted rounded flex items-center gap-2"
                              onClick={() => {
                                updateField('contactId', c.id);
                                updateField('contactName', `${c.firstName} ${c.lastName}`);
                                setContactPopoverOpen(false);
                                setContactSearch('');
                              }}
                            >
                              <span className="font-medium">{c.firstName} {c.lastName}</span>
                              {c.email && <span className="text-muted-foreground truncate">{c.email}</span>}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </OdooField>

                {/* User Responsible */}
                <OdooField label="User Responsible" avatar>
                  <input
                    className={INLINE_CSS}
                    value={currentData.assignedTo || ''}
                    onChange={e => updateField('assignedTo', e.target.value)}
                  />
                </OdooField>

                {/* Email */}
                <OdooField label="Email">
                  {linkedContact?.email ? (
                    <span className="text-sm text-foreground truncate">{linkedContact.email}</span>
                  ) : (
                    <span className="text-muted-foreground/60 text-sm italic">
                      {currentData.contactId ? 'No email on contact' : 'Select a contact'}
                    </span>
                  )}
                </OdooField>

                {/* Expected Closing */}
                <OdooField label="Expected Closing">
                  <input
                    type="date"
                    className={cn(
                      INLINE_CSS,
                      !currentData.expectedCloseDate && "text-muted-foreground italic"
                    )}
                    value={currentData.expectedCloseDate || ''}
                    onChange={e => updateField('expectedCloseDate', e.target.value)}
                  />
                  <div className="ml-4">
                    <StarRating
                      value={opportunity.priority}
                      onChange={(p) => {
                        saveOpportunity({ ...opportunity, priority: p as 0 | 1 | 2 | 3 });
                      }}
                    />
                  </div>
                </OdooField>

                {/* Phone */}
                <OdooField label="Phone">
                  {linkedContact?.phone ? (
                    <span className="text-sm text-foreground">{linkedContact.phone}</span>
                  ) : (
                    <span className="text-muted-foreground/60 text-sm italic">
                      {currentData.contactId ? 'No phone on contact' : 'Select a contact'}
                    </span>
                  )}
                </OdooField>

                {/* Tags — auto-fetched from linked contact */}
                <OdooField label="Tags">
                  {linkedContact?.tags && linkedContact.tags.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
                      {linkedContact.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[11px] font-medium">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 text-sm italic">
                      {currentData.contactId ? 'No tags on contact' : 'Select a contact'}
                    </span>
                  )}
                </OdooField>
              </div>

              {/* Notebook Tabs — Notes + Contacts */}
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
                  <TiptapNotesEditor
                    value={currentData.internalNotes || ''}
                    onChange={(html) => updateField('internalNotes', html)}
                    placeholder="Write notes"
                    minHeight="240px"
                  />
                </TabsContent>

                <TabsContent value="contacts" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-[#875A7B] uppercase tracking-wide mb-3 border-b border-border pb-1">
                        Company Information
                      </h3>
                      <div className="space-y-2">
                        <OdooField label="Company Name" labelHint>
                          {currentData.companyName || linkedContact?.companyName || '—'}
                        </OdooField>
                        <OdooField label="Address">
                          {linkedContact?.addresses && linkedContact.addresses.length > 0 ? (
                            <div className="text-sm text-muted-foreground space-y-0.5">
                              {linkedContact.addresses[0].street && <div>{linkedContact.addresses[0].street}</div>}
                              {linkedContact.addresses[0].street2 && <div>{linkedContact.addresses[0].street2}</div>}
                              <div className="flex gap-4">
                                {linkedContact.addresses[0].city && <span>{linkedContact.addresses[0].city}</span>}
                                {linkedContact.addresses[0].postalCode && <span>{linkedContact.addresses[0].postalCode}</span>}
                                {linkedContact.addresses[0].state && <span>{linkedContact.addresses[0].state}</span>}
                              </div>
                              {linkedContact.addresses[0].country && <div>{linkedContact.addresses[0].country}</div>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 italic">No address on file</span>
                          )}
                        </OdooField>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#875A7B] uppercase tracking-wide mb-3 border-b border-border pb-1">
                        Contact Information
                      </h3>
                      {linkedContact ? (
                        <div className="space-y-2">
                          <OdooField label="Contact Name">
                            {linkedContact.firstName} {linkedContact.lastName}
                          </OdooField>
                          <OdooField label="Email">
                            {linkedContact.email ? (
                              <span>{linkedContact.email}</span>
                            ) : '—'}
                          </OdooField>
                          <OdooField label="Phone">
                            {linkedContact.phone || '—'}
                          </OdooField>
                          <OdooField label="Job Position">
                            {linkedContact.jobTitle || '—'}
                          </OdooField>
                          <OdooField label="Website" labelHint>
                            {linkedContact.website ? (
                              <a href={linkedContact.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{linkedContact.website}</a>
                            ) : '—'}
                          </OdooField>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <OdooField label="Contact Name">
                            {currentData.contactName || '—'}
                          </OdooField>
                          <p className="text-xs text-muted-foreground/50 italic mt-2">No linked contact record</p>
                        </div>
                      )}
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

              {/* Related Records — rounded cards linking to records of the same contact */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Related Records
                    <span className="ml-2 normal-case font-normal text-muted-foreground/70">
                      {currentData.contactName ? `for ${currentData.contactName}` : '(no contact selected)'}
                    </span>
                  </h3>
                </div>

                {/* Quick create buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <RoundedActionButton
                    icon={FileText}
                    label="New Quotation"
                    onClick={() => navigate(`/sales/quotations/new?customerId=${currentData.contactId || ''}&contact=${encodeURIComponent(currentData.contactName || '')}&amount=${currentData.expectedRevenue}&ref=${encodeURIComponent(opportunity.name)}`)}
                  />
                  <RoundedActionButton
                    icon={ShoppingCart}
                    label="New Sales Order"
                    onClick={() => navigate(`/sales/orders/new?customerId=${currentData.contactId || ''}&contact=${encodeURIComponent(currentData.contactName || '')}&amount=${currentData.expectedRevenue}&ref=${encodeURIComponent(opportunity.name)}`)}
                  />
                  <RoundedActionButton
                    icon={Package}
                    label="New Stock Operation"
                    onClick={() => navigate('/inventory/operations')}
                  />
                  {currentData.contactId && (
                    <RoundedActionButton
                      icon={User}
                      label="View Contact"
                      onClick={() => navigate(`/crm/contacts/${currentData.contactId}`)}
                    />
                  )}
                </div>

                {/* Existing related records grouped by module */}
                {(relatedRecords.quotations.length > 0 ||
                  relatedRecords.salesOrders.length > 0 ||
                  relatedRecords.stockMoves.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <RelatedGroup
                      title="Quotations"
                      icon={FileText}
                      count={relatedRecords.quotations.length}
                    >
                      {relatedRecords.quotations.slice(0, 5).map(q => (
                        <RelatedRow
                          key={q.id}
                          primary={q.reference}
                          secondary={`₹${q.total.toLocaleString('en-IN')}`}
                          status={q.status}
                          onClick={() => navigate(`/sales/quotations/${q.id}`)}
                        />
                      ))}
                    </RelatedGroup>
                    <RelatedGroup
                      title="Sales Orders"
                      icon={ShoppingCart}
                      count={relatedRecords.salesOrders.length}
                    >
                      {relatedRecords.salesOrders.slice(0, 5).map(o => (
                        <RelatedRow
                          key={o.id}
                          primary={o.reference}
                          secondary={`₹${o.total.toLocaleString('en-IN')}`}
                          status={o.status}
                          onClick={() => navigate(`/sales/orders/${o.id}`)}
                        />
                      ))}
                    </RelatedGroup>
                    <RelatedGroup
                      title="Stock Moves"
                      icon={Package}
                      count={relatedRecords.stockMoves.length}
                    >
                      {relatedRecords.stockMoves.slice(0, 5).map(m => (
                        <RelatedRow
                          key={m.id}
                          primary={m.reference}
                          secondary={m.operationType}
                          status={m.state}
                          onClick={() => navigate(`/inventory/operations`)}
                        />
                      ))}
                    </RelatedGroup>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No quotations, sales orders, or stock moves found for this contact yet.
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Right: Chatter panel */}
          <div className="w-full lg:w-[380px] min-h-[480px] lg:min-h-0 max-h-[500px] lg:max-h-none flex flex-col shrink-0 bg-card overflow-y-auto">
            {/* Chatter tabs */}
            <div className="flex items-center border-b border-border px-3 py-2 gap-1 flex-wrap sm:flex-nowrap">
              <Button
                variant={chatterTab === 'message' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-11 sm:h-7 px-4 sm:px-3 text-sm sm:text-xs font-medium',
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
                  'h-11 sm:h-7 px-4 sm:px-3 text-sm sm:text-xs font-medium',
                  chatterTab === 'note' && 'bg-foreground text-background hover:bg-foreground/90'
                )}
                onClick={() => setChatterTab('note')}
              >
                Log note
              </Button>
              <Button
                variant={chatterTab === 'activity' ? 'default' : 'outline'}
                size="sm"
                className="h-11 sm:h-7 px-4 sm:px-3 text-sm sm:text-xs font-medium"
                onClick={() => setChatterTab('activity')}
              >
                Activity
              </Button>
              <div className="flex-1" />
              <button className="text-muted-foreground hover:text-foreground" onClick={() => { setShowChatterSearch(s => !s); setChatterSearch(''); }}>
                <Search className="h-4 w-4" />
              </button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="relative text-muted-foreground inline-flex items-center">
                    <span className="text-[10px] font-bold">👤</span>
                    <span className="absolute -top-1 -right-1 bg-[#875A7B] text-white text-[8px] rounded-full h-3 w-3 flex items-center justify-center">1</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Followers: {opportunity.assignedTo || user?.name || 'You'}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Compose area */}
            {(chatterTab === 'message' || chatterTab === 'note') && (
              <div className="p-3 border-b border-border">
                <div className="flex gap-2.5">
                  <ChatterAvatar name={user?.name || 'User'} />
                  <div className="flex-1 min-w-0">
                    <RichComposer
                      compact
                      placeholder={chatterTab === 'note' ? 'Log an internal note… type @ to mention' : 'Send a message… type @ to mention'}
                      submitLabel={chatterTab === 'note' ? 'Log' : 'Send'}
                      onSubmit={handleChatterSubmit}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Activity compose area */}
            {chatterTab === 'activity' && (
              <div className="p-3 border-b border-border space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Type</label>
                    <Select value={activityForm.type} onValueChange={(v) => setActivityForm(f => ({ ...f, type: v as any }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Due Date</label>
                    <Input type="date" className="h-7 text-xs" value={activityForm.dueDate} onChange={(e) => setActivityForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Assigned To</label>
                  <Input className="h-7 text-xs" value={activityForm.assignedTo} onChange={(e) => setActivityForm(f => ({ ...f, assignedTo: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Summary</label>
                  <Textarea className="min-h-[60px] text-xs" value={activityForm.summary} onChange={(e) => setActivityForm(f => ({ ...f, summary: e.target.value }))} />
                </div>
                <Button size="sm" className="h-7 text-xs" onClick={handleActivitySubmit}>Schedule</Button>
              </div>
            )}

            {/* Chatter search */}
            {showChatterSearch && (
              <div className="px-3 py-2 border-b border-border">
                <Input
                  autoFocus
                  className="h-7 text-xs"
                  value={chatterSearch}
                  onChange={(e) => setChatterSearch(e.target.value)}
                />
              </div>
            )}

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">Today</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {[...chatterNotes, ...chatterActivities.filter(a => a.completed)]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .filter((item) => {
                  if (!chatterSearch.trim()) return true;
                  const q = chatterSearch.toLowerCase();
                  const text = 'content' in item ? (item as Note).content : ((item as any).description || (item as Activity).subject);
                  const userName = (item as any).userName || '';
                  return text?.toLowerCase().includes(q) || userName.toLowerCase().includes(q);
                })
                .slice(0, 20)
                .map((item) => {
                  const isNoteItem = 'content' in item;
                  const userName = (item as any).userName || 'System';
                  const html = isNoteItem ? (item as Note).content : ((item as any).description || (item as Activity).subject);
                  const attachments = (item as any).attachments;
                  return (
                    <div key={item.id} className="flex gap-2.5 mb-3">
                      <ChatterAvatar name={userName} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-foreground">{userName}</span>
                          <span className="text-xs text-muted-foreground">{format(parseISO(item.createdAt), 'h:mm a')}</span>
                        </div>
                        <div className="mt-0.5">
                          <RichContent html={html} attachments={attachments} />
                        </div>
                      </div>
                    </div>
                  );
                })}

              {chatterNotes.length === 0 && chatterActivities.filter(a => a.completed).length === 0 && (
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
    </>
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

// Rounded "pill" action button used in the Related Records section
function RoundedActionButton({
  icon: Icon, label, onClick,
}: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card hover:bg-muted hover:border-primary/40 px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-colors"
    >
      <Icon className="h-3.5 w-3.5 text-primary" />
      {label}
    </button>
  );
}

// Card grouping for related-record lists
function RelatedGroup({
  title, icon: Icon, count, children,
}: { title: string; icon: React.ElementType; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Icon className="h-3.5 w-3.5 text-primary" />
          {title}
        </div>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{count}</Badge>
      </div>
      {count === 0 ? (
        <p className="text-xs text-muted-foreground italic">None yet</p>
      ) : (
        <div className="space-y-1">{children}</div>
      )}
    </div>
  );
}

// Single row within a RelatedGroup
function RelatedRow({
  primary, secondary, status, onClick,
}: { primary: string; secondary?: string; status?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 rounded-md border border-transparent hover:border-border hover:bg-muted px-2 py-1.5 text-left transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-foreground truncate">{primary}</div>
        {secondary && (
          <div className="text-[10px] text-muted-foreground truncate">{secondary}</div>
        )}
      </div>
      {status && (
        <Badge variant="outline" className="text-[9px] capitalize shrink-0">
          {status}
        </Badge>
      )}
    </button>
  );
}
