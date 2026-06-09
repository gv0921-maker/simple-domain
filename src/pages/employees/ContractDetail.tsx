import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Ban, Clock } from 'lucide-react';
import { HR_NAV } from '@/lib/navigation/hr';
import { useContract, useEmployee, useUpdateContract } from '@/hooks/hr';
import { toast } from '@/hooks/use-toast';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-amber-100 text-amber-700',
  terminated: 'bg-red-100 text-red-700',
};

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useContract(id);
  const { data: employee } = useEmployee(contract?.employee_id);
  const updateMut = useUpdateContract();

  const setStatus = async (status: string) => {
    if (!id) return;
    try {
      await updateMut.mutateAsync({ id, patch: { status } });
      toast({ title: `Contract marked as ${status}` });
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <AppLayout title="Contracts" moduleNav={HR_NAV}><div className="p-6">Loading…</div></AppLayout>;
  if (!contract) return <AppLayout title="Contracts" moduleNav={HR_NAV}><div className="p-6">Not found.</div></AppLayout>;

  return (
    <AppLayout title="Contracts" subtitle={contract.contract_number ?? ''} moduleNav={HR_NAV}>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/employees/contracts')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Contracts
          </Button>
          <div className="flex gap-2">
            {contract.status === 'active' && (
              <Button variant="outline" className="gap-2" onClick={() => setStatus('expired')}>
                <Clock className="h-4 w-4" /> Mark Expired
              </Button>
            )}
            {contract.status !== 'terminated' && (
              <Button variant="outline" className="gap-2 text-destructive" onClick={() => setStatus('terminated')}>
                <Ban className="h-4 w-4" /> Terminate
              </Button>
            )}
            {contract.status === 'draft' && (
              <Button onClick={() => setStatus('active')}>Activate</Button>
            )}
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{contract.contract_number}</h1>
              <p
                className="text-muted-foreground cursor-pointer hover:underline"
                onClick={() => employee && navigate(`/employees/${employee.id}`)}
              >
                {employee?.full_name ?? '—'}
              </p>
            </div>
            <Badge variant="outline" className={STATUS_COLORS[contract.status] ?? ''}>{contract.status}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <Info label="Type" value={contract.contract_type} />
            <Info label="Start Date" value={contract.start_date} />
            <Info label="End Date" value={contract.end_date ?? '—'} />
            <Info label="Currency" value={contract.currency} />
            <Info label="Working Hours / Day" value={String(contract.working_hours_per_day)} />
            <Info label="Working Days / Week" value={String(contract.working_days_per_week)} />
            <Info label="Probation (months)" value={contract.probation_period_months?.toString() ?? '—'} />
            <Info label="Notice Period (days)" value={contract.notice_period_days?.toString() ?? '—'} />
            <Info label="Signed Date" value={contract.signed_date ?? '—'} />
          </div>

          <h2 className="font-semibold mt-6 mb-3">Salary Breakdown</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <Line label="Basic" value={Number(contract.basic_salary)} />
            <Line label="HRA" value={Number(contract.hra)} />
            <Line label="DA" value={Number(contract.da)} />
            <Line label="Special Allowance" value={Number(contract.special_allowance)} />
            <Line label="Conveyance Allowance" value={Number(contract.conveyance_allowance)} />
            <Line label="Medical Allowance" value={Number(contract.medical_allowance)} />
          </div>
          <div className="mt-4 flex justify-between p-3 rounded-md bg-primary/5">
            <span className="font-medium">Gross Salary (Monthly)</span>
            <span className="font-semibold text-primary">{fmtINR(Number(contract.gross_salary ?? 0))}</span>
          </div>
          <div className="mt-2 flex justify-between p-3 rounded-md bg-muted/40">
            <span className="font-medium">CTC (Annual)</span>
            <span className="font-semibold">{fmtINR(Number(contract.ctc ?? 0))}</span>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function Info({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-sm mt-0.5 capitalize">{value ?? '—'}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{fmtINR(value)}</span>
    </div>
  );
}