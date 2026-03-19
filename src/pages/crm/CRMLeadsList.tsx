// CRM Leads List Page with Kanban view
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  IndianRupee,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  User,
} from 'lucide-react';
import {
  getLeads,
  deleteLead,
  convertLeadToOpportunity,
  saveLead,
  type Lead,
  type LeadStatus,
  type LeadSource,
  type LeadPriority,
} from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { CRMExportButton } from '@/components/crm/CRMImportExport';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const LEAD_STATUSES: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'New', color: 'bg-info' },
  { id: 'contacted', label: 'Contacted', color: 'bg-accent' },
  { id: 'qualified', label: 'Qualified', color: 'bg-warning' },
  { id: 'unqualified', label: 'Unqualified', color: 'bg-muted' },
  { id: 'converted', label: 'Converted', color: 'bg-success' },
  { id: 'lost', label: 'Lost', color: 'bg-destructive' },
];

const PRIORITY_COLORS: Record<LeadPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-accent/20 text-accent-foreground',
  high: 'bg-warning/20 text-warning-foreground',
  urgent: 'bg-destructive/20 text-destructive',
};

export default function CRMLeadsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canCreateLeads, canDeleteLeads, canConvertLeads } = useCRMPermissions();
  const { user } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>(() => getLeads());
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({
    title: '',
    contactName: '',
    email: '',
    phone: '',
    companyName: '',
    source: 'manual',
    priority: 'medium',
    expectedRevenue: 0,
  });

  const filteredLeads = useMemo(() => {
    return leads.filter(
      (l) =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.contactName.toLowerCase().includes(search.toLowerCase()) ||
        (l.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }, [leads, search]);

  const leadsByStatus = useMemo(() => {
    const grouped: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      unqualified: [],
      converted: [],
      lost: [],
    };
    filteredLeads.forEach((lead) => {
      grouped[lead.status].push(lead);
    });
    return grouped;
  }, [filteredLeads]);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    totalValue: leads.reduce((sum, l) => sum + l.expectedRevenue, 0),
  }), [leads]);

  const handleConvert = (id: string) => {
    const opportunity = convertLeadToOpportunity(id);
    if (opportunity) {
      setLeads(getLeads());
      toast({ title: 'Lead converted to opportunity' });
      navigate(`/crm/opportunities/${opportunity.id}`);
    }
  };

  const handleDelete = (id: string) => {
    deleteLead(id);
    setLeads(getLeads());
    toast({ title: 'Lead deleted' });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.contactName || !formData.email) {
      toast({ title: 'Title, contact name, and email are required', variant: 'destructive' });
      return;
    }

    saveLead({ ...formData, createdBy: user?.name || 'Unknown' });
    setLeads(getLeads());
    setIsNewDialogOpen(false);
    setFormData({
      title: '',
      contactName: '',
      email: '',
      phone: '',
      companyName: '',
      source: 'manual',
      priority: 'medium',
      expectedRevenue: 0,
    });
    toast({ title: 'Lead created' });
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
            <p className="text-muted-foreground">Track and qualify your sales leads</p>
          </div>
          <div className="flex gap-2">
            <CRMExportButton type="leads" />
            {canCreateLeads && (
              <Button onClick={() => setIsNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{stats.new}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Qualified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.qualified}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* List View */}
        {view === 'list' && (
          <Card className="animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <TableRow
                      key={lead.id}
                      className="animate-fade-in cursor-pointer hover:bg-muted/50"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.title}</p>
                          {lead.companyName && (
                            <p className="text-xs text-muted-foreground">{lead.companyName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {lead.contactName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {lead.source.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs capitalize', PRIORITY_COLORS[lead.priority])}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <IndianRupee className="h-3 w-3" />
                          {lead.expectedRevenue.toLocaleString('en-IN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{lead.createdBy || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canConvertLeads && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleConvert(lead.id); }}>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Convert to Opportunity
                              </DropdownMenuItem>
                            )}
                            {canDeleteLeads && (
                              <>
                                {canConvertLeads && <DropdownMenuSeparator />}
                                <DropdownMenuItem
                                  onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Kanban View */}
        {view === 'kanban' && (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {LEAD_STATUSES.filter((s) => !['converted', 'lost'].includes(s.id)).map((status) => (
                <div key={status.id} className="w-72 flex flex-col bg-muted/30 rounded-lg">
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', status.color)} />
                      <h3 className="font-medium text-sm">{status.label}</h3>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {leadsByStatus[status.id].length}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                    {leadsByStatus[status.id].map((lead) => (
                      <Card
                        key={lead.id}
                        className="p-3 cursor-pointer card-hover"
                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                      >
                        <p className="font-medium text-sm line-clamp-2">{lead.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{lead.contactName}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={cn('text-xs capitalize', PRIORITY_COLORS[lead.priority])}>
                            {lead.priority}
                          </Badge>
                          <span className="text-sm font-medium">₹{lead.expectedRevenue.toLocaleString('en-IN')}</span>
                        </div>
                      </Card>
                    ))}
                    {leadsByStatus[status.id].length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No leads</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Lead Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Lead</DialogTitle>
              <DialogDescription>Create a new sales lead</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Lead Title *</Label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Office Furniture Quote"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Contact Name *</Label>
                  <Input
                    value={formData.contactName || ''}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0123"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Company</Label>
                  <Input
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) => setFormData({ ...formData, source: v as LeadSource })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v as LeadPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Expected Revenue</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={formData.expectedRevenue || ''}
                      onChange={(e) => setFormData({ ...formData, expectedRevenue: parseFloat(e.target.value) || 0 })}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Lead</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
