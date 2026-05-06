import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from './PhoneInput';
import { AddressBlock, AddressBlockValue, pickBilling, applyBilling } from './AddressBlock';

/** Top-level value model for the billing section. */
export interface BillingSectionValue {
  billingCustomerName?: string;
  billingPhone1?: string;
  billingPhone2?: string;
  // Address block fields (flattened on the parent record)
  billingName?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingLocationType?: AddressBlockValue['locationType'];
  [key: string]: any;
}

interface Props {
  value: BillingSectionValue;
  onChange: (next: BillingSectionValue) => void;
  disabled?: boolean;
}

export function BillingSection({ value, onChange, disabled }: Props) {
  const set = (patch: Partial<BillingSectionValue>) => onChange({ ...value, ...patch });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Billing Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="billing-customer">Customer Name <span className="text-destructive">*</span></Label>
          <Input
            id="billing-customer"
            value={value.billingCustomerName || ''}
            onChange={(e) => set({ billingCustomerName: e.target.value })}
            disabled={disabled}
            placeholder=""
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PhoneInput
            id="billing-phone1"
            label="Primary Phone"
            value={value.billingPhone1 || ''}
            onChange={(v) => set({ billingPhone1: v })}
            required
            disabled={disabled}
          />
          <PhoneInput
            id="billing-phone2"
            label="Secondary Phone"
            value={value.billingPhone2 || ''}
            onChange={(v) => set({ billingPhone2: v })}
            required
            disabled={disabled}
          />
        </div>

        <AddressBlock
          idPrefix="billing"
          value={pickBilling(value)}
          onChange={(v) => onChange(applyBilling(value, v) as BillingSectionValue)}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}