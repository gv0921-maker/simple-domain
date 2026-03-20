import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  MapPin,
} from 'lucide-react';
import { getContacts, saveContact, type Contact } from '@/lib/data/sales';
import { getItem, setItem } from '@/lib/storage';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CustomersList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>(getContacts());
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    address: '',
    notes: '',
  });

  const filteredContacts = useMemo(() => {
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.company?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }, [contacts, search]);

  const handleOpenDialog = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        email: contact.email,
        phone: contact.phone || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        address: contact.address || '',
        notes: contact.notes || '',
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        address: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast({ title: 'Name and email are required', variant: 'destructive' });
      return;
    }

    const contactData: Contact = {
      id: editingContact?.id || '',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      jobTitle: formData.jobTitle,
      address: formData.address,
      tags: editingContact?.tags || [],
      notes: formData.notes,
      createdAt: editingContact?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveContact(contactData);
    setContacts(getContacts());
    setIsDialogOpen(false);
    toast({
      title: editingContact ? 'Customer Updated' : 'Customer Created',
      description: `${formData.name} has been saved.`,
    });
  };

  const handleDelete = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setItem('contacts', updated);
    setContacts(updated);
    toast({ title: 'Customer Deleted' });
  };

  return (
    <AppLayout title="CRM" moduleNav={SALES_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
            <p className="text-muted-foreground">Manage your customer contacts and accounts</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contacts.length}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(contacts.filter((c) => c.company).map((c) => c.company)).size}
              </div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                VIP Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {contacts.filter((c) => c.tags.includes('VIP')).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
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
                <TableHead>Tags</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact, index) => (
                  <TableRow
                    key={contact.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{contact.name}</p>
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
                      {contact.company && (
                        <div className="flex items-center gap-1 text-sm">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          {contact.company}
                        </div>
                      )}
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(contact)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(contact.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Edit Customer' : 'New Customer'}</DialogTitle>
              <DialogDescription>
                {editingContact ? 'Update customer details' : 'Add a new customer contact'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder=""
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder=""
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder=""
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Company</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder=""
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Job Title</Label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder=""
                />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder=""
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingContact ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
