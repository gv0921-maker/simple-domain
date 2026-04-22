import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  Tag,
  Briefcase,
  Target,
  TrendingUp,
  ShoppingCart,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { getContact, getContacts, getLeads, getOpportunities, getNotes, saveNote, type Contact, type Note } from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { format, parseISO } from 'date-fns';
import { RichComposer, RichContent, type RichComposerValue } from '@/components/ui/rich-composer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { canViewSensitive, maskEmail, maskPhone, displayRevenue } from '@/lib/crm/fieldMask';
import { EmailComposerDialog } from '@/components/crm/EmailComposerDialog';
import { getQuotations, getSalesOrders } from '@/lib/data/sales/storage';
import DOMPurify from 'dompurify';

export default function CRMContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const contact = id ? getContact(id) : undefined;
  const allContacts = getContacts();
  const parentContact = contact?.parentContactId ? allContacts.find(c => c.id === contact.parentContactId) : undefined;
  const childContacts = id ? allContacts.filter(c => c.parentContactId === id) : [];

  const [notesVersion, setNotesVersion] = useState(0);
  const notes = useMemo(() => (id ? getNotes('contact', id) : []), [id, notesVersion]);
  const [emailOpen, setEmailOpen] = useState(false);

  // Sales history
  const linkedQuotations = useMemo(() => getQuotations().filter(q => q.customerId === id), [id]);
  const linkedOrders = useMemo(() => getSalesOrders().filter(o => linkedQuotations.some(q => q.id === o.quotationId)), [linkedQuotations]);

  const showEmail = canViewSensitive(user?.id, 'crm', 'email');
  const showPhone = canViewSensitive(user?.id, 'crm', 'phone');

  // Find linked leads for this contact
  const linkedLeads = getLeads().filter(
    (l) => l.contactId === id || l.email === contact?.email
  );

  // Find linked opportunities
  const linkedOpportunities = getOpportunities().filter(
    (o) => o.contactId === id || o.contactName === `${contact?.firstName} ${contact?.lastName}`
  );

  if (!contact) {
    return (
      <AppLayout title="CRM" moduleNav={CRM_NAV}>
        <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <p className="text-muted-foreground">Contact not found</p>
          <Button variant="outline" onClick={() => navigate('/crm/contacts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleAddNote = (value: RichComposerValue) => {
    const text = value.html.replace(/<[^>]+>/g, '').trim();
    if (!text && value.attachments.length === 0) return;
    saveNote({
      content: value.html,
      relatedTo: 'contact',
      relatedId: contact.id,
      userId: user?.id || '1',
      userName: user?.name || 'User',
      visibility: 'team',
      mentions: value.mentions,
      attachments: value.attachments,
    });
    setNotesVersion(v => v + 1);
    toast({ title: 'Note added' });
  };

  const displayEmail = (e?: string) => !e ? '—' : (showEmail ? e : maskEmail(e));
  const displayPhone = (p?: string) => !p ? '—' : (showPhone ? p : maskPhone(p));

  return (
    <>
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crm/contacts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">
              {contact.firstName} {contact.lastName}
            </h1>
            {contact.jobTitle && (
              <p className="text-muted-foreground">{contact.jobTitle}{contact.department ? ` · ${contact.department}` : ''}</p>
            )}
          </div>
          <Badge variant={contact.status === 'active' ? 'default' : 'secondary'} className="capitalize">
            {contact.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
            <Mail className="h-4 w-4 mr-1" /> Email
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/sales/quotations/new?customerId=${id}`)}>
            <FileText className="h-4 w-4 mr-1" /> New Quotation
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={Mail} label="Email" value={displayEmail(contact.email)} />
                  <InfoRow icon={Phone} label="Phone" value={displayPhone(contact.phone)} />
                  <InfoRow icon={Building} label="Company" value={contact.companyName || '—'} />
                  <InfoRow icon={Briefcase} label="Job Title" value={contact.jobTitle || '—'} />
                  <InfoRow icon={User} label="Department" value={contact.department || '—'} />
                  <InfoRow
                    icon={Calendar}
                    label="Created"
                    value={format(parseISO(contact.createdAt), 'MMM dd, yyyy')}
                  />
                </div>

                {/* Additional emails / phones */}
                {(contact.emails?.length || contact.phones?.length) ? (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {contact.emails && contact.emails.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Additional Emails</p>
                          {contact.emails.map((e, i) => (
                            <p key={i} className="text-sm text-muted-foreground">
                              {displayEmail(e.email)} <Badge variant="outline" className="text-xs ml-1">{e.type}</Badge>
                            </p>
                          ))}
                        </div>
                      )}
                      {contact.phones && contact.phones.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Additional Phones</p>
                          {contact.phones.map((p, i) => (
                            <p key={i} className="text-sm text-muted-foreground">
                              {displayPhone(p.phone)} <Badge variant="outline" className="text-xs ml-1">{p.type}</Badge>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}

                {/* Parent / Subsidiaries */}
                {(parentContact || childContacts.length > 0) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {parentContact && (
                        <div>
                          <p className="text-sm font-medium mb-1">Parent</p>
                          <button
                            onClick={() => navigate(`/crm/contacts/${parentContact.id}`)}
                            className="text-sm text-primary hover:underline"
                          >
                            {parentContact.firstName} {parentContact.lastName}
                            {parentContact.companyName ? ` — ${parentContact.companyName}` : ''}
                          </button>
                        </div>
                      )}
                      {childContacts.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Subsidiaries / Child Contacts</p>
                          <div className="flex flex-wrap gap-1.5">
                            {childContacts.map(c => (
                              <Badge key={c.id} variant="outline" className="cursor-pointer hover:bg-muted"
                                onClick={() => navigate(`/crm/contacts/${c.id}`)}>
                                {c.firstName} {c.lastName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {contact.addresses.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Addresses</p>
                      {contact.addresses.map((addr, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {[addr.street, addr.street2, addr.city, addr.state, addr.postalCode, addr.country]
                            .filter(Boolean)
                            .join(', ')}{' '}
                          <Badge variant="outline" className="text-xs ml-1 capitalize">{addr.type}</Badge>
                        </p>
                      ))}
                    </div>
                  </>
                )}

                {/* Custom fields */}
                {contact.customFields && contact.customFields.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Custom Fields</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {contact.customFields.map((cf, i) => (
                          <div key={i} className="text-sm">
                            <span className="text-muted-foreground">{cf.label}:</span>{' '}
                            <span className="text-foreground">{cf.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {contact.tags.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </>
                )}

                {contact.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-1">Description</p>
                      <div
                        className="text-sm text-muted-foreground prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_b]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contact.notes, { ALLOWED_TAGS: ['p','b','i','ul','ol','li','strong','em','br','span','a','s','u','div'], ALLOWED_ATTR: ['href','class','target'] }) }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes / Communication Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes & Communication
                  {notes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">{notes.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RichComposer
                  compact
                  placeholder="Log an internal note… type @ to mention"
                  submitLabel="Log Note"
                  onSubmit={handleAddNote}
                />

                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notes yet. Be the first to log one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {notes
                      .slice()
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((n: Note) => (
                        <div key={n.id} className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {n.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">{n.userName}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(parseISO(n.createdAt), 'MMM dd, yyyy h:mm a')}
                              </span>
                            </div>
                            <RichContent
                              html={n.content}
                              attachments={n.attachments}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Linked Leads */}
            {linkedLeads.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Linked Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {linkedLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate('/crm')}
                      >
                        <div>
                          <p className="font-medium text-sm">{lead.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{lead.status}</p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{lead.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sales History */}
            {(linkedQuotations.length > 0 || linkedOrders.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sales History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {linkedQuotations.map(q => (
                    <div key={q.id} className="flex items-center justify-between p-2 border rounded-md text-sm cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/sales/quotations/${q.id}`)}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{q.reference}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{q.status}</Badge>
                      </div>
                      <span className="font-semibold">₹{q.total.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  {linkedOrders.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-2 border rounded-md text-sm cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/sales/orders/${o.id}`)}>
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{o.reference}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{o.status}</Badge>
                      </div>
                      <span className="font-semibold">₹{o.total.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold">{contact.score}</div>
                  <Badge
                    variant={contact.score >= 70 ? 'default' : contact.score >= 40 ? 'secondary' : 'outline'}
                  >
                    {contact.score >= 70 ? 'High' : contact.score >= 40 ? 'Medium' : 'Low'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contact.email && showEmail && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`mailto:${contact.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                )}
                {contact.phone && showPhone && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`tel:${contact.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  </Button>
                )}
                {(!showEmail || !showPhone) && (
                  <p className="text-xs text-muted-foreground italic">
                    Some quick actions hidden — sensitive contact details masked.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Cross-module Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Module Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-xs" onClick={() => navigate(`/sales/quotations/new?contact=${encodeURIComponent(`${contact.firstName} ${contact.lastName}`)}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Quotation
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs" onClick={() => navigate(`/sales/orders/new?contact=${encodeURIComponent(`${contact.firstName} ${contact.lastName}`)}`)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Sales Order
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs" onClick={() => navigate('/invoicing')}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Invoices
                </Button>
              </CardContent>
            </Card>

            {/* Linked Opportunities */}
            {linkedOpportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {linkedOpportunities.map(opp => (
                      <div
                        key={opp.id}
                        className="flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/crm/opportunities/${opp.id}`)}
                      >
                        <div>
                          <p className="font-medium text-sm">{opp.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{opp.stage}</p>
                        </div>
                        <span className="text-xs font-medium">{displayRevenue(opp.expectedRevenue, user?.id, 'crm')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
    <EmailComposerDialog
      open={emailOpen}
      onOpenChange={setEmailOpen}
      defaultTo={contact.email}
      relatedTo="contact"
      relatedId={contact.id}
    />
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
