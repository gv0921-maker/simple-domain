import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AddressBlock, pickBilling, pickDelivery, applyDelivery } from './AddressBlock';

interface Props {
  value: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  disabled?: boolean;
}

export function DeliverySection({ value, onChange, disabled }: Props) {
  const sameAsBilling = !!value.deliverySameAsBilling;

  // When toggled on, mirror billing into delivery. When toggled off, prefill from current billing.
  const handleToggle = (checked: boolean) => {
    if (checked) {
      const billing = pickBilling(value);
      onChange({ ...applyDelivery(value, billing), deliverySameAsBilling: true });
    } else {
      // Prefill: keep current delivery values if already set, else copy billing as starting point.
      const hasAny = !!value.deliveryAddressLine1 || !!value.deliveryName;
      const next = hasAny ? value : applyDelivery(value, pickBilling(value));
      onChange({ ...next, deliverySameAsBilling: false });
    }
  };

  // Keep delivery in sync if billing changes while same-as-billing is on.
  useEffect(() => {
    if (sameAsBilling) {
      const billing = pickBilling(value);
      const updated = applyDelivery(value, billing);
      // avoid infinite loop: only patch if any delivery key actually differs
      const changed = Object.keys(updated).some((k) => updated[k] !== (value as any)[k]);
      if (changed) onChange({ ...updated, deliverySameAsBilling: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    value.billingName, value.billingAddressLine1, value.billingAddressLine2,
    value.billingCity, value.billingState, value.billingZip,
    value.billingLocationType, value.billingFloorNumber, value.billingCargoElevator,
    value.billingStaircaseWidth, value.billingStaircaseHeight,
    value.billingGSTIN, value.billingOfficeFloorNumber, value.billingOfficeCargoElevator,
    value.billingOfficeStaircaseWidth, value.billingOfficeStaircaseHeight,
    value.billingRoadAvailableForTempo,
  ]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Delivery Details</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="same-as-billing" className="font-normal text-sm">Same as Billing</Label>
          <Switch
            id="same-as-billing"
            checked={sameAsBilling}
            onCheckedChange={handleToggle}
            disabled={disabled}
          />
        </div>
      </CardHeader>
      {!sameAsBilling && (
        <CardContent>
          <AddressBlock
            idPrefix="delivery"
            value={pickDelivery(value)}
            onChange={(v) => onChange(applyDelivery(value, v))}
            disabled={disabled}
          />
        </CardContent>
      )}
    </Card>
  );
}