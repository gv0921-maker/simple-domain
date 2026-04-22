// TODO: Replace localStorage with Supabase queries
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import {
  saveLead, getLead,
  type LeadSource, type LeadStatus,
} from '@/lib/data/crm';
import { CRM_NAV } from '@/lib/navigation/crm';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

const LEAD_SOURCES: LeadSource[] = [
  'website', 'referral', 'social_media', 'trade_show',
  'cold_call', 'email_campaign', 'import', 'manual', 'other',
];

const LEAD_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost',
];

export default function LeadForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    contactName: '',
    email: '',
    phone: '',
    companyName: '',
    source: 'manual' as LeadSource,
    status: 'new' as LeadStatus,
    assignedTo: '',
    expectedRevenue: 0,
    probability: 20,
    notes: '',
  });

  useEffect(() => {
    if (id) {
      const lead = getLead(id);
      if (lead) {
        setFormData({
          title: lead.title,
          contactName: lead.contactName,
          email: lead.email,
          phone: lead.phone || '',
          companyName: lead.companyName || '',
          source: lead.source,
          status: lead.status,
          assignedTo: lead.assignedTo || '',
          expectedRevenue: lead.expectedRevenue,
      probability: lead.probability ?? 20,
          notes: lead.notes || '',
        });
      } else {
        navigate('/crm/leads');
      }
    }
  }, [id, navigate]);

  const handleSubmit = (action: 'close' | 'new') => {
    if (!formData.title) {
      toast({ title: 'Lead name is required', variant: 'destructive' });
      return;
    }

    const existing = id ? getLead(id) : undefined;
    const saved = saveLead({
      ...(existing || {}),
      title: formData.title,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone || undefined,
      companyName: formData.companyName || undefined,
      source: formData.source,
      status: formData.status,
      assignedTo: formData.assignedTo || undefined,
      expectedRevenue: formData.expectedRevenue,
      probability: formData.probability,
      notes: formData.notes || undefined,
    });

    toast({ title: isEdit ? 'Lead updated' : 'Lead created' });

    if (action === 'new') {
      setFormData({
        title: '', contactName: '', email: '', phone: '',
        companyName: '', source: 'manual', status: 'new',
        assignedTo: '', expectedRevenue: 0, probability: 20, notes: '',
      });
    } else {
      navigate(`/crm/leads/${saved.id}`);
    }
  };

  const update = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crm/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isEdit ? 'Edit Lead' : 'New Lead'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update lead information' : 'Create a new lead in your pipeline'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Lead Name *</Label>
              <Input
                value={formData.title}
                onChange={(e) => update('title', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contact Name</Label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => update('contactName', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Company</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => update('companyName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={formData.source} onValueChange={(v) => update('source', v as LeadSource)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => update('status', v as LeadStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Assigned To</Label>
                <Input
                  value={formData.assignedTo}
                  onChange={(e) => update('assignedTo', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Expected Revenue</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    type="number"
                    value={formData.expectedRevenue || ''}
                    onChange={(e) => update('expectedRevenue', parseFloat(e.target.value) || 0)}
                    className="pl-6"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Probability</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.probability}
                    onChange={(e) => update('probability', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <RichTextEditor
                value={formData.notes}
                onChange={(html) => update('notes', html)}
                placeholder="Internal notes about this lead..."
                minHeight="120px"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleSubmit('close')} className="bg-primary hover:bg-primary/90">
            Save & Close
          </Button>
          <Button onClick={() => handleSubmit('new')} variant="secondary">
            Save & New
          </Button>
          <Button variant="outline" onClick={() => navigate('/crm/leads')}>
            Discard
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
