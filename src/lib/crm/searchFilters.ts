// CRM Pipeline search/filter/group helpers — pure functions used by CRMSearchBar.
import type { Opportunity, Activity, Contact } from '@/lib/services/crm';

export interface ActiveFilter {
  type: 'filter' | 'groupBy' | 'favorite' | 'search';
  key: string;
  label: string;
  value?: string;
}

export interface FilterContext {
  userId?: string;
  userName?: string;
  activitiesByOpp: Record<string, Activity[]>;
  contactsById: Record<string, Contact>;
}

// ---------- date helpers ----------

export function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Infinity;
  return Math.floor((Date.now() - t) / 86400000);
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }
function startOfMonth(d: Date) { const x = startOfDay(d); x.setDate(1); return x; }
function startOfQuarter(d: Date) { const x = startOfMonth(d); x.setMonth(Math.floor(x.getMonth() / 3) * 3); return x; }
function startOfYear(d: Date) { const x = startOfMonth(d); x.setMonth(0); return x; }

export function isInDateRange(iso: string | undefined, token?: string): boolean {
  if (!iso || !token) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const now = new Date();
  let from = 0;
  switch (token) {
    case 'today': from = startOfDay(now).getTime(); break;
    case 'thisWeek': from = startOfWeek(now).getTime(); break;
    case 'thisMonth': from = startOfMonth(now).getTime(); break;
    case 'thisQuarter': from = startOfQuarter(now).getTime(); break;
    case 'thisYear': from = startOfYear(now).getTime(); break;
    default: return true;
  }
  return t >= from && t <= now.getTime() + 86400000 * 365; // open upper bound
}

// ---------- filter application ----------

function evalCustom(opp: Opportunity, payload?: string): boolean {
  if (!payload) return true;
  try {
    const { field, op, value } = JSON.parse(payload) as { field: string; op: string; value?: string };
    const raw = (opp as unknown as Record<string, unknown>)[field];
    const v = value ?? '';
    switch (op) {
      case 'isSet': return raw !== undefined && raw !== null && raw !== '';
      case 'isNotSet': return raw === undefined || raw === null || raw === '';
      case 'equals': return String(raw ?? '').toLowerCase() === v.toLowerCase();
      case 'contains': return String(raw ?? '').toLowerCase().includes(v.toLowerCase());
      case 'greaterThan': return Number(raw ?? 0) > Number(v);
      case 'lessThan': return Number(raw ?? 0) < Number(v);
      default: return true;
    }
  } catch {
    return true;
  }
}

function lastActivityISO(oppId: string, ctx: FilterContext): string | undefined {
  const list = ctx.activitiesByOpp[oppId];
  if (!list || !list.length) return undefined;
  return list.reduce<string | undefined>((acc, a) => {
    const ts = a.completedAt || a.createdAt;
    if (!acc || ts > acc) return ts;
    return acc;
  }, undefined);
}

function hasUnreadMessages(oppId: string, ctx: FilterContext): boolean {
  const list = ctx.activitiesByOpp[oppId] || [];
  if (!list.length) return false;
  const lastViewed = typeof window !== 'undefined' ? localStorage.getItem(`crm_last_viewed_${oppId}`) : null;
  if (!lastViewed) return true;
  return list.some(a => a.createdAt > lastViewed);
}

export function applyActiveFilters(
  opportunities: Opportunity[],
  activeFilters: ActiveFilter[],
  ctx: FilterContext,
  liveSearch?: string,
): Opportunity[] {
  let result = opportunities;

  const matchSearch = (o: Opportunity, q: string) => {
    const needle = q.toLowerCase();
    return (
      o.name.toLowerCase().includes(needle) ||
      String(o.expectedRevenue ?? '').includes(needle) ||
      (o.contactName?.toLowerCase().includes(needle) ?? false) ||
      (o.phone?.toLowerCase().includes(needle) ?? false) ||
      (o.companyName?.toLowerCase().includes(needle) ?? false)
    );
  };

  for (const f of activeFilters) {
    switch (f.key) {
      case 'myPipeline':
        result = result.filter(o => o.assignedTo && (o.assignedTo === ctx.userName || o.assignedTo === ctx.userId));
        break;
      case 'unassigned':
        result = result.filter(o => !o.assignedTo);
        break;
      case 'open':
      case 'ongoing':
        result = result.filter(o => o.stage !== 'won' && o.stage !== 'lost');
        break;
      case 'won':
        result = result.filter(o => o.stage === 'won');
        break;
      case 'lost':
        result = result.filter(o => o.stage === 'lost');
        break;
      case 'unreadMessages':
        result = result.filter(o => hasUnreadMessages(o.id, ctx));
        break;
      case 'rotting':
        result = result.filter(o => {
          const last = lastActivityISO(o.id, ctx) ?? o.updatedAt ?? o.createdAt;
          return daysSince(last) > 30 && o.stage !== 'won' && o.stage !== 'lost';
        });
        break;
      case 'creationDate':
        result = result.filter(o => isInDateRange(o.createdAt, f.value));
        break;
      case 'closeDate':
        result = result.filter(o => isInDateRange(o.expectedCloseDate, f.value));
        break;
      case 'search':
        if (f.value) result = result.filter(o => matchSearch(o, f.value!));
        break;
      case 'custom':
        result = result.filter(o => evalCustom(o, f.value));
        break;
      default:
        break;
    }
  }

  if (liveSearch && liveSearch.trim()) {
    result = result.filter(o => matchSearch(o, liveSearch.trim()));
  }

  return result;
}

