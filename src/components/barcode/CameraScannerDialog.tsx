import { useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanned: (text: string) => void;
}

export function CameraScannerDialog({ open, onOpenChange, onScanned }: Props) {
  const elId = useRef(`html5-qr-${Math.random().toString(36).slice(2, 9)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const start = async () => {
      try {
        scannerRef.current = new Html5Qrcode(elId.current);
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decoded) => {
            if (cancelled) return;
            onScanned(decoded);
            void scannerRef.current?.stop().catch(() => undefined);
            onOpenChange(false);
          },
          () => undefined,
        );
      } catch {
        // camera unavailable
      }
    };
    void start();
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        Promise.resolve(s.stop()).catch(() => undefined).finally(() => {
          try { s.clear(); } catch { /* ignore */ }
        });
      }
    };
  }, [open, onScanned, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Camera Scan</DialogTitle>
          <DialogDescription>Point your camera at a barcode.</DialogDescription>
        </DialogHeader>
        <div id={elId.current} className="w-full rounded-md overflow-hidden bg-black" />
      </DialogContent>
    </Dialog>
  );
}

export default CameraScannerDialog;