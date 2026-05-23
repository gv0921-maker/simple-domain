import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Check, X, Home, Building2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateGSTIN } from '@/lib/services/sales';
import type { LocationType } from '@/lib/services/sales/types';

/** Internal data shape used by both BillingSection and DeliverySection. */
export interface AddressBlockValue {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  locationType?: LocationType;
  // House
  roadAvailableForTempo?: boolean;
  // Flat
  floorNumber?: number;
  cargoElevator?: boolean;
  staircaseWidth?: number;
  staircaseHeight?: number;
  // Office
  gstin?: string;
  officeFloorNumber?: number;
  officeCargoElevator?: boolean;
  officeStaircaseWidth?: number;
  officeStaircaseHeight?: number;
}

interface Props {
  value: AddressBlockValue;
  onChange: (next: AddressBlockValue) => void;
  disabled?: boolean;
  /** Field name prefix for ids/keys (e.g. "billing"). */
  idPrefix: string;
  /** Hide the name field (used by delivery when mirroring billing). */
  hideName?: boolean;
}

const LOCATION_TYPES: { value: LocationType; label: string; icon: typeof Home }[] = [
  { value: 'house', label: 'House', icon: Home },
  { value: 'flat', label: 'Flat', icon: Building2 },
  { value: 'office', label: 'Office', icon: Briefcase },
];

