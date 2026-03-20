// CRM Contacts List Page
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Building,
  User,
  Filter,
  UserPlus,
  Upload,
} from 'lucide-react';
import { getContacts, deleteContact, type Contact } from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { ContactFormDialog } from '@/components/crm/CRMFormDialogs';
import { CRMImportDialog, CRMExportButton } from '@/components/crm/CRMImportExport';
import { useToast } from '@/hooks/use-toast';
import { useCRMPermissions } from '@/hooks/useCRMPermissions';
import { cn } from '@/lib/utils';

export default function CRMContactsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canCreateContacts, canEditContacts, canDeleteContacts, canImportData, filterByScope } = useCRMPermissions();
  
  const [contacts, setContacts] = useState<Contact[]>(() => getContacts());
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();

  const scopedContacts = useMemo(() => filterByScope(contacts), [contacts, filterByScope]);

  const filteredContacts = useMemo(() => {
    return scopedContacts.filter(
      (c) =>
        c.firstName.toLowerCase().includes(search.toLowerCase()) ||
        c.lastName.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.companyName?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }, [scopedContacts, search]);

  const stats = useMemo(() => ({
    total: contacts.length,
    active: contacts.filter((c) => c.status === 'active').length,
    withCompany: contacts.filter((c) => c.companyId).length,
    highScore: contacts.filter((c) => c.score >= 70).length,
  }), [contacts]);

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteContact(id);
    setContacts(getContacts());
    toast({ title: 'Contact deleted' });
  };

  const handleSave = () => {
    setContacts(getContacts());
    setEditingContact(undefined);
  };

  const handleNewContact = () => {
    setEditingContact(undefined);
    setIsFormOpen(true);
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
            <p className="text-muted-foreground">Manage your contacts and customer relationships</p>
          </div>
          <div className="flex gap-2">
            <CRMExportButton type="contacts" />
            {canImportData && (
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            )}
            {canCreateContacts && (
              <Button onClick={handleNewContact}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        </div>


        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder=""
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <Card className="animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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

        {/* Dialogs */}
        <ContactFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          contact={editingContact}
          onSave={handleSave}
        />
        <CRMImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImportComplete={() => setContacts(getContacts())}
        />
      </div>
    </AppLayout>
  );
}