// ---------- grouping ----------

function dateBucket(iso: string | undefined, period: string): string {
  if (!iso) return 'Undated';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Undated';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  switch (period) {
    case 'day': return d.toISOString().slice(0, 10);
    case 'week': {
      const s = startOfWeek(d);
      return `Week of ${s.toISOString().slice(0, 10)}`;
    }
    case 'month': return `${months[d.getMonth()]} ${d.getFullYear()}`;
    case 'quarter': return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
    case 'year': return String(d.getFullYear());
    default: return d.toISOString().slice(0, 10);
  }
}

export function groupOpportunities(
  opportunities: Opportunity[],
  groupBy: string | null,
  contactsById: Record<string, Contact>,
  stageNames?: Record<string, string>,
): { label: string; opps: Opportunity[] }[] | null {
  if (!groupBy) return null;

  const [base, period] = groupBy.split(':');
  const keyOf = (o: Opportunity): string => {
    switch (base) {
      case 'salesperson': return o.assignedTo || 'Unassigned';
      case 'salesTeam': return o.salesTeam || 'Unassigned';
      case 'stage': return stageNames?.[o.stageId] || o.stage || 'Unknown';
      case 'city': {
        const c = o.contactId ? contactsById[o.contactId] : undefined;
        return c?.addresses?.[0]?.city || 'Unknown';
      }
      case 'country': {
        const c = o.contactId ? contactsById[o.contactId] : undefined;
        return c?.addresses?.[0]?.country || 'Unknown';
      }
      case 'lostReason': return o.lostReason || '—';
      case 'source': return (o as unknown as { source?: string }).source || 'Unknown';
      case 'creationDate': return dateBucket(o.createdAt, period || 'month');
      case 'expectedClosing': return dateBucket(o.expectedCloseDate, period || 'month');
      case 'closedDate': return dateBucket(o.wonAt || o.lostAt, period || 'month');
      default: return 'Unknown';
    }
  };

  const groups: Record<string, Opportunity[]> = {};
  opportunities.forEach(o => {
    const k = keyOf(o);
    (groups[k] ||= []).push(o);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, opps]) => ({ label, opps }));
}

// ---------- saved searches ----------

export interface SavedSearch {
  id: string;
  name: string;
  filters: ActiveFilter[];
  groupBy: string | null;
  isDefault?: boolean;
  shared?: boolean;
  createdAt: string;
}

const SAVED_KEY = 'crm_saved_searches';

export function loadSavedSearches(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) as SavedSearch[] : [];
  } catch { return []; }
}

export function persistSavedSearches(list: SavedSearch[]): void {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* noop */ }
}

// ---------- preset bundles for built-in favorites ----------

export function presetFollowUp(): ActiveFilter[] {
  return [
    { type: 'favorite', key: 'open', label: 'Open Opportunities' },
    { type: 'favorite', key: 'creationDate', label: 'Created: Today', value: 'today' },
  ];
}

export function presetMonthlyReport(): ActiveFilter[] {
  return [
    { type: 'favorite', key: 'creationDate', label: 'Created: This Month', value: 'thisMonth' },
    { type: 'favorite', key: 'closeDate', label: 'Closing: This Month', value: 'thisMonth' },
  ];
}

export function presetWeeklyReport(): ActiveFilter[] {
  return [
    { type: 'favorite', key: 'creationDate', label: 'Created: This Week', value: 'thisWeek' },
    { type: 'favorite', key: 'closeDate', label: 'Closing: This Week', value: 'thisWeek' },
  ];
}
