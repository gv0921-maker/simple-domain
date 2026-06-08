import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Package,
  Bell,
} from 'lucide-react';
import { useReorderRules, useDeleteReorderRule, useTriggeredReorderRules } from '@/hooks/inventory';
import type { ReorderRule } from '@/lib/services/inventory';
import { INVENTORY_NAV } from '@/lib/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


export default function ReorderRules() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: rules = [] } = useReorderRules();
  const { data: triggeredRules = [], refetch: refetchTriggered } = useTriggeredReorderRules();
  const deleteMut = useDeleteReorderRule();
  const [search, setSearch] = useState('');

  const filteredRules = useMemo(() => {
    return rules.filter((rule) =>
      rule.productName.toLowerCase().includes(search.toLowerCase()) ||
      rule.warehouseName.toLowerCase().includes(search.toLowerCase())
    );
  }, [rules, search]);

  const stats = useMemo(() => ({
    total: rules.length,
    active: rules.filter(r => r.isActive).length,
    triggered: triggeredRules.length,
  }), [rules, triggeredRules]);


  const handleDelete = (id: string) => {
    deleteMut.mutate(id, { onSuccess: () => toast({ title: 'Rule Deleted' }) });
  };

  const handleRunCheck = async () => {
    const { data: triggered = [] } = await refetchTriggered();
    if (triggered.length > 0) {
      toast({ title: 'Low Stock Alert', description: `${triggered.length} products need replenishment.`, variant: 'destructive' });
    } else {
      toast({ title: 'Stock Levels OK', description: 'All products are above minimum levels.' });
    }
  };

  return (
    <AppLayout title="Inventory" moduleNav={INVENTORY_NAV}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Reorder Rules</h1>
            <p className="text-muted-foreground">Configure automatic stock replenishment triggers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRunCheck} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Check Now
            </Button>
            <Button onClick={() => navigate('/inventory/reorder-rules/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Rule
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="animate-slide-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Triggered Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                stats.triggered > 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {stats.triggered}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Triggered Alerts */}
        {triggeredRules.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {triggeredRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="font-medium">{rule.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {rule.warehouseName} • Reorder: {rule.reorderQty} units
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Create Order
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Min Qty</TableHead>
                <TableHead>Max Qty</TableHead>
                <TableHead>Reorder Qty</TableHead>
                <TableHead>Lead Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reorder rules found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule, index) => {
                  const isTriggered = triggeredRules.some(t => t.id === rule.id);
                  return (
                    <TableRow
                      key={rule.id}
                      className={cn(
                        "animate-fade-in",
                        isTriggered && "bg-destructive/5"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isTriggered && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {rule.productName}
                        </div>
                      </TableCell>
                      <TableCell>{rule.warehouseName}</TableCell>
                      <TableCell>{rule.minQty}</TableCell>
                      <TableCell>{rule.maxQty}</TableCell>
                      <TableCell>{rule.reorderQty}</TableCell>
                      <TableCell>{rule.leadTimeDays} days</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          rule.isActive
                            ? 'bg-success/20 text-success border-success'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/inventory/reorder-rules/${rule.id}/edit`)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(rule.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

      </div>
    </AppLayout>
  );
}
