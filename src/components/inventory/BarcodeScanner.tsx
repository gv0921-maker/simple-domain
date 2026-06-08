import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ScanLine, 
  Camera, 
  X, 
  Check, 
  Package,
  AlertCircle,
  Keyboard
} from 'lucide-react';
import { useProducts, useLocations } from '@/hooks/inventory';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  onScan: (barcode: string, type: 'product' | 'location' | 'unknown') => void;
  onClose?: () => void;
  mode?: 'camera' | 'keyboard' | 'auto';
  placeholder?: string;
  autoFocus?: boolean;
  showRecentScans?: boolean;
  className?: string;
}

interface ScanResult {
  barcode: string;
  type: 'product' | 'location' | 'unknown';
  name?: string;
  timestamp: Date;
}

export function BarcodeScanner({
  onScan,
  onClose,
  mode = 'auto',
  placeholder = 'Scan or enter barcode...',
  autoFocus = true,
  showRecentScans = true,
  className
}: BarcodeScannerProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useCameraMode, setUseCameraMode] = useState(mode === 'camera');
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const { data: allProducts = [] } = useProducts();
  const { data: allLocations = [] } = useLocations();

  // Auto-focus input on mount
  useEffect(() => {
    if (autoFocus && inputRef.current && !useCameraMode) {
      inputRef.current.focus();
    }
  }, [autoFocus, useCameraMode]);

  // Handle keyboard input - detect rapid input as barcode scanner
  const handleBarcodeInput = useCallback((value: string) => {
    setIsProcessing(true);
    
    // Check if it's a product barcode
    const product = allProducts.find(p => p.barcode === value || p.barcodes?.includes(value));
    if (product) {
      const result: ScanResult = {
        barcode: value,
        type: 'product',
        name: product.name,
        timestamp: new Date()
      };
      setRecentScans(prev => [result, ...prev.slice(0, 9)]);
      onScan(value, 'product');
      toast({
        title: 'Product Scanned',
        description: `${product.name} (${product.sku})`,
      });
      setIsProcessing(false);
      setInputValue('');
      return;
    }

    // Check if it's a location barcode
    const location = allLocations.find(l => l.barcode === value);
    if (location) {
      const result: ScanResult = {
        barcode: value,
        type: 'location',
        name: location.name,
        timestamp: new Date()
      };
      setRecentScans(prev => [result, ...prev.slice(0, 9)]);
      onScan(value, 'location');
      toast({
        title: 'Location Scanned',
        description: location.name,
      });
      setIsProcessing(false);
      setInputValue('');
      return;
    }

    // Unknown barcode
    const result: ScanResult = {
      barcode: value,
      type: 'unknown',
      timestamp: new Date()
    };
    setRecentScans(prev => [result, ...prev.slice(0, 9)]);
    onScan(value, 'unknown');
    toast({
      title: 'Barcode Scanned',
      description: `Unknown barcode: ${value}`,
      variant: 'destructive'
    });
    setIsProcessing(false);
    setInputValue('');
  }, [onScan, toast, allProducts, allLocations]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleBarcodeInput(inputValue.trim());
    }
  };

  const handleManualSubmit = () => {
    if (inputValue.trim()) {
      handleBarcodeInput(inputValue.trim());
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Scanner Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-11 h-14 text-lg font-mono"
            disabled={isProcessing}
          />
          {isProcessing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
        <Button
          size="lg"
          className="h-14 px-6"
          onClick={handleManualSubmit}
          disabled={!inputValue.trim() || isProcessing}
        >
          <Check className="h-5 w-5" />
        </Button>
        {mode === 'auto' && (
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-4"
            onClick={() => setIsCameraDialogOpen(true)}
          >
            <Camera className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={!useCameraMode ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setUseCameraMode(false)}
          className="flex-1"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Keyboard
        </Button>
        <Button
          variant={useCameraMode ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => {
            setUseCameraMode(true);
            setIsCameraDialogOpen(true);
          }}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
        </Button>
      </div>

      {/* Recent Scans */}
      {showRecentScans && recentScans.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <p className="text-sm font-medium text-muted-foreground mb-2">Recent Scans</p>
            <div className="space-y-2">
              {recentScans.slice(0, 5).map((scan, index) => (
                <div
                  key={`${scan.barcode}-${index}`}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 animate-fade-in"
                >
                  <div className="flex items-center gap-2">
                    {scan.type === 'product' ? (
                      <Package className="h-4 w-4 text-primary" />
                    ) : scan.type === 'location' ? (
                      <ScanLine className="h-4 w-4 text-info" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{scan.name || scan.barcode}</p>
                      {scan.name && (
                        <p className="text-xs text-muted-foreground font-mono">{scan.barcode}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      scan.type === 'product' && 'border-primary text-primary',
                      scan.type === 'location' && 'border-info text-info',
                      scan.type === 'unknown' && 'border-destructive text-destructive'
                    )}
                  >
                    {scan.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Dialog */}
      <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Camera Scanner</DialogTitle>
            <DialogDescription>
              Point your camera at a barcode to scan
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-32 border-2 border-primary rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/50 animate-pulse" />
              </div>
            </div>
            <div className="text-center p-4">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Camera scanning requires HTTPS and user permission.
                <br />
                Use keyboard input for now.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCameraDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Hook for barcode detection from keyboard input
export function useBarcodeScanner(callback: (barcode: string) => void) {
  const [buffer, setBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const now = Date.now();
      
      // If more than 100ms between keystrokes, reset buffer (human typing)
      if (now - lastKeyTime > 100) {
        setBuffer(e.key);
      } else {
        setBuffer(prev => prev + e.key);
      }
      
      setLastKeyTime(now);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to process buffer
      timeoutRef.current = setTimeout(() => {
        if (buffer.length >= 8) { // Minimum barcode length
          callback(buffer);
        }
        setBuffer('');
      }, 50);
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [buffer, lastKeyTime, callback]);
}
