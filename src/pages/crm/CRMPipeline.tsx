// CRM Pipeline Page - Odoo-style with Kanban + List views
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CRMKanbanBoard } from '@/components/crm/CRMKanbanBoard';
import { CRMPipelineListView } from '@/components/crm/CRMPipelineListView';
import { CRM_NAV } from '@/lib/navigation/crm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getContacts, getCompanies, saveOpportunity, getOpportunities } from '@/lib/data/crm';
import { useToast } from '@/hooks/use-toast';

export default function CRMPipeline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [contacts] = useState(() => getContacts());
  const [companies] = useState(() => getCompanies());
  const [formData, setFormData] = useState({
    name: '',
    contactId: '',
    companyId: '',
    expectedRevenue: 0,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleCreateOpportunity = () => {
    if (!formData.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    const contact = contacts.find((c) => c.id === formData.contactId);
    const company = companies.find((c) => c.id === formData.companyId);

    saveOpportunity({
      name: formData.name,
      contactId: formData.contactId,
      contactName: contact ? `${contact.firstName} ${contact.lastName}` : '',
      companyId: formData.companyId,
      companyName: company?.name,
      expectedRevenue: formData.expectedRevenue,
      expectedCloseDate: formData.expectedCloseDate,
    });

    toast({ title: 'Opportunity created' });
    setIsNewDialogOpen(false);
    setFormData({
      name: '',
      contactId: '',
      companyId: '',
      expectedRevenue: 0,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    navigate('/crm/pipeline');
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      {view === 'kanban' ? (
        <CRMKanbanBoard
          onNewOpportunity={() => setIsNewDialogOpen(true)}
          view={view}
          onViewChange={setView}
        />
      ) : (
        <CRMPipelineListView
          onNewOpportunity={() => setIsNewDialogOpen(true)}
          view={view}
          onViewChange={setView}
        />
      )}

      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Opportunity</DialogTitle>
            <DialogDescription>Create a new opportunity in your pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Opportunity Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Office Design Project"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contact</Label>
                <Select
                  value={formData.contactId}
                  onValueChange={(v) => setFormData({ ...formData, contactId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Expected Revenue</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={formData.expectedRevenue || ''}
                    onChange={(e) => setFormData({ ...formData, expectedRevenue: parseFloat(e.target.value) || 0 })}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Expected Close Date</Label>
                <Input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOpportunity}>Create Opportunity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
