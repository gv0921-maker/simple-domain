import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  ShieldCheck, Camera, Loader2, CheckCircle2, XCircle, AlertTriangle, X, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReservationsBySalesOrder } from '@/hooks/inventory/reservations';
import { useDeliveryQC, useCreateDeliveryQC } from '@/hooks/qc';
import { uploadDeliveryQCImageAsync, type DeliveryQCStatus } from '@/lib/services/qc/delivery';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

interface Props {
  salesOrderId: string;
  orderReference?: string;
}

// Resolve the actual serial number strings for reserved serial_number_ids
function useReservedSerialNames(serialIds: string[]) {
  return useQuery({
    queryKey: ['delivery-qc', 'reserved-serial-names', [...serialIds].sort().join(',')],
    queryFn: async () => {
      if (serialIds.length === 0) return [] as { id: string; name: string }[];
      const { data, error } = await supabase
        .from('serial_numbers')
        .select('id,name')
        .in('id', serialIds);
      if (error) throw error;
      return (data ?? []) as { id: string; name: string }[];
    },
    enabled: serialIds.length > 0,
  });
}

export function PreDeliveryQCSection({ salesOrderId, orderReference }: Props) {
  const { data: reservations = [] } = useReservationsBySalesOrder(salesOrderId);
  const { data: existingQC, isLoading } = useDeliveryQC(salesOrderId);
  const createQC = useCreateDeliveryQC();

  const reservedSerialIds = useMemo(
    () => reservations.map(r => r.serialNumberId).filter(Boolean) as string[],
    [reservations],
  );
  const { data: reservedSerials = [] } = useReservedSerialNames(reservedSerialIds);
  const expectedSerials = useMemo(
    () => new Set(reservedSerials.map(s => s.name.toLowerCase())),
    [reservedSerials],
  );

  const [scanInput, setScanInput] = useState('');
  const [scanned, setScanned] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<DeliveryQCStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If we already have a QC record, show summary instead of the form.
  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto w-full">
        <CardContent className="p-4 text-sm text-muted-foreground">Loading pre-delivery QC…</CardContent>
      </Card>
    );
  }

  if (existingQC && existingQC.status === 'passed') {
    return (
      <Card className="max-w-4xl mx-auto w-full border-success/40 bg-success/5">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-success" />
          <div className="flex-1 text-sm">
            <Badge className="bg-success text-success-foreground hover:bg-success mr-2">QC Passed</Badge>
            <span className="text-foreground">
              {existingQC.scannedSerials.length} item(s) verified
              {existingQC.verifiedAt && ` · ${format(parseISO(existingQC.verifiedAt), 'MMM d, yyyy HH:mm')}`}
            </span>
          </div>
          {existingQC.qcImages.length > 0 && (
            <div className="flex gap-1">
              {existingQC.qcImages.slice(0, 3).map(url => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="h-10 w-10 rounded border overflow-hidden block">
                  <img src={url} alt="QC" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const failedBanner = existingQC && existingQC.status === 'failed';

  const addSerial = () => {
    const v = scanInput.trim();
    if (!v) return;
    if (scanned.includes(v)) {
      toast.error('Serial already scanned');
      return;
    }
    setScanned(s => [...s, v]);
    setScanInput('');
    if (!expectedSerials.has(v.toLowerCase())) {
      toast.warning(`Serial ${v} is not reserved for this order`);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        urls.push(await uploadDeliveryQCImageAsync(salesOrderId, f));
      }
      setImages(prev => [...prev, ...urls]);
    } catch (e: any) {
      toast.error(e?.message ?? 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (images.length < 1) {
      toast.error('Add at least 1 QC image');
      return;
    }
    if (!status) {
      toast.error('Set QC pass/fail');
      return;
    }
    setSubmitting(true);
    try {
      await createQC.mutateAsync({
        salesOrderId,
        status,
        qcImages: images,
        scannedSerials: scanned,
        qcNotes: notes || undefined,
      });
      if (status === 'failed') {
        toast.error('QC marked failed — invoice blocked');
      } else {
        toast.success('Pre-delivery QC passed');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to record QC');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-3">
      {failedBanner && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-3 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">
              Pre-delivery QC failed — resolve issues before invoicing.
            </span>
            {existingQC?.qcNotes && <span className="ml-1 text-destructive/80">— {existingQC.qcNotes}</span>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Pre-delivery QC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reservations.length === 0 ? (
            <div className="text-sm text-muted-foreground border rounded p-3">
              No reserved stock found for this order. Reserve items before running pre-delivery QC.
            </div>
          ) : (
            <div>
              <Label className="text-xs">Reserved items</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {reservedSerials.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    {reservations.length} reservation(s) — no specific serial numbers
                  </span>
                )}
                {reservedSerials.map(s => {
                  const isScanned = scanned.some(x => x.toLowerCase() === s.name.toLowerCase());
                  return (
                    <Badge
                      key={s.id}
                      variant="outline"
                      className={isScanned
                        ? 'border-success text-success bg-success/10'
                        : 'border-muted-foreground/30 text-muted-foreground'}
                    >
                      {isScanned && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {s.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-1">
            <Label>Scan serial numbers *</Label>
            <div className="flex gap-2">
              <Input
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addSerial(); }
                }}
                placeholder=""
              />
              <Button type="button" variant="outline" onClick={addSerial}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {scanned.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {scanned.map(sn => {
                  const matched = expectedSerials.has(sn.toLowerCase());
                  return (
                    <Badge
                      key={sn}
                      variant="outline"
                      className={matched
                        ? 'border-success text-success bg-success/10 gap-1'
                        : 'border-destructive text-destructive bg-destructive/10 gap-1'}
                    >
                      {matched ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {sn}
                      <button type="button" onClick={() => setScanned(s => s.filter(x => x !== sn))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-1">
            <Label>QC images * (min 1)</Label>
            <div className="flex flex-wrap gap-2">
              {images.map(url => (
                <div key={url} className="relative h-20 w-20 rounded border overflow-hidden group">
                  <img src={url} alt="QC" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(im => im.filter(x => x !== url))}
                    className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-20 w-20 rounded border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5 text-muted-foreground" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
              </label>
            </div>
          </div>

          <div className="grid gap-1">
            <Label>QC result *</Label>
            <ToggleGroup
              type="single"
              value={status ?? ''}
              onValueChange={v => v && setStatus(v as DeliveryQCStatus)}
              className="justify-start"
            >
              <ToggleGroupItem value="passed" className="gap-1">
                <CheckCircle2 className="h-4 w-4" /> Pass
              </ToggleGroupItem>
              <ToggleGroupItem value="failed" className="gap-1">
                <XCircle className="h-4 w-4" /> Fail
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid gap-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="" />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Pre-delivery QC
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}