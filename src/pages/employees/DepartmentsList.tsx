import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { EMPLOYEES_NAV } from '@/lib/navigation/employees';
import { useDepartments, useEmployees, useCreateDepartment } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

export default function DepartmentsList() {
  const navigate = useNavigate();
  const { data: departments = [] } = useDepartments();
  const { data: employees = [] } = useEmployees();
  const createMut = useCreateDepartment();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#1D9E75');

  const stats = useMemo(() => {
    const empCounts = new Map<string, number>();
    const subCounts = new Map<string, number>();
    employees.forEach((e) => e.department_id && empCounts.set(e.department_id, (empCounts.get(e.department_id) ?? 0) + 1));
    departments.forEach((d) => d.parent_department_id && subCounts.set(d.parent_department_id, (subCounts.get(d.parent_department_id) ?? 0) + 1));
    return { empCounts, subCounts };
  }, [departments, employees]);

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) {
      toast({ title: 'Name and code are required', variant: 'destructive' });
      return;
    }
    try {
      await createMut.mutateAsync({ name, code: code.toUpperCase(), color });
      toast({ title: 'Department created' });
      setOpen(false); setName(''); setCode(''); setColor('#1D9E75');
    } catch (e: any) {
      toast({ title: 'Create failed', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <AppLayout title="Employees" subtitle="Departments" moduleNav={EMPLOYEES_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Departments</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Department</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Department</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Code</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-24 h-10" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMut.isPending}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Sub-Departments</TableHead>
                <TableHead>Manager</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No departments.</TableCell></TableRow>
              ) : departments.map((d) => {
                const manager = d.manager_id ? employees.find((e) => e.id === d.manager_id) : null;
                return (
                  <TableRow key={d.id} className="cursor-pointer" onClick={() => navigate(`/employees/departments/${d.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                        <span className="font-medium">{d.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.code}</TableCell>
                    <TableCell>{stats.empCounts.get(d.id) ?? 0}</TableCell>
                    <TableCell>{stats.subCounts.get(d.id) ?? 0}</TableCell>
                    <TableCell>{manager?.full_name ?? '—'}</TableCell>
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