export function AddressBlock({ value, onChange, disabled, idPrefix, hideName }: Props) {
  const set = <K extends keyof AddressBlockValue>(key: K, v: AddressBlockValue[K]) =>
    onChange({ ...value, [key]: v });

  const [gstinTouched, setGstinTouched] = useState(false);
  const gstinValid = value.gstin ? validateGSTIN(value.gstin) : false;

  // Reset Office GSTIN touched when locationType flips
  useEffect(() => { setGstinTouched(false); }, [value.locationType]);

  return (
    <div className="space-y-3">
      {!hideName && (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-name`}>Name <span className="text-destructive">*</span></Label>
          <Input
            id={`${idPrefix}-name`}
            value={value.name || ''}
            onChange={(e) => set('name', e.target.value)}
            disabled={disabled}
            placeholder=""
          />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-addr1`}>Address Line 1 <span className="text-destructive">*</span></Label>
        <Input
          id={`${idPrefix}-addr1`}
          value={value.addressLine1 || ''}
          onChange={(e) => set('addressLine1', e.target.value)}
          disabled={disabled}
          placeholder=""
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-addr2`}>Address Line 2</Label>
        <Input
          id={`${idPrefix}-addr2`}
          value={value.addressLine2 || ''}
          onChange={(e) => set('addressLine2', e.target.value)}
          disabled={disabled}
          placeholder=""
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-city`}>City <span className="text-destructive">*</span></Label>
          <Input
            id={`${idPrefix}-city`}
            value={value.city || ''}
            onChange={(e) => set('city', e.target.value)}
            disabled={disabled}
            placeholder=""
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-state`}>State <span className="text-destructive">*</span></Label>
          <Input
            id={`${idPrefix}-state`}
            value={value.state || ''}
            onChange={(e) => set('state', e.target.value)}
            disabled={disabled}
            placeholder=""
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-zip`}>ZIP <span className="text-destructive">*</span></Label>
          <Input
            id={`${idPrefix}-zip`}
            value={value.zip || ''}
            onChange={(e) => set('zip', e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
            disabled={disabled}
            placeholder=""
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Location Type <span className="text-destructive">*</span></Label>
        <div className="inline-flex rounded-md border border-input p-0.5 bg-background">
          {LOCATION_TYPES.map((lt) => {
            const Icon = lt.icon;
            const active = value.locationType === lt.value;
            return (
              <Button
                key={lt.value}
                type="button"
                variant={active ? 'default' : 'ghost'}
                size="sm"
                className={cn('gap-2 h-8', !active && 'text-muted-foreground')}
                onClick={() => set('locationType', lt.value)}
                disabled={disabled}
              >
                <Icon className="h-3.5 w-3.5" />
                {lt.label}
              </Button>
            );
          })}
        </div>
      </div>

      {value.locationType === 'house' && (
        <div className="flex items-center justify-between rounded-md border border-input bg-muted/30 p-3">
          <div>
            <Label htmlFor={`${idPrefix}-tempo`} className="font-normal">Road accessible for tempo</Label>
            <p className="text-xs text-muted-foreground">Can a delivery tempo reach the house entrance?</p>
          </div>
          <Switch
            id={`${idPrefix}-tempo`}
            checked={!!value.roadAvailableForTempo}
            onCheckedChange={(v) => set('roadAvailableForTempo', v)}
            disabled={disabled}
          />
        </div>
      )}

      {value.locationType === 'flat' && (
        <div className="space-y-3 rounded-md border border-input bg-muted/30 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${idPrefix}-floor`}>Floor Number <span className="text-destructive">*</span></Label>
              <Input
                id={`${idPrefix}-floor`}
                type="number" min={0} max={100}
                value={value.floorNumber ?? ''}
                onChange={(e) => set('floorNumber', e.target.value === '' ? undefined : Number(e.target.value))}
                disabled={disabled}
                placeholder=""
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-elev`} className="font-normal">Cargo elevator available</Label>
              <Switch
                id={`${idPrefix}-elev`}
                checked={!!value.cargoElevator}
                onCheckedChange={(v) => set('cargoElevator', v)}
                disabled={disabled}
              />
            </div>
          </div>
          {!value.cargoElevator && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-sw`}>Staircase Width (in)</Label>
                <Input
                  id={`${idPrefix}-sw`}
                  type="number"
                  value={value.staircaseWidth ?? ''}
                  onChange={(e) => set('staircaseWidth', e.target.value === '' ? undefined : Number(e.target.value))}
                  disabled={disabled}
                  placeholder=""
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-sh`}>Staircase Height (in)</Label>
                <Input
                  id={`${idPrefix}-sh`}
                  type="number"
                  value={value.staircaseHeight ?? ''}
                  onChange={(e) => set('staircaseHeight', e.target.value === '' ? undefined : Number(e.target.value))}
                  disabled={disabled}
                  placeholder=""
                />
              </div>
              <p className="col-span-full text-xs text-muted-foreground -mt-2">Clearance dimensions (inches)</p>
            </div>
          )}
        </div>
      )}

      {value.locationType === 'office' && (
        <div className="space-y-3 rounded-md border border-input bg-muted/30 p-3">
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-gstin`}>GSTIN <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id={`${idPrefix}-gstin`}
                value={value.gstin || ''}
                onChange={(e) => set('gstin', e.target.value.toUpperCase())}
                onBlur={() => setGstinTouched(true)}
                disabled={disabled}
                placeholder=""
                maxLength={15}
                className={cn(
                  'pr-9',
                  gstinTouched && value.gstin && !gstinValid && 'border-destructive focus-visible:ring-destructive',
                )}
              />
              {value.gstin && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  {gstinValid ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-destructive" />}
                </span>
              )}
            </div>
            {gstinTouched && value.gstin && !gstinValid && (
              <p className="text-xs text-destructive">Invalid GSTIN format</p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${idPrefix}-ofloor`}>Floor Number <span className="text-destructive">*</span></Label>
              <Input
                id={`${idPrefix}-ofloor`}
                type="number" min={0} max={100}
                value={value.officeFloorNumber ?? ''}
                onChange={(e) => set('officeFloorNumber', e.target.value === '' ? undefined : Number(e.target.value))}
                disabled={disabled}
                placeholder=""
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idPrefix}-oelev`} className="font-normal">Cargo elevator available</Label>
              <Switch
                id={`${idPrefix}-oelev`}
                checked={!!value.officeCargoElevator}
                onCheckedChange={(v) => set('officeCargoElevator', v)}
                disabled={disabled}
              />
            </div>
          </div>
          {!value.officeCargoElevator && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-osw`}>Staircase Width (in)</Label>
                <Input
                  id={`${idPrefix}-osw`}
                  type="number"
                  value={value.officeStaircaseWidth ?? ''}
                  onChange={(e) => set('officeStaircaseWidth', e.target.value === '' ? undefined : Number(e.target.value))}
                  disabled={disabled}
                  placeholder=""
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${idPrefix}-osh`}>Staircase Height (in)</Label>
                <Input
                  id={`${idPrefix}-osh`}
                  type="number"
                  value={value.officeStaircaseHeight ?? ''}
                  onChange={(e) => set('officeStaircaseHeight', e.target.value === '' ? undefined : Number(e.target.value))}
                  disabled={disabled}
                  placeholder=""
                />
              </div>
              <p className="col-span-full text-xs text-muted-foreground -mt-2">Clearance dimensions (inches)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Map flat B2C fields on a Quotation/SalesOrder ↔ AddressBlockValue. */
export function pickBilling(o: Record<string, any>): AddressBlockValue {
  return {
    name: o.billingName, addressLine1: o.billingAddressLine1, addressLine2: o.billingAddressLine2,
    city: o.billingCity, state: o.billingState, zip: o.billingZip,
    locationType: o.billingLocationType,
    roadAvailableForTempo: o.billingRoadAvailableForTempo,
    floorNumber: o.billingFloorNumber, cargoElevator: o.billingCargoElevator,
    staircaseWidth: o.billingStaircaseWidth, staircaseHeight: o.billingStaircaseHeight,
    gstin: o.billingGSTIN,
    officeFloorNumber: o.billingOfficeFloorNumber, officeCargoElevator: o.billingOfficeCargoElevator,
    officeStaircaseWidth: o.billingOfficeStaircaseWidth, officeStaircaseHeight: o.billingOfficeStaircaseHeight,
  };
}

export function applyBilling(o: Record<string, any>, v: AddressBlockValue) {
  return {
    ...o,
    billingName: v.name, billingAddressLine1: v.addressLine1, billingAddressLine2: v.addressLine2,
    billingCity: v.city, billingState: v.state, billingZip: v.zip,
    billingLocationType: v.locationType,
    billingRoadAvailableForTempo: v.roadAvailableForTempo,
    billingFloorNumber: v.floorNumber, billingCargoElevator: v.cargoElevator,
    billingStaircaseWidth: v.staircaseWidth, billingStaircaseHeight: v.staircaseHeight,
    billingGSTIN: v.gstin,
    billingOfficeFloorNumber: v.officeFloorNumber, billingOfficeCargoElevator: v.officeCargoElevator,
    billingOfficeStaircaseWidth: v.officeStaircaseWidth, billingOfficeStaircaseHeight: v.officeStaircaseHeight,
  };
}

export function pickDelivery(o: Record<string, any>): AddressBlockValue {
  return {
    name: o.deliveryName, addressLine1: o.deliveryAddressLine1, addressLine2: o.deliveryAddressLine2,
    city: o.deliveryCity, state: o.deliveryState, zip: o.deliveryZip,
    locationType: o.deliveryLocationType,
    roadAvailableForTempo: o.deliveryRoadAvailableForTempo,
    floorNumber: o.deliveryFloorNumber, cargoElevator: o.deliveryCargoElevator,
    staircaseWidth: o.deliveryStaircaseWidth, staircaseHeight: o.deliveryStaircaseHeight,
    gstin: o.deliveryGSTIN,
    officeFloorNumber: o.deliveryOfficeFloorNumber, officeCargoElevator: o.deliveryOfficeCargoElevator,
    officeStaircaseWidth: o.deliveryOfficeStaircaseWidth, officeStaircaseHeight: o.deliveryOfficeStaircaseHeight,
  };
}

export function applyDelivery(o: Record<string, any>, v: AddressBlockValue) {
  return {
    ...o,
    deliveryName: v.name, deliveryAddressLine1: v.addressLine1, deliveryAddressLine2: v.addressLine2,
    deliveryCity: v.city, deliveryState: v.state, deliveryZip: v.zip,
    deliveryLocationType: v.locationType,
    deliveryRoadAvailableForTempo: v.roadAvailableForTempo,
    deliveryFloorNumber: v.floorNumber, deliveryCargoElevator: v.cargoElevator,
    deliveryStaircaseWidth: v.staircaseWidth, deliveryStaircaseHeight: v.staircaseHeight,
    deliveryGSTIN: v.gstin,
    deliveryOfficeFloorNumber: v.officeFloorNumber, deliveryOfficeCargoElevator: v.officeCargoElevator,
    deliveryOfficeStaircaseWidth: v.officeStaircaseWidth, deliveryOfficeStaircaseHeight: v.officeStaircaseHeight,
  };
}