import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, X, Plus, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  uploadQCImageAsync,
  type CreateGoodsReceiptQCInput,
  type QCReferenceType,
  type QCStatus,
} from '@/lib/services/qc/api';
import { useCreateGoodsReceiptQC } from '@/hooks/qc';

export interface QCLineInput {
  productId: string;
  productName: string;
  productSku?: string;
  expectedQuantity: number;
  requireSerials?: boolean;
}

interface LineState {
  receivedQty: number;
  serials: string[];
  serialInput: string;
  lots: string[];
  lotInput: string;
  images: string[];
  uploading: boolean;
  status: QCStatus | null;
  notes: string;
}

function emptyState(expected: number): LineState {
  return {
    receivedQty: expected,
    serials: [],
    serialInput: '',
    lots: [],
    lotInput: '',
    images: [],
    uploading: false,
    status: null,
    notes: '',
  };
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  referenceType: QCReferenceType;
  referenceId: string;
  lines: QCLineInput[];
  onConfirmed: (records: CreateGoodsReceiptQCInput[]) => void | Promise<void>;
  submittingLabel?: string;
}

export function GoodsReceiptQCDialog({
  open,
  onOpenChange,
  title = 'Quality Control',
  description = 'Inspect each item before stock is added to the warehouse.',
  referenceType,
  referenceId,
  lines,
  onConfirmed,
  submittingLabel = 'Validate',
}: Props) {
  const createQC = useCreateGoodsReceiptQC();
  const [state, setState] = useState<Record<string, LineState>>(() => {
    const m: Record<string, LineState> = {};
    lines.forEach((l, i) => (m[`${l.productId}-${i}`] = emptyState(l.expectedQuantity)));
    return m;
  });
  const [submitting, setSubmitting] = useState(false);

  const updateLine = (key: string, patch: Partial<LineState>) =>
    setState(s => ({ ...s, [key]: { ...s[key], ...patch } }));

  const handleUpload = async (key: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    updateLine(key, { uploading: true });
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadQCImageAsync(referenceType, referenceId, f);
        urls.push(url);
      }
      setState(s => ({
        ...s,
        [key]: { ...s[key], images: [...s[key].images, ...urls], uploading: false },
      }));
    } catch (e: any) {
      updateLine(key, { uploading: false });
      toast.error(e?.message ?? 'Image upload failed');
    }
  };

  const addSerial = (key: string) => {
    const cur = state[key];
    const v = cur.serialInput.trim();
    if (!v) return;
    if (cur.serials.includes(v)) {
      toast.error('Serial already scanned');
      return;
    }
    updateLine(key, { serials: [...cur.serials, v], serialInput: '' });
  };

  const addLot = (key: string) => {
    const cur = state[key];
    const v = cur.lotInput.trim();
    if (!v) return;
    if (cur.lots.includes(v)) {
      toast.error('Lot already added');
      return;
    }
    updateLine(key, { lots: [...cur.lots, v], lotInput: '' });
  };

  const validate = (): string | null => {
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const key = `${l.productId}-${i}`;
      const s = state[key];
      if (!s) return `Missing data for ${l.productName}`;
      if (s.images.length < 1) return `Add at least 1 QC image for ${l.productName}`;
      if (!s.status) return `Set QC status for ${l.productName}`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateGoodsReceiptQCInput[] = lines.map((l, i) => {
        const key = `${l.productId}-${i}`;
        const s = state[key];
        return {
          referenceType,
          referenceId,
          productId: l.productId,
          expectedQuantity: l.expectedQuantity,
          receivedQuantity: s.receivedQty,
          serialNumbersScanned: s.serials,
          lotNumbersScanned: s.lots,
          qcStatus: s.status!,
          qcImages: s.images,
          qcNotes: s.notes || undefined,
        };
      });
      await createQC.mutateAsync(payload);
      await onConfirmed(payload);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'QC submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4">
            {lines.map((l, i) => {
              const key = `${l.productId}-${i}`;
              const s = state[key];
              return (
                <Card key={key}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{l.productName}</div>
                        {l.productSku && (
                          <div className="text-xs text-muted-foreground">{l.productSku}</div>
                        )}
                      </div>
                      <Badge variant="outline">Expected: {l.expectedQuantity}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label>Received Quantity *</Label>
                        <Input
                          type="number"
                          min={0}
                          value={s.receivedQty}
                          onChange={e =>
                            updateLine(key, { receivedQty: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label>QC Result *</Label>
                        <ToggleGroup
                          type="single"
                          value={s.status ?? ''}
                          onValueChange={(v) =>
                            v && updateLine(key, { status: v as QCStatus })
                          }
                          className="justify-start"
                        >
                          <ToggleGroupItem value="passed" aria-label="Pass" className="gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Pass
                          </ToggleGroupItem>
                          <ToggleGroupItem value="failed" aria-label="Fail" className="gap-1">
                            <XCircle className="h-4 w-4" /> Fail
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label>Scan / Enter Serial Numbers</Label>
                      <div className="flex gap-2">
                        <Input
                          value={s.serialInput}
                          onChange={e => updateLine(key, { serialInput: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSerial(key);
                            }
                          }}
                          placeholder="Scan barcode or type serial"
                        />
                        <Button type="button" variant="outline" onClick={() => addSerial(key)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {s.serials.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.serials.map(sn => (
                            <Badge key={sn} variant="secondary" className="gap-1">
                              {sn}
                              <button
                                type="button"
                                onClick={() =>
                                  updateLine(key, {
                                    serials: s.serials.filter(x => x !== sn),
                                  })
                                }
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-1">
                      <Label>Lot Numbers (optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          value={s.lotInput}
                          onChange={e => updateLine(key, { lotInput: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addLot(key);
                            }
                          }}
                          placeholder="Lot number"
                        />
                        <Button type="button" variant="outline" onClick={() => addLot(key)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {s.lots.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.lots.map(lo => (
                            <Badge key={lo} variant="secondary" className="gap-1">
                              {lo}
                              <button
                                type="button"
                                onClick={() =>
                                  updateLine(key, { lots: s.lots.filter(x => x !== lo) })
                                }
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-1">
                      <Label>QC Images * (min 1)</Label>
                      <div className="flex flex-wrap gap-2">
                        {s.images.map(url => (
                          <div key={url} className="relative h-20 w-20 rounded border overflow-hidden group">
                            <img src={url} alt="QC" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                updateLine(key, { images: s.images.filter(x => x !== url) })
                              }
                              className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5 opacity-0 group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <label className="h-20 w-20 rounded border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
                          {s.uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Camera className="h-5 w-5 text-muted-foreground" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={e => handleUpload(key, e.target.files)}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label>Notes</Label>
                      <Textarea
                        value={s.notes}
                        onChange={e => updateLine(key, { notes: e.target.value })}
                        placeholder=""
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submittingLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}