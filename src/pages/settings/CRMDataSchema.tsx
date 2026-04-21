// Static "API docs" page — documents the localStorage shapes used by CRM
// (no real API exists; this is the architecturally-equivalent reference).
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Database, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { SETTINGS_NAV } from '@/lib/navigation/settings';

interface SchemaEntry {
  key: string;
  label: string;
  description: string;
  shape: string;
  operations: string[];
  endpoints: { method: string; path: string; fn: string }[];
}

const SCHEMAS: SchemaEntry[] = [
  {
    key: 'crm_contacts',
    label: 'Contact',
    description: 'People and company contacts (Person/Company toggle).',
    operations: ['getContacts()', 'getContact(id)', 'saveContact(data)', 'deleteContact(id)', 'findDuplicateContacts(email, phone, excludeId?)'],
    endpoints: [
      { method: 'GET', path: '/contacts', fn: 'getContacts()' },
      { method: 'GET', path: '/contacts/:id', fn: 'getContact(id)' },
      { method: 'POST', path: '/contacts', fn: 'saveContact(data)' },
      { method: 'DELETE', path: '/contacts/:id', fn: 'deleteContact(id)' },
    ],
    shape: `{
  id: string,
  type: 'individual' | 'company',
  firstName: string, lastName: string,
  email: string,
  emails?: { email: string, type: string }[],
  phone?: string,
  phones?: { phone: string, type: string }[],
  companyId?: string, companyName?: string,
  jobTitle?: string, department?: string,
  website?: string, gstin?: string,
  addresses: { street?, city?, state?, postalCode?, country?, type }[],
  tags: string[],
  notes?: string,                  // HTML (rich text)
  assignedTo?: string,
  status: 'active' | 'archived',
  score: number,                   // 0-100
  parentContactId?: string,
  customFields?: { key, label, value }[],
  createdAt: ISO8601, updatedAt: ISO8601
}`,
  },
  {
    key: 'crm_opportunities',
    label: 'Opportunity',
    description: 'Deals in the sales pipeline.',
    operations: ['getOpportunities()', 'getOpportunity(id)', 'saveOpportunity(data)', 'updateOpportunityStage(id, stageId, stage)', 'deleteOpportunity(id)'],
    endpoints: [
      { method: 'GET', path: '/opportunities', fn: 'getOpportunities()' },
      { method: 'GET', path: '/opportunities/:id', fn: 'getOpportunity(id)' },
      { method: 'POST', path: '/opportunities', fn: 'saveOpportunity(data)' },
      { method: 'PATCH', path: '/opportunities/:id/stage', fn: 'updateOpportunityStage(id, stageId, stage)' },
      { method: 'DELETE', path: '/opportunities/:id', fn: 'deleteOpportunity(id)' },
    ],
    shape: `{
  id: string,
  name: string,
  contactId?, contactName, companyId?, companyName?,
  email?, phone?,
  pipelineId: string, stageId: string,
  stage: 'new' | 'qualified' | 'proposition' | 'won' | 'lost',
  expectedRevenue: number,
  probability: number,             // 0-100
  priority: 0 | 1 | 2 | 3,         // star rating
  expectedCloseDate: 'YYYY-MM-DD',
  assignedTo?: string, salesTeam?: string, teamId?: string,
  products: { id, productId, productName, quantity, unitPrice, discount, total }[],
  tags: string[],
  notes?: string, internalNotes?: string,
  lostReason?: string, wonAt?: ISO8601, lostAt?: ISO8601,
  createdAt, updatedAt
}`,
  },
  {
    key: 'crm_pipelines',
    label: 'Pipeline + Stages',
    description: 'Multiple pipelines, each with ordered stages.',
    operations: ['getPipelines()', 'getDefaultPipeline()', 'savePipeline(data)', 'deletePipeline(id)', 'setDefaultPipeline(id)'],
    endpoints: [
      { method: 'GET', path: '/pipelines', fn: 'getPipelines()' },
      { method: 'POST', path: '/pipelines', fn: 'savePipeline(data)' },
      { method: 'DELETE', path: '/pipelines/:id', fn: 'deletePipeline(id)' },
    ],
    shape: `{
  id: string,
  name: string, description?: string,
  isDefault: boolean,
  stages: {
    id, pipelineId, name,
    order: number, probability: number,
    color: 'hsl(...)' string
  }[],
  createdAt, updatedAt
}`,
  },
  {
    key: 'crm_activities',
    label: 'Activity',
    description: 'Calls, emails, meetings, tasks, notes attached to a CRM record.',
    operations: ['getActivities(relatedTo?, relatedId?)', 'saveActivity(data)', 'completeActivity(id)', 'deleteActivity(id)'],
    endpoints: [
      { method: 'GET', path: '/activities', fn: 'getActivities(relatedTo?, relatedId?)' },
      { method: 'POST', path: '/activities', fn: 'saveActivity(data)' },
      { method: 'PATCH', path: '/activities/:id/complete', fn: 'completeActivity(id)' },
      { method: 'DELETE', path: '/activities/:id', fn: 'deleteActivity(id)' },
    ],
    shape: `{
  id: string,
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'follow_up',
  subject: string, description?: string,
  relatedTo: 'contact' | 'company' | 'lead' | 'opportunity',
  relatedId: string,
  userId: string, userName: string,
  dueDate?: ISO8601, completed: boolean, completedAt?: ISO8601,
  priority?: 'low' | 'medium' | 'high' | 'urgent',
  createdAt, updatedAt
}`,
  },
  {
    key: 'crm_notes',
    label: 'Note',
    description: 'Rich-text discussion thread items (chatter). Supports mentions and base64 attachments.',
    operations: ['getNotes(relatedTo?, relatedId?)', 'saveNote(data)', 'deleteNote(id)'],
    endpoints: [
      { method: 'GET', path: '/notes', fn: 'getNotes(relatedTo?, relatedId?)' },
      { method: 'POST', path: '/notes', fn: 'saveNote(data)' },
      { method: 'DELETE', path: '/notes/:id', fn: 'deleteNote(id)' },
    ],
    shape: `{
  id: string,
  content: string,                 // HTML rich text
  relatedTo, relatedId, userId, userName,
  visibility: 'private' | 'team' | 'public',
  mentions?: string[],             // user IDs
  attachments?: { name, url, type }[],
  createdAt, updatedAt
}`,
  },
  {
    key: 'crm_tags',
    label: 'CRMTag',
    description: 'Reusable tags applied to contacts and opportunities.',
    operations: ['getTags()', 'saveTag(data)'],
    endpoints: [
      { method: 'GET', path: '/tags', fn: 'getTags()' },
      { method: 'POST', path: '/tags', fn: 'saveTag(data)' },
    ],
    shape: `{ id, name, color, category? }`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-success/15 text-success',
  POST: 'bg-info/15 text-info',
  PATCH: 'bg-warning/15 text-warning',
  DELETE: 'bg-destructive/15 text-destructive',
};

export default function CRMDataSchema() {
  const { toast } = useToast();

  const copyShape = (label: string, shape: string) => {
    navigator.clipboard.writeText(shape);
    toast({ title: `${label} interface copied` });
  };

  return (
    <AppLayout title="Settings" moduleNav={SETTINGS_NAV}>
      <div className="p-4 max-w-4xl space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-medium">CRM Data Schema</h1>
            <p className="text-sm text-muted-foreground">
              Reference for the CRM data model. All data is stored client-side in <code className="bg-muted px-1 py-0.5 rounded text-xs">localStorage</code>.
              No REST API exists — this page is the architecturally-equivalent contract.
            </p>
          </div>
        </div>

        <Card className="p-3 bg-muted/30 border-dashed">
          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <strong>Note:</strong> The keys below are prefixed with <code className="bg-muted px-1 rounded">erp_</code> in storage
              (e.g. <code className="bg-muted px-1 rounded">erp_crm_contacts</code>). Use the
              functions in <code className="bg-muted px-1 rounded">src/lib/data/crm.ts</code> rather than reading localStorage directly.
            </div>
          </div>
        </Card>

        {SCHEMAS.map(s => (
          <Card key={s.key} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-semibold text-foreground">{s.label}</h2>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">{s.key}</Badge>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Shape</div>
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => copyShape(s.label, s.shape)}>
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
              <pre className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto whitespace-pre">{s.shape}</pre>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Endpoints</div>
              <div className="space-y-1">
                {s.endpoints.map(ep => (
                  <div key={ep.path + ep.method} className="flex items-center gap-2 text-xs font-mono">
                    <Badge className={`${METHOD_COLORS[ep.method]} text-[10px] px-1.5 py-0 font-bold w-14 justify-center`}>{ep.method}</Badge>
                    <span className="text-foreground">/api/crm{ep.path}</span>
                    <span className="text-muted-foreground">→ {ep.fn}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Operations</div>
              <div className="flex flex-wrap gap-1.5">
                {s.operations.map(op => (
                  <code key={op} className="bg-primary/10 text-primary text-xs font-mono px-2 py-0.5 rounded">{op}</code>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
