

# Plan: Complete 8 Remaining CRM Features

## Overview

8 actionable items across Sections B, C, and D. All client-side / localStorage — no backend required.

**Note on Leads:** Leads UI was previously removed per project memory ("permanently removed to streamline CRM"). This plan re-adds it as the spec explicitly requires it. The project memory will be updated.

---

## 1. Leads UI (Section B — re-add)

**Create:** `src/pages/crm/CRMLeadsList.tsx`, `src/pages/crm/LeadDetail.tsx`
**Edit:** `src/App.tsx` (routes), `src/lib/navigation/crm.ts` (add "Leads" tab)

- List view with table, search, filters (status, source, priority), bulk delete
- Detail page: lead info, score, status workflow, activity timeline, notes via RichComposer
- Reuses existing `getLeads()`, `saveLead()`, `deleteLead()`, `convertLeadToOpportunity()` from `crm.ts`

---

## 2. Rule-based Lead Scoring (Section B)

**Create:** `src/lib/crm/leadScoring.ts`
**Edit:** `src/lib/data/crm.ts` (auto-apply on save), LeadDetail (show breakdown)

- Configurable rules in localStorage: source weight, priority weight, revenue thresholds
- Auto-recalculate on lead save; manual override preserved
- Score breakdown panel on LeadDetail

---

## 3. Lead Qualification Workflow UI (Section B)

**In:** LeadDetail page (built in step 1)

- Status workflow bar: New → Contacted → Qualified → Convert (or → Unqualified / Lost)
- Each transition calls `updateLeadStatus()`
- "Convert to Opportunity" appears only when qualified, gated by `canConvertLeads`

---

## 4. Stage-based Automation Hooks UI (Section C)

**Edit:** `src/pages/settings/CRMPipelinesSettings.tsx`

- Expandable section per stage showing `automationHooks[]`
- Predefined hook options (checkboxes): "Send notification", "Create follow-up activity", "Update probability", "Assign to team"
- Saved to stage's `automationHooks` field; fires toast notifications when opportunities move to that stage

---

## 5. Reminder Notifications — In-app Bell (Section D)

**Create:** `src/components/layout/NotificationsBell.tsx`, `src/lib/crm/notifications.ts`
**Edit:** `src/components/layout/TopNav.tsx` (add bell)

- localStorage notification store: types = `reminder`, `mention`, `automation`
- Activities with approaching/overdue `dueDate` auto-generate reminders on load
- Bell icon in TopNav with unread count badge, dropdown with dismiss/mark-all-read
- @mention notifications created from RichComposer mentions

---

## 6. Email Composer Dialog (Section D)

**Create:** `src/components/crm/EmailComposerDialog.tsx`
**Edit:** OpportunityDetail, CRMContactDetail (add "Send Email" action)

- Dialog with To (pre-filled), Subject, Body (RichTextEditor), attachments
- "Send" logs an activity of type `email` to the CRM timeline with toast confirmation
- No actual email — localStorage-only, activity serves as the email record

---

## 7. Calendar Sync / ICS Download (Section D)

**Create:** `src/lib/crm/ics.ts`
**Edit:** OpportunityDetail, CRMContactDetail (download button on meeting activities)

- Generate standard `.ics` VCALENDAR/VEVENT from activity data
- Download button next to meeting-type activities in the timeline
- Compatible with Google Calendar, Outlook, Apple Calendar

---

## 8. OpenAPI-style Data Schema Enhancement (Section 6)

**Edit:** `src/pages/settings/CRMDataSchema.tsx`

- Pseudo-REST endpoint badges (GET, POST, DELETE) per entity
- Collapsible JSON request/response examples
- "Copy interface" button per entity
- Swagger-like visual styling with method color badges

---

## Execution Order

Build in 3 passes:
1. **Utilities first:** Notifications system (5), ICS helper (7) — independent, no UI deps
2. **Leads suite:** Leads list + detail + scoring + qualification (1, 2, 3) — tightly coupled
3. **Remaining:** Automation hooks (4), Email composer (6), Data Schema (8) — independent

Estimated: ~8 new files, ~8 edited files

