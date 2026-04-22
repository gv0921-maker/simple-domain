

# Plan: Complete 6 Remaining CRM Module Items

## Overview

Implement the 6 incomplete CRM requirements: Supabase database schema, REST API via Edge Functions, unit tests, integration tests, performance tests, and user/admin documentation.

---

## Item 1: Database Schema with Indexes (Supabase Migration)

Create a single migration that mirrors the existing localStorage data model into normalized Supabase tables.

**Tables to create:**
- `crm_contacts` — all contact fields including type (individual/company), emails/phones as JSONB arrays, addresses as JSONB, custom_fields as JSONB, tags as text array
- `crm_companies` — name, website, industry, employee_count, annual_revenue, addresses JSONB, parent_company_id (self-ref), tags
- `crm_leads` — title, contact_id (FK), email, phone, source enum, status enum, priority enum, score, expected_revenue, probability, assigned_to, team_id, tags, lost_reason
- `crm_opportunities` — name, contact_id (FK), pipeline_id (FK), stage_id, stage enum, expected_revenue, probability, priority, expected_close_date, products JSONB, tags, lost_reason, won_at, lost_at
- `crm_pipelines` — name, description, is_default boolean
- `crm_pipeline_stages` — pipeline_id (FK), name, order, probability, color, automation_hooks JSONB
- `crm_activities` — type enum, subject, description, related_to enum, related_id UUID, user_id, due_date, completed boolean, completed_at, priority enum, mentions JSONB
- `crm_notes` — content (HTML), related_to, related_id, user_id, visibility enum, mentions JSONB, attachments JSONB
- `crm_tags` — name, color, category
- `crm_audit_logs` — user_id, user_name, action, resource, resource_id, details, timestamp

**Indexes on:**
- `crm_contacts`: email, phone, assigned_to, status, created_at
- `crm_leads`: email, assigned_to, status, source, created_at
- `crm_opportunities`: stage, assigned_to, pipeline_id, expected_close_date, created_at
- `crm_activities`: related_to + related_id, user_id, due_date, completed
- `crm_notes`: related_to + related_id

**Enums to create:** contact_type, contact_status, lead_source, lead_priority, lead_status, opportunity_stage, activity_type, note_visibility

**RLS policies:** All tables will have RLS enabled. Authenticated users can read all records; create/update/delete restricted to authenticated users. The `crm_audit_logs` table is insert-only for authenticated, select for admins.

**Triggers:** `update_updated_at_column()` on all tables with updated_at.

---

## Item 2: REST API + OpenAPI Spec (Edge Functions)

Create Supabase Edge Functions that expose RESTful endpoints for all CRM entities.

**Edge Function: `crm-api`** (single function, route-based)

Endpoints:
- `GET/POST /contacts`, `GET/PATCH/DELETE /contacts/:id`
- `GET/POST /companies`, `GET/PATCH/DELETE /companies/:id`
- `GET/POST /leads`, `GET/PATCH/DELETE /leads/:id`, `POST /leads/:id/convert`
- `GET/POST /opportunities`, `GET/PATCH/DELETE /opportunities/:id`, `PATCH /opportunities/:id/stage`
- `GET/POST /activities`, `PATCH /activities/:id/complete`, `DELETE /activities/:id`
- `GET/POST /notes`, `DELETE /notes/:id`
- `GET/POST /pipelines`, `DELETE /pipelines/:id`
- `GET /tags`, `POST /tags`

Features per endpoint:
- Pagination (`?page=1&limit=25`)
- Filtering (`?status=active&assigned_to=xxx`)
- Search (`?q=search_term`)
- Sorting (`?sort=created_at&order=desc`)
- JWT auth validation — role-aware responses based on user permissions

**Edge Function: `crm-openapi`**

Returns a complete OpenAPI 3.0 JSON spec documenting all endpoints, request/response schemas, authentication requirements, and query parameters. Accessible at `/crm-openapi`.

**Update CRMDataSchema.tsx** to link to the live OpenAPI spec and show the real API endpoints instead of localStorage references.

---

## Item 3: Unit Tests

Create test files using Vitest (already configured):

