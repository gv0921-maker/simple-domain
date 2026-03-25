// CRM Leads List Page with Kanban view
import { useState, useMemo, useCallback } from 'react';
import { useStudioConfig } from '@/hooks/useStudioConfig';
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
  Sparkles,
  User,
} from 'lucide-react';
import {
  getLeads,
  deleteLead,
  convertLeadToOpportunity,
  saveLead,
  type Lead,
  type LeadSource,
  type LeadPriority,
} from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { CRMExportButton } from '@/components/crm/CRMImportExport';
import { CRMFilterPopover, type FilterOption, type ActiveFilter } from '@/components/crm/CRMFilterPopover';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const LEAD_FILTER_OPTIONS: FilterOption[] = [
  { id: 'status:new', label: 'New', group: 'Status' },
  { id: 'status:contacted', label: 'Contacted', group: 'Status' },
  { id: 'status:qualified', label: 'Qualified', group: 'Status' },
  { id: 'priority:high', label: 'High Priority', group: 'Priority' },
  { id: 'priority:urgent', label: 'Urgent', group: 'Priority' },
  { id: 'source:website', label: 'Website', group: 'Source' },
  { id: 'source:referral', label: 'Referral', group: 'Source' },
  { id: 'source:social_media', label: 'Social Media', group: 'Source' },
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
  const { canCreateLeads, canDeleteLeads, canConvertLeads, filterByScope } = useCRMPermissions();
  const { user } = useAuth();
  const studio = useStudioConfig('crm', 'New Lead');
  const [leads, setLeads] = useState<Lead[]>(() => getLeads());
  const [search, setSearch] = useState('');
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
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

  const isSearching = search.trim().length > 0;

  const scopedLeads = useMemo(() => filterByScope(leads), [leads, filterByScope]);

  const filteredLeads = useMemo(() => {
    const base = isSearching
      ? scopedLeads
      : scopedLeads.filter((l) => l.status !== 'converted');
    
    let filtered = base.filter(
      (l) =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.contactName.toLowerCase().includes(search.toLowerCase()) ||
        (l.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );

    // Apply active filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(l => {
        return activeFilters.every(f => {
          const [type, value] = f.id.split(':');
          if (type === 'status') return l.status === value;
          if (type === 'priority') return l.priority === value;
          if (type === 'source') return l.source === value;
          return true;
        });
      });
    }

    return filtered;
  }, [scopedLeads, search, isSearching, activeFilters]);

  const handleToggleFilter = useCallback((filter: FilterOption) => {
    setActiveFilters(prev => {
      const exists = prev.some(f => f.id === filter.id);
      if (exists) return prev.filter(f => f.id !== filter.id);
      return [...prev, { id: filter.id, label: filter.label }];
    });
  }, []);


  const stats = useMemo(() => {
    const activeLeads = leads.filter((l) => l.status !== 'converted');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const convertedToday = leads.filter(
      (l) => l.status === 'converted' && l.convertedAt && format(parseISO(l.convertedAt), 'yyyy-MM-dd') === todayStr
    ).length;
    const pendingCount = activeLeads.length;
    return {
      total: activeLeads.length,
      new: activeLeads.filter((l) => l.status === 'new').length,
      completed: convertedToday,
      pending: pendingCount,
    };
  }, [leads]);

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
    if (!formData.title) {
      toast({ title: 'Lead name is required', variant: 'destructive' });
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
            {canCreateLeads && (
              <Button onClick={() => setIsNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            )}
            <CRMExportButton type="leads" />
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
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
            <CRMFilterPopover
              options={LEAD_FILTER_OPTIONS}
              activeFilters={activeFilters}
              onToggleFilter={handleToggleFilter}
              onClearAll={() => setActiveFilters([])}
            />
          </div>
        </div>

        {/* List View */}
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


        {/* New Lead Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Customer</DialogTitle>
              <DialogDescription>Create a new sales lead</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {studio.isFieldVisible('name') && (
                <div className="grid gap-2">
                  <Label>{studio.getFieldLabel('name', 'Title')} {studio.isFieldRequired('name', true) && '*'}</Label>
                  <Input
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={studio.getFieldPlaceholder('name', 'e.g., Office Furniture Quote')}
                    readOnly={studio.isFieldReadOnly('name')}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {studio.isFieldVisible('contactName') && (
                  <div className="grid gap-2">
                    <Label>{studio.getFieldLabel('contactName', 'Name')} {studio.isFieldRequired('contactName') && '*'}</Label>
                    <Input
                      value={formData.contactName || ''}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder={studio.getFieldPlaceholder('contactName', 'John Doe')}
                      readOnly={studio.isFieldReadOnly('contactName')}
                    />
                  </div>
                )}
                {studio.isFieldVisible('email') && (
                  <div className="grid gap-2">
                    <Label>{studio.getFieldLabel('email', 'Email')} {studio.isFieldRequired('email') && '*'}</Label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={studio.getFieldPlaceholder('email', 'john@example.com')}
                      readOnly={studio.isFieldReadOnly('email')}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {studio.isFieldVisible('phone') && (
                  <div className="grid gap-2">
                    <Label>{studio.getFieldLabel('phone', 'Phone')}</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={studio.getFieldPlaceholder('phone', '+1 555-0123')}
                      readOnly={studio.isFieldReadOnly('phone')}
                    />
                  </div>
                )}
                {studio.isFieldVisible('company') && (
                  <div className="grid gap-2">
                    <Label>{studio.getFieldLabel('company', 'Company')}</Label>
                    <Input
                      value={formData.companyName || ''}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder={studio.getFieldPlaceholder('company', 'Company name')}
                      readOnly={studio.isFieldReadOnly('company')}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {studio.isFieldVisible('source') && (
                  <div className="grid gap-2">
                    <Label>{studio.getFieldLabel('source', 'Source')}</Label>
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
                )}
                {studio.isFieldVisible('priority') && (
                  <div className="grid gap-2">
                    <Label>{studio.getFieldLabel('priority', 'Priority')}</Label>
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
                )}
                {studio.isFieldVisible('expectedRevenue') && (
                  <div className="grid gap-2">
                    <Label>{studio.getFieldLabel('expectedRevenue', 'Expected Revenue')}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        value={formData.expectedRevenue || ''}
                        onChange={(e) => setFormData({ ...formData, expectedRevenue: parseFloat(e.target.value) || 0 })}
                        className="pl-8"
                        readOnly={studio.isFieldReadOnly('expectedRevenue')}
                      />
                    </div>
                  </div>
                )}
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
