// Calendar (.ics) export for CRM activities — generates iCalendar VEVENT objects
// Compatible with Google Calendar, Apple Calendar, Outlook
import type { Activity } from '@/lib/data/crm';

function toICSDate(iso: string, allDay = false): string {
  const d = new Date(iso);
  if (allDay) {
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  }
  return (
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}T` +
    `${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}Z`
  );
}

function escapeText(s: string): string {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function fold(line: string): string {
  // RFC 5545: lines should not exceed 75 octets; fold with CRLF + space.
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    parts.push((i === 0 ? '' : ' ') + line.slice(i, i + 73));
    i += 73;
  }
  return parts.join('\r\n');
}

export function activityToVEvent(activity: Activity): string {
  const start = activity.dueDate || activity.createdAt;
  const startDate = new Date(start);
  // Default 30-min meeting if no end specified
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  const lines = [
    'BEGIN:VEVENT',
    `UID:crm-activity-${activity.id}@glf-erp`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(startDate.toISOString())}`,
    `DTEND:${toICSDate(endDate.toISOString())}`,
    `SUMMARY:${escapeText(activity.subject)}`,
    activity.description ? `DESCRIPTION:${escapeText(activity.description.replace(/<[^>]+>/g, ''))}` : '',
    `STATUS:${activity.completed ? 'COMPLETED' : 'CONFIRMED'}`,
    `CATEGORIES:CRM,${activity.type.toUpperCase()}`,
    'END:VEVENT',
  ].filter(Boolean);
  return lines.map(fold).join('\r\n');
}

export function buildICS(activities: Activity[]): string {
  const events = activities.map(activityToVEvent).join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GLF ERP//CRM//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:GLF CRM Activities',
    events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(activities: Activity[], filename = 'crm-activities.ics'): void {
  const blob = new Blob([buildICS(activities)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Build a Google Calendar quick-add URL for a single activity
export function googleCalendarUrl(activity: Activity): string {
  const start = new Date(activity.dueDate || activity.createdAt);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: activity.subject,
    dates: `${toICSDate(start.toISOString())}/${toICSDate(end.toISOString())}`,
    details: (activity.description || '').replace(/<[^>]+>/g, ''),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
