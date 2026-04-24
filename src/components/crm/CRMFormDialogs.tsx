// CRM Contact/Company Form Dialog — uses TanStack Query hooks (Supabase-ready)
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useStudioConfig } from '@/hooks/useStudioConfig';
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
  type ContactType,
} from '@/lib/services/crm';
import { useSaveContact, useContacts } from '@/hooks/crm/useCRMQueries';
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
  const studio = useStudioConfig('crm', 'New Contact');
  const saveContactMutation = useSaveContact();
  const { data: allContacts = [] } = useContacts();
  
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
      const targetEmail = formData.email.toLowerCase().trim();
      const targetPhone = (formData.phone || '').replace(/[^\d+]/g, '');
      const dups = allContacts.filter((c) => {
        if (targetEmail && c.email?.toLowerCase() === targetEmail) return true;
        if (targetPhone && c.phone && c.phone.replace(/[^\d+]/g, '') === targetPhone) return true;
        return false;
      });
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

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.email) {
      toast({ title: 'First name and email are required', variant: 'destructive' });
      return;
    }

    const savedContact = await saveContactMutation.mutateAsync({
      ...(contact || {}),
      ...formData,
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
              {studio.isFieldVisible('firstName') && (
                <div className="grid gap-2">
                  <Label>{studio.getFieldLabel('firstName', 'First Name')} {studio.isFieldRequired('firstName', true) && '*'}</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder={studio.getFieldPlaceholder('firstName', 'John')}
                    readOnly={studio.isFieldReadOnly('firstName')}
                  />
                </div>
              )}
              {studio.isFieldVisible('lastName') && (
                <div className="grid gap-2">
                  <Label>{studio.getFieldLabel('lastName', 'Last Name')} {studio.isFieldRequired('lastName') && '*'}</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder={studio.getFieldPlaceholder('lastName', 'Doe')}
                    readOnly={studio.isFieldReadOnly('lastName')}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {studio.isFieldVisible('email') && (
                <div className="grid gap-2">
                  <Label>{studio.getFieldLabel('email', 'Email')} {studio.isFieldRequired('email') && '*'}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={handleEmailBlur}
                    placeholder={studio.getFieldPlaceholder('email', 'john@example.com')}
                    readOnly={studio.isFieldReadOnly('email')}
                  />
                </div>
              )}
              {studio.isFieldVisible('phone') && (
                <div className="grid gap-2">
                  <Label>{studio.getFieldLabel('phone', 'Phone')}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={studio.getFieldPlaceholder('phone', '+1 555-0123')}
                    readOnly={studio.isFieldReadOnly('phone')}
                  />
                </div>
              )}
            </div>

            {studio.isFieldVisible('company') && (
              <div className="grid gap-2">
                <Label>{studio.getFieldLabel('company', 'Company')}</Label>
                <Input
                  value={formData.companyId || ''}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  placeholder={studio.getFieldPlaceholder('company', 'Company name')}
                  readOnly={studio.isFieldReadOnly('company')}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {studio.isFieldVisible('jobTitle') && (
                <div className="grid gap-2">
                  <Label>{studio.getFieldLabel('jobTitle', 'Job Title')}</Label>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder={studio.getFieldPlaceholder('jobTitle', 'e.g., Sales Manager')}
                    readOnly={studio.isFieldReadOnly('jobTitle')}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Department</Label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder=""
                />
              </div>
            </div>

            {studio.isFieldVisible('tags') && (
              <div className="grid gap-2">
                <Label>{studio.getFieldLabel('tags', 'Tags')}</Label>
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
                    placeholder=""
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {studio.isFieldVisible('notes') && (
              <div className="grid gap-2">
                <Label>{studio.getFieldLabel('notes', 'Notes')}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={studio.getFieldPlaceholder('notes', 'Additional notes...')}
                  rows={3}
                  readOnly={studio.isFieldReadOnly('notes')}
                />
              </div>
            )}
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
