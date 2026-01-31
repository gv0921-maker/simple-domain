import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PLM_NAV } from '@/lib/navigation/manufacturing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getECOs, createECO, updateECO, ECO } from '@/lib/data/manufacturing';
import { Plus, Search, FileText, GitBranch, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  in_review: 'outline',
  approved: 'default',
  applied: 'default',
  rejected: 'destructive',
};

const typeLabels: Record<string, string> = {
  bom_change: 'BOM Change',
  routing_change: 'Routing Change',
  product_update: 'Product Update',
};

export default function PLMOverview() {
  const [ecos, setECOs] = useState(getECOs());
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    type: 'bom_change' as ECO['type'],
    description: '',
    requestedBy: '',
  });

  const stats = {
    draft: ecos.filter(e => e.status === 'draft').length,
    inReview: ecos.filter(e => e.status === 'in_review').length,
    approved: ecos.filter(e => e.status === 'approved').length,
    applied: ecos.filter(e => e.status === 'applied').length,
  };

  const filteredECOs = ecos.filter(eco =>
    eco.name.toLowerCase().includes(search.toLowerCase()) ||
    eco.productName.toLowerCase().includes(search.toLowerCase()) ||
    eco.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!formData.productName || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }

    createECO({
      ...formData,
      productId: `PROD-${Date.now()}`,
      status: 'draft',
      requestedDate: new Date().toISOString().split('T')[0],
    });
    setECOs(getECOs());
    setDialogOpen(false);
    setFormData({
      productId: '',
      productName: '',
      type: 'bom_change',
      description: '',
      requestedBy: '',
    });
    toast.success('ECO created');
  };

  const handleStatusChange = (id: string, status: ECO['status']) => {
    updateECO(id, { status });
    setECOs(getECOs());
    toast.success(`ECO ${status}`);
  };

  return (
    <AppLayout title="PLM" moduleNav={PLM_NAV}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Product Lifecycle Management</h1>
            <p className="text-muted-foreground">Manage engineering change orders and product versions</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New ECO
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Draft</p>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Review</p>
                  <p className="text-2xl font-bold">{stats.inReview}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Applied</p>
                  <p className="text-2xl font-bold">{stats.applied}</p>
                </div>
                <GitBranch className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ECO List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Engineering Change Orders</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ECOs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredECOs.map((eco) => (
                  <TableRow key={eco.id}>
                    <TableCell className="font-medium">{eco.id}</TableCell>
                    <TableCell>{eco.productName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[eco.type]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{eco.description}</TableCell>
                    <TableCell>{eco.requestedBy}</TableCell>
                    <TableCell>{eco.requestedDate}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[eco.status]}>{eco.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {eco.status === 'draft' && (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(eco.id, 'in_review')}>
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Submit
                          </Button>
                        )}
                        {eco.status === 'in_review' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(eco.id, 'approved')}>
                              <CheckCircle className="h-4 w-4 text-success" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(eco.id, 'rejected')}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {eco.status === 'approved' && (
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(eco.id, 'applied')}>
                            Apply
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Engineering Change Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name</Label>
              <Input
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="Affected product"
              />
            </div>
            <div>
              <Label>Change Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as ECO['type'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bom_change">BOM Change</SelectItem>
                  <SelectItem value="routing_change">Routing Change</SelectItem>
                  <SelectItem value="product_update">Product Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the change..."
                rows={3}
              />
            </div>
            <div>
              <Label>Requested By</Label>
              <Input
                value={formData.requestedBy}
                onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                placeholder="Team or person requesting"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create ECO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
