import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import {
  getTransfer,
  saveTransfer,
  getProducts,
  getWarehouses,
  type InventoryTransfer,
  type StockMove,
  type TransferStatus,
} from '@/lib/data/inventory';
import { getItem } from '@/lib/storage';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioConfig } from '@/hooks/useStudioConfig';

interface OperationType {
  id: string;
  name: string;
  code: string;
  type: 'incoming' | 'outgoing' | 'internal';
}

const DEFAULT_OPERATION_TYPES: OperationType[] = [
  { id: '1', name: 'Receipts', code: 'IN', type: 'incoming' },
  { id: '2', name: 'Delivery Orders', code: 'OUT', type: 'outgoing' },
  { id: '3', name: 'Internal Transfers', code: 'INT', type: 'internal' },
  { id: '4', name: 'Returns', code: 'RET', type: 'incoming' },
];

export default function TransferForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isNew = id === 'new';
  const studio = useStudioConfig('inventory', 'Transfer');

  const [products] = useState(getProducts());
  const [warehouses] = useState(getWarehouses());
  const [operationTypes] = useState<OperationType[]>(
    getItem('operation_types', DEFAULT_OPERATION_TYPES)
  );

  const [transfer, setTransfer] = useState<InventoryTransfer>({
    id: '',
    reference: `TRF/${new Date().getFullYear()}/${String(Date.now()).slice(-5)}`,
    contact: '',
    contactPhone: '',
    operationType: operationTypes[0]?.name || 'Internal Transfer',
    sourceLocation: warehouses[0]?.name || 'Main Warehouse',
    destinationLocation: warehouses[1]?.name || 'Factory',
    scheduledDate: new Date().toISOString().slice(0, 16),
    status: 'draft' as TransferStatus,
    productAvailability: 'available',
    moves: [],
    notes: [],
    activities: [],
    createdBy: user?.name || 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [newMove, setNewMove] = useState({
    productId: '',
    demand: 1,
  });
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      const existingTransfer = getTransfer(id);
      if (existingTransfer) {
        setTransfer({
          ...existingTransfer,
          scheduledDate: existingTransfer.scheduledDate.slice(0, 16),
        });
      } else {
        navigate('/inventory/operations');
      }
    }
  }, [id, isNew, navigate]);

  const handleChange = (field: keyof InventoryTransfer, value: string) => {
    setTransfer((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMove = () => {
    if (!newMove.productId) {
      toast({ title: 'Select a product', variant: 'destructive' });
      return;
    }

    const product = products.find((p) => p.id === newMove.productId);
    if (!product) return;

    const move: StockMove = {
      productId: product.id,
      productName: `[${product.sku}] ${product.name}`,
      demand: newMove.demand,
      quantity: 0,
      unit: product.unitOfMeasure,
      available: product.stockOnHand >= newMove.demand,
    };

    setTransfer((prev) => ({
      ...prev,
      moves: [...prev.moves, move],
    }));
    setNewMove({ productId: '', demand: 1 });
  };

  const handleRemoveMove = (index: number) => {
    setTransfer((prev) => ({
      ...prev,
      moves: prev.moves.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateMoveQuantity = (index: number, quantity: number) => {
    setTransfer((prev) => ({
      ...prev,
      moves: prev.moves.map((m, i) =>
        i === index ? { ...m, quantity } : m
      ),
    }));
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    setTransfer((prev) => ({
      ...prev,
      notes: [...prev.notes, note],
    }));
    setNote('');
  };

  const handleSave = () => {
    if (!transfer.contact) {
      toast({ title: 'Contact is required', variant: 'destructive' });
      return;
    }

    if (transfer.moves.length === 0) {
      toast({ title: 'Add at least one product', variant: 'destructive' });
      return;
    }

    const availability = transfer.moves.every((m) => m.available)
      ? 'available'
      : transfer.moves.some((m) => m.available)
      ? 'partial'
      : 'not_available';

    const transferToSave: InventoryTransfer = {
      ...transfer,
      scheduledDate: new Date(transfer.scheduledDate).toISOString(),
      productAvailability: availability,
      activities: isNew
        ? [
            {
              id: crypto.randomUUID(),
              userId: user?.id || '1',
              userName: user?.name || 'System',
              action: 'Transfer created',
              timestamp: new Date().toISOString(),
            },
          ]
        : [
            ...transfer.activities,
            {
              id: crypto.randomUUID(),
              userId: user?.id || '1',
              userName: user?.name || 'System',
              action: 'Transfer updated',
              timestamp: new Date().toISOString(),
            },
          ],
    };

    saveTransfer(transferToSave);
    toast({
      title: isNew ? 'Transfer Created' : 'Transfer Updated',
      description: `${transfer.reference} has been saved.`,
    });
    navigate('/inventory/operations');
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/operations')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {isNew ? 'New Transfer' : `Edit ${transfer.reference}`}
              </h1>
              <p className="text-muted-foreground">
                {isNew ? 'Create a new inventory transfer' : 'Edit transfer details'}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            {isNew ? 'Create Transfer' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Reference</Label>
                    <Input value={transfer.reference} disabled className="bg-muted" />
                  </div>
                  {studio.isFieldVisible('operationType') && (
                    <div className="grid gap-2">
                      <Label>{studio.getFieldLabel('operationType', 'Operation Type')} *</Label>
                      <Select
                        value={transfer.operationType}
                        onValueChange={(v) => handleChange('operationType', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operationTypes.map((op) => (
                            <SelectItem key={op.id} value={op.name}>
                              {op.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label>Contact Name *</Label>
                    <Input
                      value={transfer.contact}
                      onChange={(e) => handleChange('contact', e.target.value)}
                      placeholder=""
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contact Phone</Label>
                    <Input
                      value={transfer.contactPhone || ''}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                      placeholder=""
                    />
                  </div>
                  {studio.isFieldVisible('sourceWarehouse') && (
                    <div className="grid gap-2">
                      <Label>{studio.getFieldLabel('sourceWarehouse', 'Source Location')} *</Label>
                      <Select
                        value={transfer.sourceLocation}
                        onValueChange={(v) => handleChange('sourceLocation', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.name}>
                              {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {studio.isFieldVisible('destWarehouse') && (
                    <div className="grid gap-2">
                      <Label>{studio.getFieldLabel('destWarehouse', 'Destination Location')} *</Label>
                      <Select
                        value={transfer.destinationLocation}
                        onValueChange={(v) => handleChange('destinationLocation', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.name}>
                              {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {studio.isFieldVisible('scheduledDate') && (
                    <div className="grid gap-2">
                      <Label>{studio.getFieldLabel('scheduledDate', 'Scheduled Date')}</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="datetime-local"
                          value={transfer.scheduledDate}
                          onChange={(e) => handleChange('scheduledDate', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stock Moves */}
            <Card>
              <CardHeader>
                <CardTitle>Products to Transfer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <Label>Product</Label>
                    <Select
                      value={newMove.productId}
                      onValueChange={(v) => setNewMove({ ...newMove, productId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            [{p.sku}] {p.name} (Stock: {p.stockOnHand})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label>Demand</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newMove.demand}
                      onChange={(e) =>
                        setNewMove({ ...newMove, demand: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddMove} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>

                {transfer.moves.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Demand</TableHead>
                        <TableHead className="text-right">Done</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfer.moves.map((move, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{move.productName}</TableCell>
                          <TableCell className="text-right">{move.demand}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              max={move.demand}
                              value={move.quantity}
                              onChange={(e) =>
                                handleUpdateMoveQuantity(index, parseInt(e.target.value) || 0)
                              }
                              className="w-20 text-right"
                            />
                          </TableCell>
                          <TableCell>{move.unit}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMove(index)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No products added yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder=""
                    className="min-h-[80px]"
                  />
                </div>
                <Button onClick={handleAddNote} variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add Note
                </Button>
                {transfer.notes.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    {transfer.notes.map((n, i) => (
                      <div key={i} className="text-sm p-2 bg-muted rounded">
                        {n}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
