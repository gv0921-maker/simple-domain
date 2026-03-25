// CRM Lead Detail Page
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  Sparkles,
  Trash2,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getLead,
  getLeads,
  saveLead,
  deleteLead,
  convertLeadToOpportunity,
  getActivities,
  getNotes,
  saveNote,
  type Lead,
  type LeadPriority,
  type LeadSource,
} from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const PRIORITY_COLORS: Record<LeadPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-accent/20 text-accent-foreground',
  high: 'bg-warning/20 text-warning-foreground',
  urgent: 'bg-destructive/20 text-destructive',
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canDeleteLeads, canConvertLeads } = useCRMPermissions();
  const allLeads = getLeads().filter(l => l.status !== 'converted');

  const [lead, setLead] = useState<Lead | undefined>(() => id ? getLead(id) : undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [noteInput, setNoteInput] = useState('');

  const notes = useMemo(() => id ? getNotes('lead', id) : [], [id]);
  const activities = useMemo(() => id ? getActivities('lead', id) : [], [id]);

  const currentIndex = allLeads.findIndex(l => l.id === id);
  const totalRecords = allLeads.length;

  if (!lead) {
    return (
      <AppLayout title="CRM" moduleNav={CRM_NAV}>
        <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <p className="text-muted-foreground">Lead not found</p>
          <Button variant="outline" onClick={() => navigate('/crm')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </AppLayout>
    );
  }

  const currentData = { ...lead, ...editData };

  const handleSave = () => {
    saveLead({ ...lead, ...editData });
    setLead(getLead(lead.id));
    setIsEditing(false);
    setEditData({});
    toast({ title: 'Lead updated' });
  };

  const handleConvert = () => {
    const opportunity = convertLeadToOpportunity(lead.id);
    if (opportunity) {
      toast({ title: 'Lead converted to opportunity' });
      navigate(`/crm/opportunities/${opportunity.id}`);
    }
  };

  const handleDelete = () => {
    deleteLead(lead.id);
    toast({ title: 'Lead deleted' });
    navigate('/crm');
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    saveNote({
      content: noteInput,
      relatedTo: 'lead',
      relatedId: lead.id,
      userId: '1',
      userName: 'Management',
      visibility: 'team',
    });
    setNoteInput('');
    toast({ title: 'Note added' });
  };

  const navigateRecord = (dir: 'prev' | 'next') => {
    const newIndex = dir === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < totalRecords) {
      navigate(`/crm/leads/${allLeads[newIndex].id}`);
    }
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="border-b border-border bg-card px-4 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <button onClick={() => navigate('/crm')} className="text-primary hover:underline font-medium text-sm">
                Leads
              </button>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground font-medium">{lead.title}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{currentIndex + 1} / {totalRecords}</span>
              <button onClick={() => navigateRecord('prev')} disabled={currentIndex <= 0} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => navigateRecord('next')} disabled={currentIndex >= totalRecords - 1} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header with actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {isEditing ? (
                  <Input
                    defaultValue={lead.title}
                    className="text-2xl font-semibold h-auto py-1 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0"
                    onChange={e => setEditData({ ...editData, title: e.target.value })}
                  />
                ) : lead.title}
              </h1>
              <Badge className={cn('text-xs capitalize', PRIORITY_COLORS[lead.priority])}>
                {lead.priority}
              </Badge>
              <Badge variant={lead.status === 'converted' ? 'default' : 'outline'} className="capitalize text-xs">
                {lead.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {canConvertLeads && lead.status !== 'converted' && (
                <Button size="sm" onClick={handleConvert} className="bg-[#00A09D] hover:bg-[#008f8c] text-white">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Convert to Opportunity
                </Button>
              )}
              {canDeleteLeads && (
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lead Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <FormField label="Contact Name" icon={User}>
                      {isEditing ? (
                        <Input defaultValue={lead.contactName} className="h-8 text-sm" onChange={e => setEditData({ ...editData, contactName: e.target.value })} />
                      ) : currentData.contactName}
                    </FormField>
                    <FormField label="Email" icon={Mail}>
                      {isEditing ? (
                        <Input defaultValue={lead.email} className="h-8 text-sm" onChange={e => setEditData({ ...editData, email: e.target.value })} />
                      ) : currentData.email ? (
                        <a href={`mailto:${currentData.email}`} className="text-primary hover:underline">{currentData.email}</a>
                      ) : '—'}
                    </FormField>
                    <FormField label="Phone" icon={Phone}>
                      {isEditing ? (
                        <Input defaultValue={lead.phone} className="h-8 text-sm" onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                      ) : currentData.phone ? (
                        <a href={`tel:${currentData.phone}`} className="text-primary hover:underline">{currentData.phone}</a>
                      ) : '—'}
                    </FormField>
                    <FormField label="Company" icon={Building}>
                      {isEditing ? (
                        <Input defaultValue={lead.companyName} className="h-8 text-sm" onChange={e => setEditData({ ...editData, companyName: e.target.value })} />
                      ) : currentData.companyName || '—'}
                    </FormField>
                    <FormField label="Source">
                      {isEditing ? (
                        <Select defaultValue={lead.source} onValueChange={v => setEditData({ ...editData, source: v as LeadSource })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="social_media">Social Media</SelectItem>
                            <SelectItem value="trade_show">Trade Show</SelectItem>
                            <SelectItem value="cold_call">Cold Call</SelectItem>
                            <SelectItem value="email_campaign">Email Campaign</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-xs capitalize">{currentData.source.replace('_', ' ')}</Badge>
                      )}
                    </FormField>
                    <FormField label="Priority">
                      {isEditing ? (
                        <Select defaultValue={lead.priority} onValueChange={v => setEditData({ ...editData, priority: v as LeadPriority })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={cn('text-xs capitalize', PRIORITY_COLORS[currentData.priority])}>{currentData.priority}</Badge>
                      )}
                    </FormField>
                    <FormField label="Expected Revenue" icon={IndianRupee}>
                      {isEditing ? (
                        <Input type="number" defaultValue={lead.expectedRevenue} className="h-8 text-sm" onChange={e => setEditData({ ...editData, expectedRevenue: parseFloat(e.target.value) || 0 })} />
                      ) : `₹${currentData.expectedRevenue.toLocaleString('en-IN')}`}
                    </FormField>
                    <FormField label="Created" icon={Calendar}>
                      {format(parseISO(lead.createdAt), 'MMM dd, yyyy')}
                    </FormField>
                  </div>

                  {/* Edit/Save bar */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                    {isEditing ? (
                      <>
                        <Button size="sm" className="h-8 text-xs bg-[#875A7B] hover:bg-[#6e4a64] text-white" onClick={handleSave}>Save</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setIsEditing(false); setEditData({}); }}>Discard</Button>
                      </>
                    ) : lead.status !== 'converted' && (
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setIsEditing(true)}>Edit</Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes & Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a note..."
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddNote(); }}
                    />
                    <Button size="sm" onClick={handleAddNote} disabled={!noteInput.trim()}>Add</Button>
                  </div>
                  <div className="space-y-3">
                    {[...notes, ...activities]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map(item => {
                        const isNote = 'content' in item;
                        return (
                          <div key={item.id} className="flex gap-3 p-3 rounded-md bg-muted/50">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {((item as any).userName || 'S').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{(item as any).userName || 'System'}</span>
                                <span className="text-xs text-muted-foreground">{format(parseISO(item.createdAt), 'MMM d, h:mm a')}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {isNote ? (item as any).content : (item as any).subject}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    {notes.length === 0 && activities.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentData.email && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={`mailto:${currentData.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </a>
                    </Button>
                  )}
                  {currentData.phone && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={`tel:${currentData.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  )}
                  {currentData.contactId && (
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/crm/contacts/${currentData.contactId}`)}>
                      <User className="h-4 w-4 mr-2" />
                      View Contact
                    </Button>
                  )}
                </CardContent>
              </Card>

              {lead.convertedToOpportunityId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Converted Opportunity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/crm/opportunities/${lead.convertedToOpportunityId}`)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      View Opportunity
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold">{lead.score}</div>
                    <Badge variant={lead.score >= 70 ? 'default' : lead.score >= 40 ? 'secondary' : 'outline'}>
                      {lead.score >= 70 ? 'Hot' : lead.score >= 40 ? 'Warm' : 'Cold'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function FormField({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="w-32 shrink-0 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
      </div>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}
