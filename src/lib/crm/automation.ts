// Stage-based automation engine — runs hooks when an opportunity transitions stages.
// Hooks are stored on PipelineStage.automationHooks (string[] of hook IDs with optional config).
// Hook format: "hook_id" or "hook_id:json_config"

import {
  getPipeline,
  getOpportunity,
  saveOpportunity,
  saveActivity,
  type Opportunity,
  type PipelineStage,
} from '@/lib/data/crm';

export type AutomationHookId =
  | 'set_probability'
  | 'create_followup'
  | 'create_meeting'
  | 'send_internal_note'
  | 'mark_won'
  | 'request_lost_reason';

export interface AutomationHookDefinition {
  id: AutomationHookId;
  label: string;
  description: string;
  configurable?: { key: string; label: string; type: 'number' | 'text' | 'days' }[];
}

export const AUTOMATION_HOOKS: AutomationHookDefinition[] = [
  {
    id: 'set_probability',
    label: 'Set probability',
    description: 'Override the opportunity probability when entering this stage.',
    configurable: [{ key: 'value', label: 'Probability (%)', type: 'number' }],
  },
  {
    id: 'create_followup',
    label: 'Schedule follow-up task',
    description: 'Auto-create a follow-up task due in N days.',
    configurable: [{ key: 'days', label: 'Days from now', type: 'days' }],
  },
  {
    id: 'create_meeting',
    label: 'Schedule meeting',
    description: 'Auto-create a meeting activity due in N days.',
    configurable: [{ key: 'days', label: 'Days from now', type: 'days' }],
  },
  {
    id: 'send_internal_note',
    label: 'Add internal note',
    description: 'Append a templated internal note to the opportunity.',
    configurable: [{ key: 'text', label: 'Note text', type: 'text' }],
  },
  {
    id: 'mark_won',
    label: 'Mark as won',
    description: 'Automatically mark the opportunity as won and set probability to 100.',
  },
  {
    id: 'request_lost_reason',
    label: 'Tag as needs-review',
    description: 'Add a "needs-review" tag for follow-up.',
  },
];

interface ParsedHook {
  id: AutomationHookId;
  config: Record<string, string | number>;
}

export function parseHook(raw: string): ParsedHook | null {
  if (!raw) return null;
  const [id, configJson] = raw.split('::');
  if (!AUTOMATION_HOOKS.find(h => h.id === id)) return null;
  let config: Record<string, string | number> = {};
  if (configJson) {
    try { config = JSON.parse(configJson); } catch { /* ignore */ }
  }
  return { id: id as AutomationHookId, config };
}

export function serializeHook(id: AutomationHookId, config: Record<string, string | number> = {}): string {
  return Object.keys(config).length > 0 ? `${id}::${JSON.stringify(config)}` : id;
}

// Run all hooks attached to the new stage.
export function runStageHooks(opportunity: Opportunity, newStage: PipelineStage): Opportunity {
  if (!newStage.automationHooks?.length) return opportunity;
  let opp = opportunity;
  const updates: Partial<Opportunity> = {};

  for (const raw of newStage.automationHooks) {
    const hook = parseHook(raw);
    if (!hook) continue;

    switch (hook.id) {
      case 'set_probability': {
        const v = Number(hook.config.value);
        if (!Number.isNaN(v)) updates.probability = Math.max(0, Math.min(100, v));
        break;
      }
      case 'create_followup': {
        const days = Number(hook.config.days) || 3;
        const due = new Date(Date.now() + days * 86400000).toISOString();
        saveActivity({
          type: 'follow_up',
          subject: `Follow up on ${opp.name}`,
          relatedTo: 'opportunity',
          relatedId: opp.id,
          userId: opp.assignedTo || '',
          userName: 'Automation',
          dueDate: due,
          completed: false,
        });
        break;
      }
      case 'create_meeting': {
        const days = Number(hook.config.days) || 7;
        const due = new Date(Date.now() + days * 86400000).toISOString();
        saveActivity({
          type: 'meeting',
          subject: `Meeting: ${opp.name}`,
          relatedTo: 'opportunity',
          relatedId: opp.id,
          userId: opp.assignedTo || '',
          userName: 'Automation',
          dueDate: due,
          completed: false,
        });
        break;
      }
      case 'send_internal_note': {
        const text = String(hook.config.text || `Stage changed to ${newStage.name}`);
        const stamp = new Date().toLocaleString('en-IN');
        updates.internalNotes = [opp.internalNotes || '', `[Auto · ${stamp}] ${text}`].filter(Boolean).join('\n');
        break;
      }
      case 'mark_won': {
        updates.stage = 'won';
        updates.stageId = 'won';
        updates.probability = 100;
        updates.wonAt = new Date().toISOString();
        break;
      }
      case 'request_lost_reason': {
        updates.tags = [...(opp.tags || []), 'needs-review'].filter((t, i, a) => a.indexOf(t) === i);
        break;
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    return saveOpportunity({ ...opp, ...updates });
  }
  return opp;
}

// Helper: trigger automation by stage id
export function triggerStageAutomation(opportunityId: string, newStageId: string): Opportunity | undefined {
  const opp = getOpportunity(opportunityId);
  if (!opp) return undefined;
  const pipeline = getPipeline(opp.pipelineId);
  if (!pipeline) return opp;
  const stage = pipeline.stages.find(s => s.id === newStageId);
  if (!stage) return opp;
  return runStageHooks(opp, stage);
}
