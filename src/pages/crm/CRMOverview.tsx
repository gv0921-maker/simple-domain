// CRM Dashboard Page
import { AppLayout } from '@/components/layout/AppLayout';
import { CRMDashboard } from '@/components/crm/CRMDashboard';

export default function CRMOverview() {
  return (
    <AppLayout title="Dashboards">
      <CRMDashboard />
    </AppLayout>
  );
}
