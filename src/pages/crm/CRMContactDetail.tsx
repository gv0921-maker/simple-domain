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
} from 'lucide-react';
import { getContact, getLeads, getOpportunities, type Contact } from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { format, parseISO } from 'date-fns';

export default function CRMContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contact = id ? getContact(id) : undefined;

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

  return (
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
                  <InfoRow icon={Mail} label="Email" value={contact.email} />
                  <InfoRow icon={Phone} label="Phone" value={contact.phone || '—'} />
                  <InfoRow icon={Building} label="Company" value={contact.companyName || '—'} />
                  <InfoRow icon={Briefcase} label="Job Title" value={contact.jobTitle || '—'} />
                  <InfoRow icon={User} label="Department" value={contact.department || '—'} />
                  <InfoRow
                    icon={Calendar}
                    label="Created"
                    value={format(parseISO(contact.createdAt), 'MMM dd, yyyy')}
                  />
                </div>

                {contact.addresses.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Addresses</p>
                      {contact.addresses.map((addr, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {[addr.street, addr.city, addr.state, addr.postalCode, addr.country]
                            .filter(Boolean)
                            .join(', ')}{' '}
                          <Badge variant="outline" className="text-xs ml-1 capitalize">{addr.type}</Badge>
                        </p>
                      ))}
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
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
                    </div>
                  </>
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
                {contact.email && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`mailto:${contact.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </a>
                  </Button>
                )}
                {contact.phone && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`tel:${contact.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  </Button>
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
                        <span className="text-xs font-medium">₹{opp.expectedRevenue.toLocaleString('en-IN')}</span>
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
