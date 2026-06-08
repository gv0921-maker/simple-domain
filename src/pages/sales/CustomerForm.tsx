import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useCustomer, useSaveCustomer } from '@/hooks/sales';
import { SALES_NAV } from '@/lib/navigation/sales';
import { useToast } from '@/hooks/use-toast';
import {
  upsertContactFromCustomer,
  buildCustomerPopulationFields,
} from '@/lib/sales/customerCrmSync';
import {
  readSalesReturnContext,
  clearSalesReturnContext,
} from '@/lib/sales/contactPopulation';
import { useQueryClient } from '@tanstack/react-query';
import { crmKeys } from '@/hooks/crm/useCRMQueries';

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const returnToSales = searchParams.get('returnTo') === 'sales_form';
  const { toast } = useToast();
  const isEdit = !!id;
  const { data: existing } = useCustomer(id);
  const saveMut = useSaveCustomer();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    contactPerson: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        name: existing.name,
        email: existing.email ?? '',
        phone: existing.phone ?? '',
        company: existing.company ?? '',
        contactPerson: existing.contactPerson ?? '',
        address: existing.address ?? '',
        notes: existing.notes ?? '',
      });
    }
  }, [existing]);

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    saveMut.mutate(
      {
        ...(id ? { id } : {}),
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        company: formData.company || null,
        contactPerson: formData.contactPerson || null,
        address: formData.address || null,
        notes: formData.notes || null,
        isActive: true,
      },
      {
        onSuccess: (saved) => {
          toast({ title: isEdit ? 'Customer updated' : 'Customer created' });
          // Mirror to crm_contacts so the same person shows up in CRM too.
          upsertContactFromCustomer(saved)
            .catch((e) => {
              toast({
                title: 'CRM sync failed',
                description: e?.message ?? String(e),
                variant: 'destructive',
              });
            })
            .finally(() => {
              queryClient.invalidateQueries({ queryKey: crmKeys.contacts() });
              if (returnToSales) {
                const ctx = readSalesReturnContext();
                clearSalesReturnContext();
                const populated = buildCustomerPopulationFields(saved);
                const target = ctx?.returnTo || '/sales/quotations/new';
                navigate(target, {
                  state: {
                    restoredFormData: { ...(ctx?.formData || {}), ...populated },
                    newCustomerId: saved.id,
                  },
                });
                return;
              }
              navigate('/sales/customers');
            });
        },
        onError: (e: any) => toast({ title: 'Save failed', description: e?.message, variant: 'destructive' }),
      },
    );
  };

  return (
    <AppLayout title="Sales" moduleNav={SALES_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/sales/customers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {isEdit ? 'Edit Customer' : 'New Customer'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update customer details' : 'Add a new customer contact'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Company</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Contact Person</Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/sales/customers')}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saveMut.isPending}>
            {saveMut.isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'} Customer
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
