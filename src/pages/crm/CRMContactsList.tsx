// CRM Contacts List Page
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Trash2,
  Phone,
  Mail,
  Building,
  User,
  UserPlus,
  Upload,
} from 'lucide-react';
import { getContacts, deleteContact, type Contact } from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { CRMImportDialog, CRMExportButton } from '@/components/crm/CRMImportExport';
import { CRMFilterPopover, type FilterOption, type ActiveFilter } from '@/components/crm/CRMFilterPopover';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminUser } from '@/lib/data/rbac';

const CONTACT_FILTER_OPTIONS: FilterOption[] = [
  { id: 'status:active', label: 'Active', group: 'Status' },
  { id: 'status:archived', label: 'Archived', group: 'Status' },
  { id: 'score:high', label: 'High Score (70+)', group: 'Score' },
  { id: 'score:medium', label: 'Medium Score (40-69)', group: 'Score' },
  { id: 'score:low', label: 'Low Score (<40)', group: 'Score' },
  { id: 'has:company', label: 'Has Company', group: 'Other' },
  { id: 'has:phone', label: 'Has Phone', group: 'Other' },
];

export default function CRMContactsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canCreateContacts, canDeleteContacts, canImportData, filterByScope } = useCRMPermissions();
  const isSuperAdmin = user ? isSuperAdminUser(user.id) : false;
  
  const [contacts, setContacts] = useState<Contact[]>(() => getContacts());
  const [search, setSearch] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const scopedContacts = useMemo(() => filterByScope(contacts), [contacts, filterByScope]);

  const filteredContacts = useMemo(() => {
    let filtered = scopedContacts.filter(
      (c) =>
        c.firstName.toLowerCase().includes(search.toLowerCase()) ||
        c.lastName.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );

    if (activeFilters.length > 0) {
      filtered = filtered.filter(c => {
        return activeFilters.every(f => {
          const [type, value] = f.id.split(':');
          if (type === 'status') return c.status === value;
          if (type === 'score') {
            if (value === 'high') return c.score >= 70;
            if (value === 'medium') return c.score >= 40 && c.score < 70;
            if (value === 'low') return c.score < 40;
          }
          if (type === 'has') {
            if (value === 'company') return !!c.companyName;
            if (value === 'phone') return !!c.phone;
          }
          return true;
        });
      });
    }

    return filtered;
  }, [scopedContacts, search, activeFilters]);

  const handleToggleFilter = useCallback((filter: FilterOption) => {
    setActiveFilters(prev => {
      const exists = prev.some(f => f.id === filter.id);
      if (exists) return prev.filter(f => f.id !== filter.id);
      return [...prev, { id: filter.id, label: filter.label }];
    });
  }, []);

  const handleDelete = (id: string) => {
    deleteContact(id);
    setContacts(getContacts());
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    toast({ title: 'Contact deleted' });
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteContact(id));
    setContacts(getContacts());
    toast({ title: `${selectedIds.size} contact(s) deleted` });
    setSelectedIds(new Set());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (checked) n.add(id); else n.delete(id);
      return n;
    });
  };

  const allSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
            <p className="text-muted-foreground">Manage your contacts and customer relationships</p>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin && someSelected && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedIds.size})
              </Button>
            )}
            <CRMExportButton type="contacts" />
            {canImportData && (
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            {canCreateContacts && (
              <Button onClick={() => navigate('/crm/contacts/new')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <CRMFilterPopover
            options={CONTACT_FILTER_OPTIONS}
            activeFilters={activeFilters}
            onToggleFilter={handleToggleFilter}
            onClearAll={() => setActiveFilters([])}
          />
        </div>

        <Card className="animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
                {isSuperAdmin && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    No contacts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact, index) => (
                  <TableRow
                    key={contact.id}
                    className="animate-fade-in cursor-pointer hover:bg-muted/50"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                  >
                    {isSuperAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(contact.id)}
                          onCheckedChange={(checked) => handleSelectOne(contact.id, !!checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                          {contact.jobTitle && (
                            <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {contact.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {contact.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.companyName && (
                        <div className="flex items-center gap-1 text-sm">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          {contact.companyName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={contact.score >= 70 ? 'default' : contact.score >= 40 ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {contact.score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
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
                          {canDeleteContacts && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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

        <CRMImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImportComplete={() => setContacts(getContacts())}
        />
      </div>
    </AppLayout>
  );
}
