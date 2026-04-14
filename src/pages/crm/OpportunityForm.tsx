import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CRM_NAV } from '@/lib/navigation/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { getContacts, saveOpportunity } from '@/lib/data/crm';
import { useToast } from '@/hooks/use-toast';
import { useStudioConfig } from '@/hooks/useStudioConfig';

export default function OpportunityForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts] = useState(() => getContacts());
  const studio = useStudioConfig('crm', 'New Opportunity');

  const [formData, setFormData] = useState({
    name: '',
    contactId: '',
    expectedRevenue: 0,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: 'Opportunity name is required', variant: 'destructive' });
      return;
    }

    const contact = contacts.find((c) => c.id === formData.contactId);

    saveOpportunity({
      name: formData.name,
      contactId: formData.contactId,
      contactName: contact ? `${contact.firstName} ${contact.lastName}` : '',
      companyName: contact?.companyName,
      expectedRevenue: formData.expectedRevenue,
      expectedCloseDate: formData.expectedCloseDate,
    });

    toast({ title: 'Opportunity created' });
    navigate('/crm');
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crm')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">New Opportunity</h1>
            <p className="text-muted-foreground">Create a new opportunity in your pipeline</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Opportunity Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {studio.isFieldVisible('name') && (
              <div className="grid gap-2">
                <Label>{studio.getFieldLabel('name', 'Opportunity Name')} {studio.isFieldRequired('name', true) && '*'}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={studio.getFieldPlaceholder('name', 'e.g., Office Design Project')}
                  readOnly={studio.isFieldReadOnly('name')}
                />
              </div>
            )}
            {studio.isFieldVisible('contact') && (
              <div className="grid gap-2">
                <Label>{studio.getFieldLabel('contact', 'Contact')}</Label>
                <Select value={formData.contactId} onValueChange={(v) => setFormData({ ...formData, contactId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {studio.isFieldVisible('expectedRevenue') && (
                <div className="grid gap-2">
                  <Label>{studio.getFieldLabel('expectedRevenue', 'Expected Revenue')}</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      type="number"
                      value={formData.expectedRevenue || ''}
                      onChange={(e) => setFormData({ ...formData, expectedRevenue: parseFloat(e.target.value) || 0 })}
                      className="pl-6"
                      readOnly={studio.isFieldReadOnly('expectedRevenue')}
                    />
                  </div>
                </div>
              )}
              {studio.isFieldVisible('expectedCloseDate') && (
                <div className="grid gap-2">
                  <Label>{studio.getFieldLabel('expectedCloseDate', 'Expected Closing')}</Label>
                  <Input
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                    readOnly={studio.isFieldReadOnly('expectedCloseDate')}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/crm')}>Discard</Button>
          <Button onClick={handleSubmit}>Create Opportunity</Button>
        </div>
      </div>
    </AppLayout>
  );
}
