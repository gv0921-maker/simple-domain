// Rule-based lead scoring engine
import { getItem, setItem } from '@/lib/storage';
import type { Lead, LeadSource, LeadPriority } from '@/lib/data/crm';

export interface ScoringRule {
  id: string;
  field: 'source' | 'priority' | 'revenue' | 'hasPhone' | 'hasCompany';
  condition: string;
  points: number;
}

const DEFAULT_RULES: ScoringRule[] = [
  { id: '1', field: 'source', condition: 'referral', points: 20 },
  { id: '2', field: 'source', condition: 'website', points: 10 },
  { id: '3', field: 'source', condition: 'trade_show', points: 15 },
  { id: '4', field: 'priority', condition: 'urgent', points: 25 },
  { id: '5', field: 'priority', condition: 'high', points: 15 },
  { id: '6', field: 'priority', condition: 'medium', points: 5 },
  { id: '7', field: 'revenue', condition: '100000', points: 20 },
  { id: '8', field: 'revenue', condition: '50000', points: 10 },
  { id: '9', field: 'hasPhone', condition: 'true', points: 5 },
  { id: '10', field: 'hasCompany', condition: 'true', points: 5 },
];

export function getScoringRules(): ScoringRule[] {
  return getItem<ScoringRule[]>('crm_scoring_rules', DEFAULT_RULES);
}

export function saveScoringRules(rules: ScoringRule[]) {
  setItem('crm_scoring_rules', rules);
}

export interface ScoreBreakdown {
  rule: ScoringRule;
  matched: boolean;
}

export function calculateScore(lead: Lead): { score: number; breakdown: ScoreBreakdown[] } {
  const rules = getScoringRules();
  const breakdown: ScoreBreakdown[] = [];
  let score = 0;

  for (const rule of rules) {
    let matched = false;
    switch (rule.field) {
      case 'source':
        matched = lead.source === rule.condition;
        break;
      case 'priority':
        matched = lead.priority === rule.condition;
        break;
      case 'revenue':
        matched = lead.expectedRevenue >= Number(rule.condition);
        break;
      case 'hasPhone':
        matched = !!lead.phone;
        break;
      case 'hasCompany':
        matched = !!lead.companyName;
        break;
    }
    breakdown.push({ rule, matched });
    if (matched) score += rule.points;
  }

  return { score: Math.min(100, score), breakdown };
}