**`src/test/crm/crm-data.test.ts`** — CRM logic unit tests:
- Contact CRUD: create, read, update, delete
- Duplicate detection: by email, by phone, exclusion logic
- Lead CRUD and status transitions
- Lead scoring calculation (rule matching, score aggregation)
- Opportunity CRUD, stage update logic (won sets probability=100, lost sets probability=0)
- Pipeline CRUD, default pipeline logic, deletion guards
- Activity CRUD, completion logic
- Note CRUD with visibility
- Tag CRUD
- Analytics: getCRMStats, getLeadsBySource, getOpportunitiesByStage
- Import contacts: success, duplicate detection, field mapping

**`src/test/crm/crm-audit.test.ts`** — Audit logging:
- Verify logCRM creates entries
- Verify all CRUD operations produce audit logs

**`src/test/crm/crm-permissions.test.ts`** — Permission logic:
- hasPermission checks per level
- Record scope filtering (own vs all)
- Field masking (maskEmail, maskPhone, maskRevenue)
- canViewSensitive by permission level

---

## Item 4: Integration Tests

**`src/test/crm/crm-integration.test.ts`**:
- Lead → Opportunity conversion: create lead, convert, verify opportunity fields, verify lead status = converted
- Pipeline stage changes: create opportunity, move through stages, verify probability updates, verify won/lost timestamps
- Permission-gated operations: verify scope filtering returns correct records
- Contact-Lead linking: create lead with email, verify auto-created contact, verify contactId linkage
- CRM backup/restore cycle: export, import, verify data integrity

---

## Item 5: Performance Tests

**`src/test/crm/crm-performance.test.ts`**:
- **10k+ contacts**: generate 10,000 contacts, measure getContacts() time (target: < 500ms), measure findDuplicateContacts time, measure importContacts with 1,000 records
- **50k+ activities**: generate 50,000 activities, measure getActivities() time, measure filtered getActivities(relatedTo, relatedId) time
- **Analytics at scale**: with 10k contacts and 5k opportunities, measure getCRMStats(), getOpportunitiesByStage(), getLeadsBySource() performance
- Use `performance.now()` for timing, assert reasonable thresholds

---

## Item 6: User & Admin Documentation

Generate two DOCX documents to `/mnt/documents/`:

**`crm-user-guide.docx`** — Step-by-step workflow guide:
1. Logging in and navigating to CRM
2. Managing Contacts (create, edit, archive, duplicate detection)
3. Managing Leads (create, qualify, convert to opportunity)
4. Pipeline & Opportunities (Kanban view, drag-drop, stage transitions, win/loss)
5. Activities & Timeline (scheduling calls/meetings, completing tasks, ICS export)
6. Notes & Communication (rich text, @mentions, attachments, visibility)
7. Search & Filtering (global search, pipeline filters, group-by)
8. Import/Export (CSV import with field mapping, CSV export)
9. Analytics Dashboard (date filters, user filters, chart widgets)
10. Notifications (bell icon, reminders, automation alerts)

**`crm-admin-guide.docx`** — Administration reference:
1. Role management (CRM Admin, Sales Manager, Sales Rep, Read-only)
2. Permission levels (View/Create/Edit/Delete/Admin)
3. Record scope configuration (Own/Team/All)
4. Field-level masking (sensitive field visibility)
5. Pipeline configuration (multi-pipeline, stages, automation hooks)
6. Backup & restore (encrypted export/import)
7. Audit logs (viewing, filtering, interpreting)
8. CRM Data Schema / API reference

---

## Execution Order

1. **Database migration** — Create all tables, enums, indexes, RLS, triggers
2. **Edge Functions** — `crm-api` + `crm-openapi`, update CRMDataSchema.tsx
3. **Unit tests** — 3 test files covering data, audit, permissions
4. **Integration tests** — 1 test file covering cross-feature flows
5. **Performance tests** — 1 test file with scale benchmarks
6. **Documentation** — 2 DOCX files generated to /mnt/documents/

**Estimated new files:** ~8 (migration, 2 edge functions, 5 test files, 2 docs)
**Estimated edited files:** ~2 (CRMDataSchema.tsx, App.tsx or config)

