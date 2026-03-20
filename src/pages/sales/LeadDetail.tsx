import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Trash2,
  Phone,
  Mail,
  Building,
  DollarSign,
  User,
  Calendar,
  Plus,
  CheckCircle2,
  MessageSquare,
  Clock,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { WorkflowStatus } from '@/components/forms/WorkflowStatus';
import { ActivityTimeline } from '@/components/forms/ActivityTimeline';
import { getLead, saveLead, type Lead, type LeadStatus, type Activity } from '@/lib/data/sales';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getItem, setItem } from '@/lib/storage';

const LEAD_STAGES: { id: LeadStatus; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposition', label: 'Proposition' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

const SOURCES = ['Website', 'Referral', 'Social Media', 'Trade Show', 'Cold Call', 'Email Campaign', 'Other'];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = id === 'new';

  const [lead, setLead] = useState<Lead>({
    id: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    company: '',
    source: 'Website',
    status: 'new',
    expectedRevenue: 0,
    probability: 10,
    assignedTo: user?.name,
    tags: [],
    notes: '',
    activities: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [newActivity, setNewActivity] = useState({
    type: 'call' as Activity['type'],
    subject: '',
    description: '',
  });
  const [newTag, setNewTag] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      const existingLead = getLead(id);
      if (existingLead) {
        setLead(existingLead);
      } else {
        navigate('/sales/leads');
      }
    }
  }, [id, isNew, navigate]);

  const handleChange = (field: keyof Lead, value: any) => {
    setLead((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    const probabilities: Record<LeadStatus, number> = {
      new: 10,
      qualified: 30,
      proposition: 60,
      won: 100,
      lost: 0,
    };

    setLead((prev) => ({
      ...prev,
      status: newStatus,
      probability: probabilities[newStatus],
      activities: [
        ...prev.activities,
        {
          id: crypto.randomUUID(),
          userId: user?.id || '1',
          userName: user?.name || 'System',
          type: 'note',
          subject: `Status changed to ${newStatus}`,
          completed: true,
          timestamp: new Date().toISOString(),
        },
      ],
    }));
    setHasChanges(true);
  };

  const handleAddActivity = () => {
    if (!newActivity.subject) {
      toast({ title: 'Subject is required', variant: 'destructive' });
      return;
    }

    const activity: Activity = {
      id: crypto.randomUUID(),
      userId: user?.id || '1',
      userName: user?.name || 'System',
      type: newActivity.type,
      subject: newActivity.subject,
      description: newActivity.description,
      completed: false,
      timestamp: new Date().toISOString(),
    };

    setLead((prev) => ({
      ...prev,
      activities: [...prev.activities, activity],
    }));
    setNewActivity({ type: 'call', subject: '', description: '' });
    setHasChanges(true);
  };

  const handleAddTag = () => {
    if (!newTag.trim() || lead.tags.includes(newTag.trim())) return;
    setLead((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag.trim()],
    }));
    setNewTag('');
    setHasChanges(true);
  };

  const handleRemoveTag = (tag: string) => {
    setLead((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!lead.name || !lead.contactName || !lead.email) {
      toast({
        title: 'Validation Error',
        description: 'Name, contact name, and email are required',
        variant: 'destructive',
      });
      return;
    }

    saveLead(lead);
    setHasChanges(false);
    toast({
      title: isNew ? 'Lead Created' : 'Lead Updated',
      description: `${lead.name} has been saved.`,
    });

    if (isNew) {
      navigate('/sales/leads');
    }
  };

  const handleDelete = () => {
    const leads = getItem<Lead[]>('leads', []).filter((l) => l.id !== lead.id);
    setItem('leads', leads);
    toast({ title: 'Lead Deleted' });
    navigate('/sales/leads');
  };

  const currentIndex = LEAD_STAGES.findIndex((s) => s.id === lead.status);
  const workflowSteps = LEAD_STAGES.slice(0, 4).map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    status: index < currentIndex ? 'completed' as const : index === currentIndex ? 'current' as const : 'upcoming' as const,
  }));

  return (
    <AppLayout title="CRM" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/sales/leads')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {isNew ? 'New Lead' : lead.name}
              </h1>
              {!isNew && (
                <p className="text-muted-foreground">{lead.company || lead.contactName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-warning border-warning">
                Unsaved Changes
              </Badge>
            )}
            {!isNew && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this lead.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              {isNew ? 'Create Lead' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Workflow Status */}
        {!isNew && lead.status !== 'lost' && (
          <Card className="animate-fade-in">
            <CardContent className="pt-6">
              <WorkflowStatus
                steps={workflowSteps}
                onStepClick={(stepId) => handleStatusChange(stepId as LeadStatus)}
              />
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        {!isNew && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="animate-slide-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Expected Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{lead.expectedRevenue.toLocaleString('en-IN')}</div>
              </CardContent>
            </Card>
            <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Probability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lead.probability}%</div>
              </CardContent>
            </Card>
            <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{lead.source}</Badge>
              </CardContent>
            </Card>
            <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.assignedTo || 'Unassigned'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="space-y-6">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle>Lead Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Lead Name *</Label>
                        <Input
                          value={lead.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          placeholder=""
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Source</Label>
                        <Select
                          value={lead.source}
                          onValueChange={(v) => handleChange('source', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOURCES.map((source) => (
                              <SelectItem key={source} value={source}>
                                {source}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Expected Revenue</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={lead.expectedRevenue}
                            onChange={(e) => handleChange('expectedRevenue', parseFloat(e.target.value) || 0)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Probability (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={lead.probability}
                          onChange={(e) => handleChange('probability', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Contact Name *</Label>
                        <Input
                          value={lead.contactName}
                          onChange={(e) => handleChange('contactName', e.target.value)}
                          placeholder=""
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Company</Label>
                        <Input
                          value={lead.company || ''}
                          onChange={(e) => handleChange('company', e.target.value)}
                          placeholder=""
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={lead.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder=""
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Phone</Label>
                        <Input
                          value={lead.phone || ''}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder=""
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={lead.notes || ''}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder=""
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle>Log Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select
                          value={newActivity.type}
                          onValueChange={(v) => setNewActivity({ ...newActivity, type: v as Activity['type'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="note">Note</SelectItem>
                            <SelectItem value="task">Task</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label>Subject</Label>
                        <Input
                          value={newActivity.subject}
                          onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                          placeholder=""
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleAddActivity} className="w-full gap-2">
                          <Plus className="h-4 w-4" />
                          Log
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lead.activities.length > 0 ? (
                      <ActivityTimeline
                        activities={lead.activities.map((a) => ({
                          id: a.id,
                          userId: a.userId,
                          userName: a.userName,
                          action: a.subject,
                          details: a.description,
                          timestamp: a.timestamp,
                        }))}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No activities logged yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder=""
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button onClick={handleAddTag} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                  {lead.tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {lead.status === 'lost' && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge variant="destructive" className="mb-2">Lost</Badge>
                    <p className="text-sm text-muted-foreground">This lead has been marked as lost</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
