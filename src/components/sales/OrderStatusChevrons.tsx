import { WorkflowStatus, type WorkflowStep } from '@/components/forms/WorkflowStatus';
import type { SalesOrderStatus } from '@/lib/services/sales/types';

/** B2C 5-stage flow displayed as chevrons. */
const FLOW: { id: SalesOrderStatus; label: string }[] = [
  { id: 'estimate', label: 'Estimate' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'ready_to_pick', label: 'Ready to Pick' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
];

/** Map legacy status values onto the new flow for display purposes only. */
function normalize(status: SalesOrderStatus): SalesOrderStatus {
  if (status === 'draft') return 'estimate';
  if (status === 'locked') return 'ready_to_pick';
  if (status === 'paid') return 'confirmed';
  return status;
}

interface Props {
  status: SalesOrderStatus;
  onStepClick?: (next: SalesOrderStatus) => void;
}

export function OrderStatusChevrons({ status, onStepClick }: Props) {
  const current = normalize(status);
  const currentIdx = FLOW.findIndex((s) => s.id === current);

  if (status === 'cancelled') {
    return (
      <div className="inline-flex items-center rounded-md bg-destructive/10 text-destructive px-3 py-1.5 text-sm font-medium">
        Cancelled
      </div>
    );
  }

  const steps: WorkflowStep[] = FLOW.map((s, idx) => ({
    id: s.id,
    label: s.label,
    status: idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'upcoming',
  }));

  return <WorkflowStatus steps={steps} onStepClick={(id) => onStepClick?.(id as SalesOrderStatus)} />;
}

/** Allowed manual transitions. Keeps the workflow strictly forward (or cancel). */
export function canTransition(from: SalesOrderStatus, to: SalesOrderStatus, role?: string): boolean {
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isManager = role === 'manager' || isAdmin;
  const isWarehouse = role === 'warehouse' || isAdmin || isManager;

  if (to === 'cancelled') return isManager;

  const f = normalize(from);
  const order: SalesOrderStatus[] = ['estimate', 'confirmed', 'ready_to_pick', 'dispatched', 'delivered'];
  const fi = order.indexOf(f);
  const ti = order.indexOf(to);
  if (fi === -1 || ti === -1) return false;
  if (ti !== fi + 1) return false; // only one step forward
  if (to === 'confirmed') return true; // any sales role
  return isWarehouse; // ready_to_pick → delivered all warehouse-gated
}