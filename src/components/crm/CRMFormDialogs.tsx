// CRM Contact/Company Form Dialog
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, AlertTriangle } from 'lucide-react';
import {
  type Contact,
  type Company,
  type ContactType,
  getCompanies,
  saveContact,
  saveCompany,
  findDuplicateContacts,
} from '@/lib/data/crm';
import { useToast } from '@/hooks/use-toast';

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  onSave?: (contact: Contact) => void;
}

export function ContactFormDialog({ open, onOpenChange, contact, onSave }: ContactFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!contact;
  
  const [companies] = useState(() => getCompanies());
  const [formData, setFormData] = useState({
    type: 'individual' as ContactType,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyId: '',
    jobTitle: '',
    department: '',
    notes: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');
  const [duplicates, setDuplicates] = useState<Contact[]>([]);

  useEffect(() => {
    if (contact) {
      setFormData({
        type: contact.type,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone || '',
        companyId: contact.companyId || '',
        jobTitle: contact.jobTitle || '',
        department: contact.department || '',
        notes: contact.notes || '',
        tags: contact.tags || [],
      });
    } else {
      setFormData({
        type: 'individual',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyId: '',
        jobTitle: '',
        department: '',
        notes: '',
        tags: [],
      });
    }
    setDuplicates([]);
  }, [contact, open]);

  const handleEmailBlur = () => {
    if (formData.email && !isEdit) {
      const dups = findDuplicateContacts(formData.email, formData.phone);
      setDuplicates(dups);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.email) {
      toast({ title: 'First name and email are required', variant: 'destructive' });
      return;
    }

    const company = companies.find((c) => c.id === formData.companyId);

    const savedContact = saveContact({
      ...(contact || {}),
      ...formData,
      companyName: company?.name,
    });

    toast({
      title: isEdit ? 'Contact Updated' : 'Contact Created',
      description: `${formData.firstName} ${formData.lastName} has been saved.`,
    });

    onSave?.(savedContact);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'New Contact'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update contact information' : 'Add a new contact to your CRM'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Duplicate Warning */}
            {duplicates.length > 0 && (
              <div className="p-3 bg-warning/10 border border-warning rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Possible duplicate found</p>
                  <p className="text-muted-foreground">
                    {duplicates.map((d) => `${d.firstName} ${d.lastName}`).join(', ')}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="grid gap-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={handleEmailBlur}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 555-0123"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Company</Label>
              <Select
                value={formData.companyId}
                onValueChange={(v) => setFormData({ ...formData, companyId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No company</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Job Title</Label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g., Sales Manager"
                />
              </div>
              <div className="grid gap-2">
                <Label>Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Sales"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? 'Update' : 'Create'} Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Company Form Dialog
interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onSave?: (company: Company) => void;
}

export function CompanyFormDialog({ open, onOpenChange, company, onSave }: CompanyFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!company;
  
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    employeeCount: '',
    annualRevenue: 0,
    phone: '',
    email: '',
    notes: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        website: company.website || '',
        industry: company.industry || '',
        employeeCount: company.employeeCount || '',
        annualRevenue: company.annualRevenue || 0,
        phone: company.phone || '',
        email: company.email || '',
        notes: company.notes || '',
        tags: company.tags || [],
      });
    } else {
      setFormData({
        name: '',
        website: '',
        industry: '',
        employeeCount: '',
        annualRevenue: 0,
        phone: '',
        email: '',
        notes: '',
        tags: [],
      });
    }
  }, [company, open]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: 'Company name is required', variant: 'destructive' });
      return;
    }

    const savedCompany = saveCompany({
      ...(company || {}),
      ...formData,
    });

    toast({
      title: isEdit ? 'Company Updated' : 'Company Created',
      description: `${formData.name} has been saved.`,
    });

    onSave?.(savedCompany);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Company' : 'New Company'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update company information' : 'Add a new company to your CRM'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Company Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Acme Corporation"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Industry</Label>
              <Select
                value={formData.industry}
                onValueChange={(v) => setFormData({ ...formData, industry: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Employee Count</Label>
              <Select
                value={formData.employeeCount}
                onValueChange={(v) => setFormData({ ...formData, employeeCount: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="10-50">10-50</SelectItem>
                  <SelectItem value="50-100">50-100</SelectItem>
                  <SelectItem value="100-500">100-500</SelectItem>
                  <SelectItem value="500+">500+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Annual Revenue</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  type="number"
                  value={formData.annualRevenue || ''}
                  onChange={(e) => setFormData({ ...formData, annualRevenue: parseFloat(e.target.value) || 0 })}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0100"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@company.com"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? 'Update' : 'Create'} Company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
