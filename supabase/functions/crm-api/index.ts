import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

// Parse pagination & filter params
function parseQuery(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25")));
  const sortRaw = url.searchParams.get("sort") || "created_at";
  const order = url.searchParams.get("order") === "asc" ? true : false;
  const q = url.searchParams.get("q") || "";
  const offset = (page - 1) * limit;
  return { page, limit, sort: sortRaw, ascending: order, q, offset };
}

// Server-controlled fields that callers must never set directly.
const PROTECTED_FIELDS = new Set([
  "id", "created_at", "updated_at",
  "user_id", "user_name", "created_by", "updated_by",
  "converted_to_opportunity_id", "converted_at",
  "won_at", "lost_at",
]);

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body ?? {})) {
    if (PROTECTED_FIELDS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

// Allowlist of sortable / filterable columns per table.
const ALLOWED_COLS: Record<string, string[]> = {
  crm_contacts: ["created_at","updated_at","first_name","last_name","email","status","assigned_to","company_id"],
  crm_companies: ["created_at","updated_at","name","industry","assigned_to"],
  crm_leads: ["created_at","updated_at","title","status","assigned_to"],
  crm_opportunities: ["created_at","updated_at","name","stage","stage_id","pipeline_id","assigned_to","expected_revenue","probability"],
  crm_activities: ["created_at","updated_at","subject","type","completed","due_date","assigned_to"],
  crm_notes: ["created_at","updated_at","visibility"],
  crm_pipelines: ["created_at","name","is_default"],
  crm_pipeline_stages: ["created_at","name","order_index","pipeline_id"],
  crm_tags: ["created_at","name"],
  crm_audit_logs: ["created_at","action","resource"],
};

function logServerError(scope: string, e: unknown) {
  console.error(`[crm-api] ${scope}:`, e instanceof Error ? e.message : e);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return err("Unauthorized", 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: claimsData, error: claimsError } = await supabase.auth.getUser();
  if (claimsError || !claimsData?.user) {
    return err("Unauthorized", 401);
  }

  const url = new URL(req.url);
  // Path: /crm-api/contacts, /crm-api/contacts/:id, etc.
  const pathParts = url.pathname.replace(/^\/crm-api\/?/, "").split("/").filter(Boolean);
  const resource = pathParts[0] || "";
  const resourceId = pathParts[1] || "";
  const subAction = pathParts[2] || "";
  const method = req.method;

  // Map resource to table
  const tableMap: Record<string, string> = {
    contacts: "crm_contacts",
    companies: "crm_companies",
    leads: "crm_leads",
    opportunities: "crm_opportunities",
    activities: "crm_activities",
    notes: "crm_notes",
    pipelines: "crm_pipelines",
    stages: "crm_pipeline_stages",
    tags: "crm_tags",
    "audit-logs": "crm_audit_logs",
  };

  const table = tableMap[resource];
  if (!table) {
    return err(`Unknown resource: ${resource}`, 404);
  }

  // Search columns per table
  const searchCols: Record<string, string[]> = {
    crm_contacts: ["first_name", "last_name", "email", "phone", "company_name"],
    crm_companies: ["name", "email", "phone", "industry"],
    crm_leads: ["title", "contact_name", "email", "company_name"],
    crm_opportunities: ["name", "contact_name", "company_name"],
    crm_activities: ["subject", "description"],
    crm_notes: ["content"],
    crm_pipelines: ["name"],
    crm_pipeline_stages: ["name"],
    crm_tags: ["name"],
    crm_audit_logs: ["action", "resource", "details"],
  };

  try {
    // ── Special actions ──
    if (resource === "leads" && resourceId && subAction === "convert" && method === "POST") {
      // Get lead
      const { data: lead, error: le } = await supabase.from("crm_leads").select("*").eq("id", resourceId).single();
      if (le || !lead) return err("Lead not found", 404);
      // Create opportunity
      const body = sanitizeBody(await req.json().catch(() => ({})));
      const { data: pipeline } = await supabase.from("crm_pipelines").select("id").eq("is_default", true).single();
      const opp = {
        name: lead.title,
        contact_id: lead.contact_id,
        contact_name: lead.contact_name,
        company_id: lead.company_id,
        company_name: lead.company_name,
        email: lead.email,
        phone: lead.phone,
        expected_revenue: lead.expected_revenue,
        probability: lead.probability,
        pipeline_id: pipeline?.id,
        stage: "new",
        stage_id: "new",
        ...body,
      };
      const { data: newOpp, error: oe } = await supabase.from("crm_opportunities").insert(opp).select().single();
      if (oe) { logServerError("convert lead", oe); return err("Internal server error", 500); }
      // Update lead
      await supabase.from("crm_leads").update({
        status: "converted",
        converted_at: new Date().toISOString(),
        converted_to_opportunity_id: newOpp.id,
      }).eq("id", resourceId);
      return json({ lead: { ...lead, status: "converted" }, opportunity: newOpp }, 201);
    }

    if (resource === "activities" && resourceId && subAction === "complete" && method === "PATCH") {
      const { data, error: ue } = await supabase.from("crm_activities")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", resourceId).select().single();
      if (ue) { logServerError("complete activity", ue); return err("Internal server error", 500); }
      return json(data);
    }

    if (resource === "opportunities" && resourceId && subAction === "stage" && method === "PATCH") {
      const body = await req.json();
      const updates: Record<string, unknown> = { stage: body.stage, stage_id: body.stage_id || body.stage };
      if (body.stage === "won") { updates.won_at = new Date().toISOString(); updates.probability = 100; }
      if (body.stage === "lost") { updates.lost_at = new Date().toISOString(); updates.probability = 0; updates.lost_reason = body.lost_reason; }
      const { data, error: ue } = await supabase.from("crm_opportunities").update(updates).eq("id", resourceId).select().single();
      if (ue) { logServerError("opp stage", ue); return err("Internal server error", 500); }
      return json(data);
    }

    // ── Standard CRUD ──

    // GET list
    if (method === "GET" && !resourceId) {
      const { page, limit, sort, ascending, q, offset } = parseQuery(url);
      const allowedCols = ALLOWED_COLS[table] ?? ["created_at"];
      const safeSort = allowedCols.includes(sort) ? sort : "created_at";
      let query = supabase.from(table).select("*", { count: "exact" });

      // Apply filters from query params (allowlist only)
      for (const [key, value] of url.searchParams.entries()) {
        if (["page", "limit", "sort", "order", "q"].includes(key)) continue;
        if (!allowedCols.includes(key)) continue;
        query = query.eq(key, value);
      }

      // Text search
      if (q && searchCols[table]) {
        const orClause = searchCols[table].map(c => `${c}.ilike.%${q}%`).join(",");
        query = query.or(orClause);
      }

      query = query.order(safeSort, { ascending }).range(offset, offset + limit - 1);
      const { data, error: qe, count } = await query;
      if (qe) { logServerError("list", qe); return err("Internal server error", 500); }
      return json({
        data,
        pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
      });
    }

    // GET single
    if (method === "GET" && resourceId) {
      const { data, error: qe } = await supabase.from(table).select("*").eq("id", resourceId).single();
      if (qe) return err("Not found", 404);
      return json(data);
    }

    // POST create
    if (method === "POST") {
      const raw = await req.json();
      const body = sanitizeBody(raw);
      // Server-controlled identity fields
      if (["crm_notes","crm_activities","crm_audit_logs"].includes(table)) {
        (body as Record<string, unknown>).user_id = claimsData.user.id;
        (body as Record<string, unknown>).user_name = claimsData.user.email ?? "";
      }
      const { data, error: ie } = await supabase.from(table).insert(body).select().single();
      if (ie) { logServerError("insert", ie); return err("Internal server error", 500); }
      // Audit log
      await supabase.rpc("insert_audit_log", {
        
        _user_name: claimsData.user.email || "",
        _action: "create",
        _resource: table,
        _resource_id: data.id,
        _details: `Created ${resource} record`,
      });
      return json(data, 201);
    }

    // PATCH update
    if (method === "PATCH" && resourceId) {
      const body = sanitizeBody(await req.json());
      const { data, error: ue } = await supabase.from(table).update(body).eq("id", resourceId).select().single();
      if (ue) { logServerError("update", ue); return err("Internal server error", 500); }
      await supabase.rpc("insert_audit_log", {
        
        _user_name: claimsData.user.email || "",
        _action: "update",
        _resource: table,
        _resource_id: resourceId,
        _details: `Updated ${resource} record`,
      });
      return json(data);
    }

    // DELETE
    if (method === "DELETE" && resourceId) {
      if (table === "crm_audit_logs") return err("Audit logs cannot be deleted", 403);
      const { error: de } = await supabase.from(table).delete().eq("id", resourceId);
      if (de) { logServerError("delete", de); return err("Internal server error", 500); }
      await supabase.rpc("insert_audit_log", {
        
        _user_name: claimsData.user.email || "",
        _action: "delete",
        _resource: table,
        _resource_id: resourceId,
        _details: `Deleted ${resource} record`,
      });
      return json({ success: true });
    }

    return err("Method not allowed", 405);
  } catch (e) {
    logServerError("top-level", e);
    return err("Internal server error", 500);
  }
});