import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ACCOUNTING_NAV } from '@/lib/navigation/accounting';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getJournalEntries, createJournalEntry, updateJournalEntry, getAccounts, JournalEntry, JournalLine } from '@/lib/data/accounting';
import { Plus, Search, Trash2, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function JournalEntries() {
  const [entries, setEntries] = useState(getJournalEntries());
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const accounts = getAccounts();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    journal: 'General',
    reference: '',
    lines: [] as JournalLine[],
  });

  const [newLine, setNewLine] = useState({
    accountId: '',
    description: '',
    debit: 0,
    credit: 0,
  });

  const filteredEntries = entries.filter(entry =>
    entry.name.toLowerCase().includes(search.toLowerCase()) ||
    entry.reference?.toLowerCase().includes(search.toLowerCase())
  );

  const totalDebit = formData.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = formData.lines.reduce((sum, l) => sum + l.credit, 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleAddLine = () => {
    const account = accounts.find(a => a.id === newLine.accountId);
    if (!account || (newLine.debit === 0 && newLine.credit === 0)) {
      toast.error('Please select account and enter debit or credit');
      return;
    }

    setFormData({
      ...formData,
      lines: [...formData.lines, {
        id: `JL-${Date.now()}`,
        accountId: newLine.accountId,
        accountName: account.name,
        description: newLine.description,
        debit: newLine.debit,
        credit: newLine.credit,
      }],
    });
    setNewLine({ accountId: '', description: '', debit: 0, credit: 0 });
  };

  const handleRemoveLine = (lineId: string) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter(l => l.id !== lineId),
    });
  };

  const handleCreate = () => {
    if (!isBalanced) {
      toast.error('Journal entry must be balanced');
      return;
    }

    createJournalEntry({
      date: formData.date,
      journal: formData.journal,
      reference: formData.reference,
      status: 'draft',
      lines: formData.lines,
      totalDebit,
      totalCredit,
    });
    setEntries(getJournalEntries());
    setDialogOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      journal: 'General',
      reference: '',
      lines: [],
    });
    toast.success('Journal entry created');
  };

  const handlePost = (id: string) => {
    updateJournalEntry(id, { status: 'posted' });
    setEntries(getJournalEntries());
    toast.success('Journal entry posted');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <AppLayout title="Accounting" subtitle="Journal Entries" moduleNav={ACCOUNTING_NAV}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Journal Entries</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Journal</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.journal}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(entry.totalDebit)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(entry.totalCredit)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.status === 'posted' ? 'default' : entry.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.status === 'draft' && (
                        <Button size="sm" variant="ghost" onClick={() => handlePost(entry.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Post
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Journal</Label>
                <Select value={formData.journal} onValueChange={(v) => setFormData({ ...formData, journal: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reference</Label>
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="mb-2 block">Journal Lines</Label>
              <div className="flex gap-2 mb-4">
                <Select value={newLine.accountId} onValueChange={(v) => setNewLine({ ...newLine, accountId: v })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Description"
                  value={newLine.description}
                  onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                  className="w-40"
                />
                <Input
                  type="number"
                  placeholder="Debit"
                  value={newLine.debit || ''}
                  onChange={(e) => setNewLine({ ...newLine, debit: parseFloat(e.target.value) || 0, credit: 0 })}
                  className="w-28"
                />
                <Input
                  type="number"
                  placeholder="Credit"
                  value={newLine.credit || ''}
                  onChange={(e) => setNewLine({ ...newLine, credit: parseFloat(e.target.value) || 0, debit: 0 })}
                  className="w-28"
                />
                <Button onClick={handleAddLine}>Add</Button>
              </div>

              {formData.lines.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.accountName}</TableCell>
                        <TableCell>{line.description || '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => handleRemoveLine(line.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}

              {formData.lines.length > 0 && (
                <div className={`mt-2 text-sm ${isBalanced ? 'text-success' : 'text-destructive'}`}>
                  {isBalanced ? '✓ Entry is balanced' : '✗ Entry is not balanced'}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!isBalanced}>Create Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
