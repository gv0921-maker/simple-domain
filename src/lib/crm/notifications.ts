// In-app reminder/notification engine — surfaces overdue & due-today CRM activities.
import { getActivities, type Activity } from '@/lib/data/crm';
import { getItem, setItem } from '@/lib/storage';

const DISMISSED_KEY = 'crm_dismissed_reminders';

export interface ReminderItem {
  activity: Activity;
  status: 'overdue' | 'today' | 'upcoming';
}

function getDismissed(): Set<string> {
  return new Set(getItem<string[]>(DISMISSED_KEY, []));
}

export function dismissReminder(activityId: string): void {
  const set = getDismissed();
  set.add(activityId);
  setItem(DISMISSED_KEY, Array.from(set));
}

export function clearDismissed(): void {
  setItem(DISMISSED_KEY, []);
}

export function getReminders(userId?: string): ReminderItem[] {
  const dismissed = getDismissed();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 86400000;
  const weekEnd = todayStart + 7 * 86400000;

  return getActivities()
    .filter(a => !a.completed && a.dueDate && !dismissed.has(a.id))
    .filter(a => !userId || !a.userId || a.userId === userId)
    .map<ReminderItem>(a => {
      const due = new Date(a.dueDate!).getTime();
      let status: 'overdue' | 'today' | 'upcoming';
      if (due < todayStart) status = 'overdue';
      else if (due < todayEnd) status = 'today';
      else status = 'upcoming';
      return { activity: a, status };
    })
    .filter(r => new Date(r.activity.dueDate!).getTime() <= weekEnd)
    .sort((a, b) => new Date(a.activity.dueDate!).getTime() - new Date(b.activity.dueDate!).getTime());
}

export function getReminderCount(userId?: string): number {
  return getReminders(userId).filter(r => r.status !== 'upcoming').length;
}
