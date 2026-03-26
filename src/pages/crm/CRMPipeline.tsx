// CRM Pipeline Page — Odoo-style with Kanban + List views
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CRMKanbanBoard } from '@/components/crm/CRMKanbanBoard';
import { CRMPipelineListView } from '@/components/crm/CRMPipelineListView';
import { CRM_NAV } from '@/lib/navigation/crm';

export default function CRMPipeline() {
  const navigate = useNavigate();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const handleNewOpportunity = () => {
    navigate('/crm/opportunities/new');
  };

  return (
    <AppLayout title="CRM" moduleNav={CRM_NAV}>
      {view === 'kanban' ? (
        <CRMKanbanBoard
          onNewOpportunity={handleNewOpportunity}
          view={view}
          onViewChange={setView}
        />
      ) : (
        <CRMPipelineListView
          onNewOpportunity={handleNewOpportunity}
          view={view}
          onViewChange={setView}
        />
      )}
    </AppLayout>
  );
}
