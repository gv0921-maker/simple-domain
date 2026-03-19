// CRM Pipeline Page — Odoo-style with Kanban + List views
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
import { getContacts, saveOpportunity, getOpportunities } from '@/lib/data/crm';
import { useToast } from '@/hooks/use-toast';

export default function CRMPipeline() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [contacts] = useState(() => getContacts());
  const [formData, setFormData] = useState({
    name: '',
    contactId: '',
    expectedRevenue: 0,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleCreateOpportunity = () => {
    if (!formData.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
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
    setIsNewDialogOpen(false);
    setFormData({
      name: '',
      contactId: '',
      expectedRevenue: 0,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    // Force page re-render
    window.location.reload();
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
          <div className="space-y-3 py-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Opportunity Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Office Design Project"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Contact</Label>
                <Select value={formData.contactId} onValueChange={(v) => setFormData({ ...formData, contactId: v })}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Expected Revenue</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                  <Input
                    type="number"
                    value={formData.expectedRevenue || ''}
                    onChange={(e) => setFormData({ ...formData, expectedRevenue: parseFloat(e.target.value) || 0 })}
                    className="pl-6 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Expected Closing</Label>
                <Input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewDialogOpen(false)}>
              Discard
            </Button>
            <Button size="sm" onClick={handleCreateOpportunity}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
