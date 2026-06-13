import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SETTINGS_NAV } from '@/lib/navigation/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompanySettings, useUpdateCompanySettings } from '@/hooks/companySettings';
import { toast } from 'sonner';
import type { CompanySettings as CS } from '@/lib/services/companySettings/api';

export default function CompanySettings() {
  const { data, isLoading } = useCompanySettings();
  const update = useUpdateCompanySettings();
  const [form, setForm] = useState<Partial<CS>>({});

  useEffect(() => { if (data) setForm(data); }, [data]);

  // Edit access is enforced by RLS (Super Admin only). UI shows banner.
  const readOnly = false;

  function update_(field: keyof CS, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function save() {
    if (!data?.id) return;
    try {
      await update.mutateAsync({
        id: data.id,
        patch: {
          company_name: form.company_name ?? data.company_name,
          address: form.address ?? null,
          city: form.city ?? null,
          state: form.state ?? null,
          country: form.country ?? data.country,
          pincode: form.pincode ?? null,
          phone: form.phone ?? null,
          email: form.email ?? null,
          gstin: form.gstin ?? null,
          website: form.website ?? null,
          logo_url: form.logo_url ?? null,
          letterhead_footer: form.letterhead_footer ?? null,
          standard_terms: form.standard_terms ?? null,
          thermal_width_mm: Number(form.thermal_width_mm ?? data.thermal_width_mm ?? 80),
          default_advance_percent: Number(form.default_advance_percent ?? data.default_advance_percent ?? 40),
        },
      });
      toast.success('Company settings saved');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Save failed');
    }
  }

  return (
    <AppLayout title="Settings" subtitle="Company" moduleNav={SETTINGS_NAV}>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="text-xs bg-muted text-muted-foreground border rounded px-3 py-2">
          Only Super Admins can save changes — others will see a permission error on save.
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Identity</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Company Name" value={form.company_name ?? ''} onChange={(v) => update_('company_name', v)} disabled={readOnly} />
            <Field label="GSTIN" value={form.gstin ?? ''} onChange={(v) => update_('gstin', v)} disabled={readOnly} />
            <Field label="Phone" value={form.phone ?? ''} onChange={(v) => update_('phone', v)} disabled={readOnly} />
            <Field label="Email" value={form.email ?? ''} onChange={(v) => update_('email', v)} disabled={readOnly} />
            <Field label="Website" value={form.website ?? ''} onChange={(v) => update_('website', v)} disabled={readOnly} />
            <Field label="Logo URL" value={form.logo_url ?? ''} onChange={(v) => update_('logo_url', v)} disabled={readOnly} placeholder="https://…" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Field label="Address" value={form.address ?? ''} onChange={(v) => update_('address', v)} disabled={readOnly} />
            </div>
            <Field label="City" value={form.city ?? ''} onChange={(v) => update_('city', v)} disabled={readOnly} />
            <Field label="State" value={form.state ?? ''} onChange={(v) => update_('state', v)} disabled={readOnly} />
            <Field label="Pincode" value={form.pincode ?? ''} onChange={(v) => update_('pincode', v)} disabled={readOnly} />
            <Field label="Country" value={form.country ?? ''} onChange={(v) => update_('country', v)} disabled={readOnly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Print Defaults</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Letterhead Footer</Label>
              <Textarea
                rows={2}
                value={form.letterhead_footer ?? ''}
                onChange={(e) => update_('letterhead_footer', e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div>
              <Label className="text-xs">Standard Terms &amp; Conditions</Label>
              <Textarea
                rows={6}
                value={form.standard_terms ?? ''}
                onChange={(e) => update_('standard_terms', e.target.value)}
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Shown on every Sales Order and Quotation print.
              </p>
            </div>
            <Field
              label="Thermal Printer Width (mm)"
              type="number"
              value={String(form.thermal_width_mm ?? 80)}
              onChange={(v) => update_('thermal_width_mm', Number(v))}
              disabled={readOnly}
            />
            <div>
              <Label className="text-xs">Default Advance Percentage Required (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={String(form.default_advance_percent ?? 40)}
                onChange={(e) => update_('default_advance_percent', Number(e.target.value))}
                disabled={readOnly}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Seeds the advance % gate on every new Sales Order (0–100).
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={readOnly || isLoading || update.isPending}>
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{props.label}</Label>
      <Input
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
        placeholder={props.placeholder}
      />
    </div>
  );
}