// TODO: Replace localStorage with Supabase queries
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ArrowLeft, Plus, X, Mail, Phone, User, AlertTriangle, Trash2, MapPin } from 'lucide-react';
import {
  type Contact,
  type Address,
  type CustomField,
  getContacts,
  saveContact,
  findDuplicateContacts,
} from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

type EmailEntry = { email: string; type: string };
type PhoneEntry = { phone: string; type: string };

const EMAIL_TYPES = ['Work', 'Personal', 'Other'];
const PHONE_TYPES = ['Work', 'Mobile', 'Home', 'Fax', 'Other'];

const emptyAddress = (type: Address['type']): Address => ({
  street: '', street2: '', city: '', state: '', postalCode: '', country: '', type,
});

export default function ContactForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;

  const [searchParams] = useSearchParams();
  const parsedReturn = (() => {
    const rc = searchParams.get('returnContext');
    if (!rc) return null;
    try { return JSON.parse(decodeURIComponent(rc)); } catch { return null; }
  })();

  const [formData, setFormData] = useState({
    type: 'individual' as Contact['type'],
    firstName: '',
    lastName: '',
    companyName: '',
    jobTitle: '',
    website: '',
    gstin: '',
    notes: '',
    tags: [] as string[],
    parentContactId: '' as string,
    salesperson: '',
    salesTeam: '',
    paymentTerms: '',
    priceList: '',
    purchasePaymentTerms: '',
  });
  const [emails, setEmails] = useState<EmailEntry[]>([{ email: '', type: 'Work' }]);
  const [phones, setPhones] = useState<PhoneEntry[]>([{ phone: '', type: 'Work' }]);
  const [billing, setBilling] = useState<Address>(emptyAddress('billing'));
  const [shipping, setShipping] = useState<Address>(emptyAddress('shipping'));
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newTag, setNewTag] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [parentPopoverOpen, setParentPopoverOpen] = useState(false);

  const allContacts = useMemo(() => getContacts(), []);

  // Filter potential parents (companies or any contact except self)
  const parentCandidates = useMemo(() => {
    const q = parentSearch.toLowerCase().trim();
    return allContacts
      .filter(c => c.id !== id)
      .filter(c => {
        if (!q) return true;
        const name = `${c.firstName} ${c.lastName} ${c.companyName || ''}`.toLowerCase();
        return name.includes(q);
      })
      .slice(0, 20);
  }, [allContacts, id, parentSearch]);

  const parentContact = useMemo(
    () => allContacts.find(c => c.id === formData.parentContactId),
    [allContacts, formData.parentContactId]
  );

  // Children of this contact (only when editing an existing record)
  const childContacts = useMemo(
    () => (id ? allContacts.filter(c => c.parentContactId === id) : []),
    [allContacts, id]
  );

  useEffect(() => {
    if (id) {
      const contact = getContacts().find(c => c.id === id);
      if (contact) {
        setFormData({
          type: contact.type,
          firstName: contact.firstName,
          lastName: contact.lastName,
          companyName: contact.companyName || '',
          jobTitle: contact.jobTitle || '',
          website: contact.website || '',
          gstin: contact.gstin || '',
          notes: contact.notes || '',
          tags: contact.tags || [],
          parentContactId: contact.parentContactId || '',
          salesperson: contact.salesperson || '',
          salesTeam: contact.salesTeam || '',
          paymentTerms: contact.paymentTerms || '',
          priceList: contact.priceList || '',
          purchasePaymentTerms: contact.purchasePaymentTerms || '',
        });
        // Emails
        const seedEmails: EmailEntry[] = [];
        if (contact.email) seedEmails.push({ email: contact.email, type: 'Work' });
        contact.emails?.forEach(e => {
          if (e.email && e.email !== contact.email) seedEmails.push(e);
        });
        setEmails(seedEmails.length ? seedEmails : [{ email: '', type: 'Work' }]);
        // Phones
        const seedPhones: PhoneEntry[] = [];
        if (contact.phone) seedPhones.push({ phone: contact.phone, type: 'Work' });
        contact.phones?.forEach(p => {
          if (p.phone && p.phone !== contact.phone) seedPhones.push(p);
        });
        setPhones(seedPhones.length ? seedPhones : [{ phone: '', type: 'Work' }]);
        // Addresses
        const billAddr = contact.addresses?.find(a => a.type === 'billing' || a.type === 'both');
        const shipAddr = contact.addresses?.find(a => a.type === 'shipping');
        if (billAddr) setBilling({ ...emptyAddress('billing'), ...billAddr, type: 'billing' });
        if (shipAddr) {
          setShipping({ ...emptyAddress('shipping'), ...shipAddr, type: 'shipping' });
          setSameAsBilling(false);
        } else {
          setSameAsBilling(true);
        }
        setCustomFields(contact.customFields || []);
      } else {
        navigate('/crm/contacts');
      }
    }
  }, [id, navigate]);

  // Live duplicate detection on primary email/phone
  const duplicates = useMemo(() => {
    const primaryEmail = emails[0]?.email || '';
    const primaryPhone = phones[0]?.phone || '';
    if (!primaryEmail && !primaryPhone) return [];
    return findDuplicateContacts(primaryEmail, primaryPhone, id);
  }, [emails, phones, id]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const updateAddress = (which: 'billing' | 'shipping', field: keyof Address, value: string) => {
    const setter = which === 'billing' ? setBilling : setShipping;
    setter(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (action: 'close' | 'new') => {
    const primaryEmail = emails[0]?.email?.trim() || '';
    if (!formData.firstName || !primaryEmail) {
      toast({ title: 'Name and primary email are required', variant: 'destructive' });
      return;
    }

    const cleanEmails = emails.filter(e => e.email.trim()).slice(1); // secondary only
    const cleanPhones = phones.filter(p => p.phone.trim()).slice(1);
    const primaryPhone = phones[0]?.phone?.trim() || '';

    const addresses: Address[] = [];
    const billHasData = Object.entries(billing).some(([k, v]) => k !== 'type' && v);
    if (billHasData) addresses.push({ ...billing, type: 'billing' });
    if (!sameAsBilling) {
      const shipHasData = Object.entries(shipping).some(([k, v]) => k !== 'type' && v);
      if (shipHasData) addresses.push({ ...shipping, type: 'shipping' });
    }

    const existingContact = id ? getContacts().find(c => c.id === id) : undefined;
    saveContact({
      ...(existingContact || {}),
      type: formData.type,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: primaryEmail,
      emails: cleanEmails.length ? cleanEmails : undefined,
      phone: primaryPhone,
      phones: cleanPhones.length ? cleanPhones : undefined,
      companyName: formData.companyName,
      jobTitle: formData.jobTitle,
      website: formData.website,
      gstin: formData.gstin,
      tags: formData.tags,
      notes: formData.notes,
      addresses,
      parentContactId: formData.parentContactId || undefined,
      customFields: customFields.filter(f => f.key.trim()),
      salesperson: formData.salesperson || undefined,
      salesTeam: formData.salesTeam || undefined,
      paymentTerms: formData.paymentTerms || undefined,
      priceList: formData.priceList || undefined,
      purchasePaymentTerms: formData.purchasePaymentTerms || undefined,
    });

    toast({ title: isEdit ? 'Contact updated' : 'Contact created' });

    if (action === 'new') {
      setFormData({
        type: 'individual', firstName: '', lastName: '',
        companyName: '', jobTitle: '', website: '', gstin: '',
        notes: '', tags: [], parentContactId: '',
        salesperson: '', salesTeam: '', paymentTerms: '', priceList: '', purchasePaymentTerms: '',
      });
      setEmails([{ email: '', type: 'Work' }]);
      setPhones([{ phone: '', type: 'Work' }]);
      setBilling(emptyAddress('billing'));
      setShipping(emptyAddress('shipping'));
      setSameAsBilling(true);
      setCustomFields([]);
    } else {
      if (parsedReturn?.returnTo) {
        const savedContacts = getContacts();
        const newest = savedContacts[savedContacts.length - 1];
        const returnData = encodeURIComponent(JSON.stringify({
          ...parsedReturn.opportunityData,
          contactId: newest?.id || '',
        }));
        navigate(`${parsedReturn.returnTo}?restoredData=${returnData}`);
      } else {
        navigate('/crm/contacts');
      }
    }
  };

  const renderAddressBlock = (addr: Address, which: 'billing' | 'shipping') => (
    <div className="space-y-1">
      <Input value={addr.street || ''} onChange={(e) => updateAddress(which, 'street', e.target.value)} placeholder="Street..." className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
      <Input value={addr.street2 || ''} onChange={(e) => updateAddress(which, 'street2', e.target.value)} placeholder="Street 2..." className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
      <div className="grid grid-cols-3 gap-2">
        <Input value={addr.city || ''} onChange={(e) => updateAddress(which, 'city', e.target.value)} placeholder="City" className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
        <Input value={addr.postalCode || ''} onChange={(e) => updateAddress(which, 'postalCode', e.target.value)} placeholder="ZIP" className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
        <Input value={addr.state || ''} onChange={(e) => updateAddress(which, 'state', e.target.value)} placeholder="State" className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
      </div>
      <Input value={addr.country || ''} onChange={(e) => updateAddress(which, 'country', e.target.value)} placeholder="Country" className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
    </div>
  );

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

        {/* Duplicate warning */}
        {duplicates.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-foreground">Possible duplicate detected</div>
              <div className="text-muted-foreground text-xs mt-0.5">
                {duplicates.slice(0, 3).map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => navigate(`/crm/contacts/${d.id}`)}
                    className="underline hover:text-foreground mr-2"
                  >
                    {d.firstName} {d.lastName} {d.email && `(${d.email})`}
                  </button>
                ))}
                {duplicates.length > 3 && <span>+{duplicates.length - 3} more</span>}
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Type toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="contactType" checked={formData.type === 'individual'}
                onChange={() => setFormData(p => ({ ...p, type: 'individual' }))} className="accent-primary" />
              <span className="text-sm font-medium">Person</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="contactType" checked={formData.type === 'company'}
                onChange={() => setFormData(p => ({ ...p, type: 'company' }))} className="accent-primary" />
              <span className="text-sm font-medium">Company</span>
            </label>
          </div>

          {/* Avatar + Name + multi-emails/phones */}
          <div className="flex gap-6">
            <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center border border-border shrink-0">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={formData.firstName + (formData.lastName ? ' ' + formData.lastName : '')}
                onChange={(e) => {
                  const parts = e.target.value.split(' ');
                  setFormData(prev => ({ ...prev, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }));
                }}
                placeholder="e.g. Brandon Freeman"
                className="text-2xl font-light h-auto py-1 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 bg-transparent"
              />

              {/* Emails (multiple) */}
              <div className="space-y-1.5">
                {emails.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-sm">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <Input
                      type="email"
                      value={entry.email}
                      onChange={(e) => {
                        const next = [...emails];
                        next[idx] = { ...next[idx], email: e.target.value };
                        setEmails(next);
                      }}
                      placeholder={idx === 0 ? 'Primary email' : 'Additional email'}
                      className="h-7 border-0 border-b border-border rounded-none px-1 text-primary text-sm focus-visible:ring-0 bg-transparent flex-1"
                    />
                    <Select value={entry.type} onValueChange={(v) => {
                      const next = [...emails]; next[idx] = { ...next[idx], type: v }; setEmails(next);
                    }}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EMAIL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {emails.length > 1 && (
                      <button type="button" onClick={() => setEmails(emails.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setEmails([...emails, { email: '', type: 'Work' }])}
                  className="text-xs text-primary hover:underline ml-5">
                  + Add email
                </button>
              </div>

              {/* Phones (multiple) */}
              <div className="space-y-1.5">
                {phones.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-sm">
                    <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                    <Input
                      value={entry.phone}
                      onChange={(e) => {
                        const next = [...phones];
                        next[idx] = { ...next[idx], phone: e.target.value };
                        setPhones(next);
                      }}
                      placeholder={idx === 0 ? 'Primary phone' : 'Additional phone'}
                      className="h-7 border-0 border-b border-border rounded-none px-1 text-primary text-sm focus-visible:ring-0 bg-transparent flex-1"
                    />
                    <Select value={entry.type} onValueChange={(v) => {
                      const next = [...phones]; next[idx] = { ...next[idx], type: v }; setPhones(next);
                    }}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PHONE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {phones.length > 1 && (
                      <button type="button" onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setPhones([...phones, { phone: '', type: 'Mobile' }])}
                  className="text-xs text-primary hover:underline ml-5">
                  + Add phone
                </button>
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
                  onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
                  placeholder="Company Name..."
                  className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent"
                />
              </div>

              {/* Parent contact (hierarchy) */}
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0">Parent</Label>
                <Popover open={parentPopoverOpen} onOpenChange={setParentPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" className="flex-1 h-8 border-0 border-b border-border px-1 text-sm text-left bg-transparent hover:bg-muted/30 transition-colors">
                      {parentContact
                        ? `${parentContact.firstName} ${parentContact.lastName}${parentContact.companyName ? ' — ' + parentContact.companyName : ''}`
                        : <span className="text-muted-foreground">Select parent / company...</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-2 border-b border-border">
                      <Input
                        autoFocus
                        placeholder="Search contacts..."
                        value={parentSearch}
                        onChange={(e) => setParentSearch(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {formData.parentContactId && (
                        <button type="button"
                          onClick={() => { setFormData(p => ({ ...p, parentContactId: '' })); setParentPopoverOpen(false); }}
                          className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted">
                          Clear parent
                        </button>
                      )}
                      {parentCandidates.length === 0 && (
                        <div className="px-3 py-4 text-xs text-muted-foreground text-center">No matching contacts</div>
                      )}
                      {parentCandidates.map(c => (
                        <button key={c.id} type="button"
                          onClick={() => { setFormData(p => ({ ...p, parentContactId: c.id })); setParentPopoverOpen(false); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex flex-col">
                          <span className="font-medium">{c.firstName} {c.lastName}</span>
                          {c.companyName && <span className="text-xs text-muted-foreground">{c.companyName}</span>}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Children (read-only display when editing) */}
              {childContacts.length > 0 && (
                <div className="flex items-start gap-3">
                  <Label className="w-24 text-sm font-semibold shrink-0 pt-1">Subsidiaries</Label>
                  <div className="flex-1 flex flex-wrap gap-1.5">
                    {childContacts.map(c => (
                      <Badge key={c.id} variant="outline" className="cursor-pointer hover:bg-muted"
                        onClick={() => navigate(`/crm/contacts/${c.id}`)}>
                        {c.firstName} {c.lastName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing address */}
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <Label className="w-24 text-sm font-semibold shrink-0 pt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Billing
                  </Label>
                  <div className="flex-1">{renderAddressBlock(billing, 'billing')}</div>
                </div>
              </div>

              {/* Same-as-billing toggle + shipping */}
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0">Shipping</Label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="accent-primary"
                  />
                  Same as billing
                </label>
              </div>
              {!sameAsBilling && (
                <div className="flex items-start gap-3">
                  <Label className="w-24 text-sm font-semibold shrink-0 pt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Ship to
                  </Label>
                  <div className="flex-1">{renderAddressBlock(shipping, 'shipping')}</div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0">Job Position</Label>
                <Input value={formData.jobTitle} onChange={(e) => setFormData(p => ({ ...p, jobTitle: e.target.value }))}
                  placeholder="e.g. Sales Director"
                  className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0">GSTIN</Label>
                <Input value={formData.gstin} onChange={(e) => setFormData(p => ({ ...p, gstin: e.target.value }))}
                  placeholder="e.g. BE0477472701"
                  className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0">Website</Label>
                <Input value={formData.website} onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))}
                  placeholder="e.g. https://www.example.com"
                  className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
              </div>
              <div className="flex items-start gap-3">
                <Label className="w-24 text-sm font-semibold shrink-0 pt-1">Tags</Label>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                        {tag}
                        <button onClick={() => setFormData(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <Input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder={`e.g. "B2B", "VIP", "Consulting"...`}
                      className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
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
              <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm">
                Notes
              </TabsTrigger>
              <TabsTrigger value="custom" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm">
                Custom Fields
              </TabsTrigger>
              <TabsTrigger value="sales" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm">
                Sales & Purchase
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="pt-4">
              <RichTextEditor
                value={formData.notes}
                onChange={(html) => setFormData(p => ({ ...p, notes: html }))}
                placeholder="Internal notes — supports bold, italic, lists, links..."
                minHeight="160px"
              />
            </TabsContent>

            <TabsContent value="custom" className="pt-4 space-y-2">
              {customFields.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Add custom fields to capture data specific to your workflow.
                </p>
              )}
              {customFields.map((cf, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={cf.label}
                    onChange={(e) => {
                      const next = [...customFields];
                      next[idx] = { ...next[idx], label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                      setCustomFields(next);
                    }}
                    placeholder="Field label"
                    className="h-8 w-48 text-sm"
                  />
                  <Input
                    value={cf.value}
                    onChange={(e) => {
                      const next = [...customFields];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setCustomFields(next);
                    }}
                    placeholder="Value"
                    className="h-8 flex-1 text-sm"
                  />
                  <button type="button" onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" onClick={() => setCustomFields([...customFields, { key: '', label: '', value: '' }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add custom field
              </Button>
            </TabsContent>

            <TabsContent value="sales" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                <div className="flex items-center gap-3">
                  <Label className="w-32 text-sm font-semibold shrink-0">Salesperson</Label>
                  <Input value={formData.salesperson} onChange={(e) => setFormData(p => ({ ...p, salesperson: e.target.value }))}
                    className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-32 text-sm font-semibold shrink-0">Sales Team</Label>
                  <Input value={formData.salesTeam} onChange={(e) => setFormData(p => ({ ...p, salesTeam: e.target.value }))}
                    className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-32 text-sm font-semibold shrink-0">Payment Terms</Label>
                  <Select value={formData.paymentTerms || '_none'} onValueChange={(v) => setFormData(p => ({ ...p, paymentTerms: v === '_none' ? '' : v }))}>
                    <SelectTrigger className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">—</SelectItem>
                      <SelectItem value="immediate">Immediate Payment</SelectItem>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net45">Net 45</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-32 text-sm font-semibold shrink-0">Price List</Label>
                  <Input value={formData.priceList} onChange={(e) => setFormData(p => ({ ...p, priceList: e.target.value }))}
                    className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent" />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-32 text-sm font-semibold shrink-0">Purchase Terms</Label>
                  <Select value={formData.purchasePaymentTerms || '_none'} onValueChange={(v) => setFormData(p => ({ ...p, purchasePaymentTerms: v === '_none' ? '' : v }))}>
                    <SelectTrigger className="h-8 border-0 border-b border-border rounded-none px-1 text-sm focus-visible:ring-0 bg-transparent"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">—</SelectItem>
                      <SelectItem value="immediate">Immediate Payment</SelectItem>
                      <SelectItem value="net15">Net 15</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                      <SelectItem value="net45">Net 45</SelectItem>
                      <SelectItem value="net60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
          <Button variant="outline" onClick={() => {
            if (parsedReturn?.returnTo) {
              navigate(parsedReturn.returnTo);
            } else {
              navigate('/crm/contacts');
            }
          }}>
            Discard
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
