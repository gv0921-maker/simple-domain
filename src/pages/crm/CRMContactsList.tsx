// CRM Contacts List Page — uses TanStack Query hooks (Supabase-ready)
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
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
  MoreHorizontal,
  Trash2,
  Phone,
  Mail,
  Building,
  User,
  UserPlus,
  Upload,
  Loader2,
} from 'lucide-react';
import { type Contact } from '@/lib/services/crm';
import { useContacts, useDeleteContact } from '@/hooks/crm/useCRMQueries';
import { CRM_NAV } from '@/lib/navigation/crm';
import { CRMImportDialog, CRMExportButton } from '@/components/crm/CRMImportExport';
import { ImportExportButton } from '@/components/importExport/ImportExportButton';
import { FilterBar } from '@/components/filters/FilterBar';
import { crmContactsFilterConfig } from '@/lib/filters/modules/crmContacts';
import { applyFilterState, groupByField } from '@/lib/filters/clientFilter';
import { EMPTY_FILTER_STATE, type FilterState } from '@/lib/filters/types';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminUser } from '@/lib/services/settings';
import { canViewSensitive, maskEmail, maskPhone } from '@/lib/crm/fieldMask';

export default function CRMContactsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canCreateContacts, canDeleteContacts, canImportData, filterByScope } = useCRMPermissions();
  const isSuperAdmin = user ? isSuperAdminUser(user.id) : false;

  const { data: contacts = [], isLoading, isFetching } = useContacts();
  const deleteContactMutation = useDeleteContact();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>(EMPTY_FILTER_STATE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const scopedContacts = useMemo(() => filterByScope(contacts), [contacts, filterByScope]);

  const filteredContacts = useMemo(() => applyFilterState(
    scopedContacts as unknown as Record<string, unknown>[], filterState,
    ['firstName','lastName','email','phone','companyName'],
    { currentUserId: user?.id, currentUserName: user?.name, currentUserEmail: user?.email },
  ) as unknown as typeof scopedContacts, [scopedContacts, filterState]);

  const handleDelete = (id: string) => {
    deleteContactMutation.mutate(id, {
      onSuccess: () => {
        setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
        toast({ title: 'Contact deleted' });
      },
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(id => deleteContactMutation.mutateAsync(id)));
    toast({ title: `${ids.length} contact(s) deleted` });
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
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              Contacts
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </h1>
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
            <ImportExportButton
              schema="crm_contacts"
              currentRecords={filteredContacts as unknown as Record<string, unknown>[]}
              allRecords={contacts as unknown as Record<string, unknown>[]}
            />
            {canCreateContacts && (
              <Button onClick={() => navigate('/crm/contacts/new')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        </div>

        <FilterBar config={crmContactsFilterConfig} value={filterState} onChange={setFilterState} />

        {/* Mobile card list */}
        <div className="md:hidden space-y-2">
          {filteredContacts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No contacts found</Card>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                className="w-full text-left border rounded-lg bg-card p-3 flex gap-3 hover:bg-muted/40 min-h-[72px]"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{contact.firstName} {contact.lastName}</p>
                    <Badge
                      variant={contact.score >= 70 ? 'default' : contact.score >= 40 ? 'secondary' : 'outline'}
                      className="text-xs shrink-0"
                    >
                      {contact.score}
                    </Badge>
                  </div>
                  {contact.companyName && (
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Building className="h-3 w-3" /> {contact.companyName}
                    </div>
                  )}
                  {contact.email && (
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {canViewSensitive(user?.id, 'crm', 'email') ? contact.email : maskEmail(contact.email)}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <Card className="animate-fade-in hidden md:block">
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
                        {canViewSensitive(user?.id, 'crm', 'email') ? contact.email : maskEmail(contact.email)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {canViewSensitive(user?.id, 'crm', 'phone') ? contact.phone : maskPhone(contact.phone)}
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
          onImportComplete={() => { /* React Query invalidation handled inside the dialog */ }}
        />
      </div>
    </AppLayout>
  );
}
