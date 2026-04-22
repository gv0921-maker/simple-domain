// TODO: Replace localStorage with Supabase queries
// ICS calendar file generator for CRM meeting activities
import type { Activity } from '@/lib/data/crm';

function icsDate(d: string): string {
  return new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateICS(activity: Activity): string {
  const start = activity.dueDate || activity.createdAt;
  const endDate = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GLF ERP//CRM//EN',
    'BEGIN:VEVENT',
    `UID:${activity.id}@glf-erp`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(endDate)}`,
    `SUMMARY:${activity.subject}`,
    `DESCRIPTION:${(activity.description || '').replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(activity: Activity) {
  const content = generateICS(activity);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activity.subject.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}