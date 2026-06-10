import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MANUFACTURING_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useBOMs, useSaveBOM, useDeleteBOM } from '@/hooks/manufacturing';
import { useProducts } from '@/hooks/inventory';
import type { BillOfMaterials, BOMLine } from '@/lib/services/manufacturing/api';
import { Plus, Search, Trash2, Edit, Layers, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function BOMList() {
  const { data: boms = [] } = useBOMs();
  const { data: products = [] } = useProducts();
  const saveBOMMut = useSaveBOM();
  const deleteBOMMut = useDeleteBOM();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BillOfMaterials | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    productId: '',
    productName: '',
    quantity: 1,
    uom: 'Units',
    status: 'draft' as BillOfMaterials['status'],
    lines: [] as BOMLine[],
  });

  const [newLine, setNewLine] = useState({ productId: '', quantity: 1, uom: 'Units' });

  const filteredBOMs = boms.filter(bom =>
    bom.name.toLowerCase().includes(search.toLowerCase()) ||
    bom.productName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (bom?: BillOfMaterials) => {
    if (bom) {
      setEditingBOM(bom);
      setFormData({
        name: bom.name,
        productId: bom.productId,
        productName: bom.productName,
        quantity: bom.quantity,
        uom: bom.uom,
        status: bom.status,
        lines: [...bom.lines],
      });
    } else {
      setEditingBOM(null);
      setFormData({
        name: '',
        productId: '',
        productName: '',
        quantity: 1,
        uom: 'Units',
        status: 'draft',
        lines: [],
      });
    }
    setDialogOpen(true);
  };

  const handleAddLine = () => {
    const product = products.find(p => p.id === newLine.productId);
    if (!product) return;
    setFormData({
      ...formData,
      lines: [...formData.lines, {
        id: `L-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: newLine.quantity,
        uom: newLine.uom,
      }],
    });
    setNewLine({ productId: '', quantity: 1, uom: 'Units' });
  };

  const handleRemoveLine = (lineId: string) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter(l => l.id !== lineId),
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.productId) {
      toast.error('Please select a product and enter a BOM name');
      return;
    }
    try {
      await saveBOMMut.mutateAsync({
        id: editingBOM?.id ?? '',
        name: formData.name,
        productId: formData.productId,
        productName: formData.productName,
        quantity: formData.quantity,
        uom: formData.uom,
        status: formData.status,
        lines: formData.lines,
        createdAt: editingBOM?.createdAt ?? new Date().toISOString(),
      });
      toast.success(editingBOM ? 'BOM updated' : 'BOM created');
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to save BOM');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBOMMut.mutateAsync(id);
    toast.success('BOM deleted');
  };

  const handleStatusChange = async (id: string, status: BillOfMaterials['status']) => {
    const bom = boms.find(b => b.id === id);
    if (!bom) return;
    await saveBOMMut.mutateAsync({ ...bom, status });
    toast.success(`BOM ${status}`);
  };

  return (
    <AppLayout title="Manufacturing" subtitle="Bill of Materials" moduleNav={MANUFACTURING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bill of Materials</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New BOM
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-4">
          {filteredBOMs.map((bom) => (
            <Card key={bom.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{bom.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {bom.productName} • {bom.quantity} {bom.uom}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Badge variant={bom.status === 'active' ? 'default' : bom.status === 'archived' ? 'secondary' : 'outline'}>
                      {bom.status}
                    </Badge>
                    {bom.status === 'draft' && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleStatusChange(bom.id, 'active'); }}>
                        Activate
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleOpenDialog(bom); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(bom.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="lines" className="border-none">
                    <AccordionTrigger className="py-2 text-sm">
                      Components ({bom.lines.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Component</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>UoM</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bom.lines.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell>{line.productName}</TableCell>
                              <TableCell>{line.quantity}</TableCell>
                              <TableCell>{line.uom}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>{editingBOM ? 'Edit BOM' : 'New Bill of Materials'}</DialogTitle>
            <DialogDescription>
              {editingBOM ? 'Update bill of materials details and components' : 'Create a new bill of materials for production'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>BOM Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder=""
                />
              </div>
              <div>
                <Label>Product</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(v) => {
                    const p = products.find(pr => pr.id === v);
                    setFormData({ ...formData, productId: v, productName: p?.name ?? '' });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Unit of Measure</Label>
                <Input
                  value={formData.uom}
                  onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as BillOfMaterials['status'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="mb-2 block">Components</Label>
              <div className="flex gap-2 mb-4">
                <Select
                  value={newLine.productId}
                  onValueChange={(v) => setNewLine({ ...newLine, productId: v })}
                >
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select component" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder=""
                  value={newLine.quantity}
                  onChange={(e) => setNewLine({ ...newLine, quantity: parseFloat(e.target.value) || 1 })}
                  className="w-20"
                />
                <Input
                  placeholder=""
                  value={newLine.uom}
                  onChange={(e) => setNewLine({ ...newLine, uom: e.target.value })}
                  className="w-24"
                />
                <Button onClick={handleAddLine}>Add</Button>
              </div>

              {formData.lines.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>UoM</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.productName}</TableCell>
                        <TableCell>{line.quantity}</TableCell>
                        <TableCell>{line.uom}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => handleRemoveLine(line.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingBOM ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
