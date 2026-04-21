// In-app notification system for CRM — localStorage based
import { getItem, setItem } from '@/lib/storage';
import { getActivities, type Activity } from '@/lib/data/crm';

export interface CRMNotification {
  id: string;
  type: 'reminder' | 'mention' | 'automation';
  title: string;
  description?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const KEY = 'crm_notifications';

export function getNotifications(): CRMNotification[] {
  return getItem<CRMNotification[]>(KEY, []);
}

export function addNotification(n: Omit<CRMNotification, 'id' | 'read' | 'createdAt'>): CRMNotification {
  const all = getNotifications();
  const entry: CRMNotification = {
    ...n,
    id: crypto.randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  all.unshift(entry);
  // Keep max 50
  if (all.length > 50) all.length = 50;
  setItem(KEY, all);
  return entry;
}

export function markRead(id: string) {
  const all = getNotifications();
  const n = all.find(x => x.id === id);
  if (n) { n.read = true; setItem(KEY, all); }
}

export function markAllRead() {
  const all = getNotifications();
  all.forEach(n => { n.read = true; });
  setItem(KEY, all);
}

export function dismissNotification(id: string) {
  setItem(KEY, getNotifications().filter(n => n.id !== id));
}

/** Generate reminder notifications for overdue / upcoming activities */
export function generateReminders() {
  const activities = getActivities();
  const existing = getNotifications();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  activities.forEach((a: Activity) => {
    if (a.completed || !a.dueDate) return;
    const due = new Date(a.dueDate).getTime();
    const isOverdue = due < now;
    const isUpcoming = !isOverdue && (due - now) < oneHour;
    if (!isOverdue && !isUpcoming) return;

    // Deduplicate by activity id
    const alreadyExists = existing.some(n => n.description === a.id);
    if (alreadyExists) return;

    addNotification({
      type: 'reminder',
      title: isOverdue ? `Overdue: ${a.subject}` : `Upcoming: ${a.subject}`,
      description: a.id, // used as dedup key
      link: a.relatedTo === 'opportunity' ? `/crm/opportunities/${a.relatedId}` : a.relatedTo === 'contact' ? `/crm/contacts/${a.relatedId}` : undefined,
    });
  });
}