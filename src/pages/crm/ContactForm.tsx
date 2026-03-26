import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, X, Mail, Phone, User } from 'lucide-react';
import {
  type Contact,
  getContacts,
  saveContact,
} from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { useToast } from '@/hooks/use-toast';

export default function ContactForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    type: 'individual' as Contact['type'],
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    jobTitle: '',
    website: '',
    gstin: '',
    street: '',
    street2: '',
    city: '',
    zip: '',
    state: '',
    country: '',
    notes: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (id) {
      const contacts = getContacts();
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        const addr = contact.addresses?.[0];
        setFormData({
          type: contact.type,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || '',
          companyName: contact.companyName || '',
          jobTitle: contact.jobTitle || '',
          website: contact.website || '',
          gstin: contact.gstin || '',
          street: addr?.street || '',
          street2: addr?.street2 || '',
          city: addr?.city || '',
          zip: addr?.postalCode || '',
          state: addr?.state || '',
          country: addr?.country || '',
          notes: contact.notes || '',
          tags: contact.tags || [],
        });
      } else {
        navigate('/crm/contacts');
      }
    }
  }, [id, navigate]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const update = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (action: 'close' | 'new') => {
    if (!formData.firstName || !formData.email) {
      toast({ title: 'Name and email are required', variant: 'destructive' });
      return;
    }

    const existingContact = id ? getContacts().find(c => c.id === id) : undefined;
    saveContact({
      ...(existingContact || {}),
      type: formData.type,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.companyName,
      jobTitle: formData.jobTitle,
      website: formData.website,
      gstin: formData.gstin,
      tags: formData.tags,
      notes: formData.notes,
      addresses: [{
        street: formData.street,
        street2: formData.street2,
        city: formData.city,
        postalCode: formData.zip,
        state: formData.state,
        country: formData.country,
        type: 'both' as const,
      }],
    });

    toast({ title: isEdit ? 'Contact updated' : 'Contact created' });

    if (action === 'new') {
      setFormData({
        type: 'individual', firstName: '', lastName: '', email: '', phone: '',
        companyName: '', jobTitle: '', website: '', gstin: '',
        street: '', street2: '', city: '', zip: '', state: '', country: '',
        notes: '', tags: [],
      });
    } else {
      navigate('/crm/contacts');
    }
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crm/contacts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">
            {isEdit ? 'Edit Contact' : 'New Contact'}
          </h1>
        </div>

        {/* Main form area */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Type toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="contactType"
                checked={formData.type === 'individual'}
                onChange={() => update('type', 'individual')}
                className="accent-primary"
              />
              <span className="text-sm font-medium">Person</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="contactType"
                checked={formData.type === 'company'}
                onChange={() => update('type', 'company')}
                className="accent-primary"
              />
              <span className="text-sm font-medium">Company</span>
            </label>
          </div>

          {/* Avatar + Name + Email/Phone */}
          <div className="flex gap-6">
            <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center border border-border shrink-0">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={formData.firstName + (formData.lastName ? ' ' + formData.lastName : '')}
                onChange={(e) => {
                  const parts = e.target.value.split(' ');
                  const first = parts[0] || '';
                  const last = parts.slice(1).join(' ');
                  setFormData(prev => ({ ...prev, firstName: first, lastName: last }));
                }}
                placeholder="e.g. Brandon Freeman"
                className="text-2xl font-light h-auto py-1 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 bg-transparent"
              />
              <div className="flex items-center gap-1.5 text-sm">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="Email"
                  className="h-7 border-0 border-b border-border rounded-none px-1 text-primary text-sm focus-visible:ring-0 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <Input
                  value={formData.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="Phone"
                  className="h-7 border-0 border-b border-border rounded-none px-1 text-primary text-sm focus-visible:ring-0 bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Two-column detail fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
            {/* Left column */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0">Company</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                  placeholder="Company Name..."
                  className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <Label className="w-24 text-sm font-semibold shrink-0 pt-1">Address</Label>
                  <div className="flex-1 space-y-1">
                    <Input value={formData.street} onChange={(e) => update('street', e.target.value)} placeholder="Street..." className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
                    <Input value={formData.street2} onChange={(e) => update('street2', e.target.value)} placeholder="Street 2..." className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
                    <div className="grid grid-cols-3 gap-2">
                      <Input value={formData.city} onChange={(e) => update('city', e.target.value)} placeholder="City" className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
                      <Input value={formData.zip} onChange={(e) => update('zip', e.target.value)} placeholder="ZIP" className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
                      <Input value={formData.state} onChange={(e) => update('state', e.target.value)} placeholder="State" className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
                    </div>
                    <Input value={formData.country} onChange={(e) => update('country', e.target.value)} placeholder="Country" className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0">Job Position</Label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => update('jobTitle', e.target.value)}
                  placeholder="e.g. Sales Director"
                  className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0">GSTIN</Label>
                <Input
                  value={formData.gstin}
                  onChange={(e) => update('gstin', e.target.value)}
                  placeholder="e.g. BE0477472701"
                  className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0">Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => update('website', e.target.value)}
                  placeholder="e.g. https://www.example.com"
                  className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent"
                />
              </div>
              <div className="flex items-start gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0 pt-1">Tags</Label>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder={`e.g. "B2B", "VIP", "Consulting"...`}
                      className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={handleAddTag} className="h-8 w-8">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="notes" className="mt-6">
            <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
              <TabsTrigger value="contacts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm">
                Contacts
              </TabsTrigger>
              <TabsTrigger value="sales" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm">
                Sales & Purchase
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm">
                Notes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="contacts" className="pt-4">
              <div className="border border-dashed border-border rounded-md p-8 text-center">
                <Button variant="link" className="text-primary">
                  <Plus className="h-4 w-4 mr-1" /> Add Contact
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="sales" className="pt-4">
              <p className="text-sm text-muted-foreground">Sales & Purchase details will appear here.</p>
            </TabsContent>
            <TabsContent value="notes" className="pt-4">
              <Textarea
                value={formData.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Internal notes..."
                rows={4}
                className="border-0 border-b border-border rounded-none px-1 focus-visible:ring-0 bg-transparent resize-none"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center gap-2">
          <Button onClick={() => handleSubmit('close')} className="bg-primary hover:bg-primary/90">
            Save & Close
          </Button>
          <Button onClick={() => handleSubmit('new')} variant="secondary">
            Save & New
          </Button>
          <Button variant="outline" onClick={() => navigate('/crm/contacts')}>
            Discard
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
