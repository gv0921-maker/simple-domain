import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FileText, Search } from 'lucide-react';
import { HR_NAV } from '@/lib/navigation/hr';
import { useContracts, useEmployees } from '@/hooks/hr';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-amber-100 text-amber-700',
  terminated: 'bg-red-100 text-red-700',
};

export default function ContractsList() {
  const navigate = useNavigate();
  const { data: contracts = [] } = useContracts();
  const { data: employees = [] } = useEmployees();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return contracts.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (!s) return true;
      const emp = empById.get(c.employee_id);
      return (
        c.contract_number?.toLowerCase().includes(s) ||
        emp?.full_name?.toLowerCase().includes(s) ||
        emp?.employee_code?.toLowerCase().includes(s)
      );
    });
  }, [contracts, status, search, empById]);

  return (
    <AppLayout title="Employees" subtitle="Contracts" moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2 items-center flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9 w-72" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigate('/employees/contracts/new')} className="gap-2">
            <FileText className="h-4 w-4" /> New Contract
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No contracts.</TableCell></TableRow>
              ) : filtered.map((c) => {
                const emp = empById.get(c.employee_id);
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/employees/contracts/${c.id}`)}>
                    <TableCell className="font-medium">{c.contract_number}</TableCell>
                    <TableCell>{emp?.full_name ?? '—'}</TableCell>
                    <TableCell className="capitalize">{c.contract_type}</TableCell>
                    <TableCell>{c.start_date}</TableCell>
                    <TableCell>{c.end_date ?? '—'}</TableCell>
                    <TableCell className="text-right">{fmtINR(Number(c.gross_salary ?? 0))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[c.status] ?? ''}>{c.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}