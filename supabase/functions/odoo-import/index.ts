import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type OdooBody = {
  odoo_url: string;
  db?: string;
  login?: string;
  api_key: string;
  model: "test" | "warehouses" | "products" | "stock" | "serials" | "customers" | "vendors";
  action: "test" | "import";
};

async function rpc(url: string, params: Record<string, unknown>) {
  const res = await fetch(`${url.replace(/\/$/, "")}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params, id: Date.now() }),
  });
  if (!res.ok) throw new Error(`Odoo HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error?.data?.message || data.error?.message || "Odoo RPC error");
  return data.result;
}

async function authenticate(url: string, db: string, login: string, key: string): Promise<number> {
  const uid = await rpc(url, {
    service: "common",
    method: "login",
    args: [db, login, key],
  });
  if (!uid) throw new Error("Authentication failed — check db, login, and API key");
  return Number(uid);
}

async function searchRead(
  url: string,
  db: string,
  uid: number,
  key: string,
  model: string,
  domain: unknown[],
  fields: string[],
  limit = 0,
) {
  return await rpc(url, {
    service: "object",
    method: "execute_kw",
    args: [db, uid, key, model, "search_read", [domain, fields], { limit }],
  });
}

async function searchCount(url: string, db: string, uid: number, key: string, model: string, domain: unknown[]) {
  return await rpc(url, {
    service: "object",
    method: "execute_kw",
    args: [db, uid, key, model, "search_count", [domain]],
  });
}

function svcClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function requireSuperAdmin(authHeader: string) {
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims) throw new Error("Unauthorized");
  const userId = data.claims.sub as string;
  const svc = svcClient();
  const { data: roles } = await svc.from("user_roles").select("role").eq("user_id", userId);
  const isSuper = (roles ?? []).some((r: { role: string }) => r.role === "super_admin" || r.role === "admin");
  if (!isSuper) throw new Error("Forbidden — super admin only");
  return userId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    await requireSuperAdmin(authHeader);

    const body = (await req.json()) as OdooBody;
    const { odoo_url, api_key, model, action } = body;
    const db = body.db || new URL(odoo_url).hostname.split(".")[0];
    const login = body.login || "admin";

    if (!odoo_url || !api_key) return json({ error: "Missing odoo_url or api_key" }, 400);

    const uid = await authenticate(odoo_url, db, login, api_key);

    if (action === "test") {
      const counts: Record<string, number> = {};
      const targets: Array<[string, string, unknown[]]> = [
        ["warehouses", "stock.warehouse", []],
        ["products", "product.template", [["sale_ok", "=", true]]],
        ["stock", "stock.quant", [["location_id.usage", "=", "internal"]]],
        ["serials", "stock.lot", []],
        ["customers", "res.partner", [["customer_rank", ">", 0]]],
        ["vendors", "res.partner", [["supplier_rank", ">", 0]]],
      ];
      for (const [key, m, domain] of targets) {
        try {
          counts[key] = await searchCount(odoo_url, db, uid, api_key, m, domain);
        } catch {
          counts[key] = 0;
        }
      }
      return json({ success: true, uid, counts });
    }

    if (action !== "import") return json({ error: "Invalid action" }, 400);

    const svc = svcClient();
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    if (model === "warehouses") {
      const rows = await searchRead(odoo_url, db, uid, api_key, "stock.warehouse", [], ["name", "code"]);
      for (const r of rows as Array<{ name: string; code: string }>) {
        if (!r.code) { skipped++; continue; }
        const { error } = await svc.from("warehouses").upsert(
          { name: r.name, code: r.code, is_active: true },
          { onConflict: "code" },
        );
        if (error) { errors.push(`${r.code}: ${error.message}`); skipped++; } else imported++;
      }
    } else if (model === "products") {
      const rows = await searchRead(odoo_url, db, uid, api_key, "product.template", [], [
        "name", "default_code", "barcode", "categ_id", "list_price", "standard_price", "description", "active", "type",
      ]);
      const typeMap: Record<string, string> = { product: "stockable", consu: "consumable", service: "service" };
      for (const r of rows as Array<Record<string, unknown>>) {
        const sku = (r.default_code as string) || `ODOO-${r.id}`;
        const categ = Array.isArray(r.categ_id) ? (r.categ_id as unknown[])[1] : null;
        const { error } = await svc.from("products").upsert(
          {
            sku,
            name: r.name as string,
            type: typeMap[r.type as string] || "stockable",
            category: (categ as string) || "General",
            unit_of_measure: "Unit",
            cost_method: "standard",
            cost_price: Number(r.standard_price) || 0,
            sale_price: Number(r.list_price) || 0,
            stock_on_hand: 0,
            reorder_level: 0,
            barcode: (r.barcode as string) || null,
            description: (r.description as string) || null,
            is_active: Boolean(r.active),
          },
          { onConflict: "sku" },
        );
        if (error) { errors.push(`${sku}: ${error.message}`); skipped++; } else imported++;
      }
    } else if (model === "customers" || model === "vendors") {
      const rank = model === "customers" ? "customer_rank" : "supplier_rank";
      const rows = await searchRead(
        odoo_url, db, uid, api_key, "res.partner",
        [[rank, ">", 0]],
        ["name", "email", "phone", "street", "city", "zip", "vat"],
      );
      const target = model === "customers" ? "customers" : "suppliers";
      for (const r of rows as Array<Record<string, unknown>>) {
        const email = (r.email as string) || null;
        if (!email) { skipped++; continue; }
        const address = [r.street, r.city, r.zip].filter(Boolean).join(", ");
        const payload = model === "customers"
          ? { name: r.name as string, email, phone: (r.phone as string) || null, address, gstin: (r.vat as string) || null, type: "individual", is_active: true, tags: [] as string[] }
          : { name: r.name as string, email, phone: (r.phone as string) || null, address, city: (r.city as string) || null, zip: (r.zip as string) || null, gstin: (r.vat as string) || null, is_active: true };
        const { error } = await svc.from(target).upsert(payload, { onConflict: "email" });
        if (error) { errors.push(`${email}: ${error.message}`); skipped++; } else imported++;
      }
    } else if (model === "serials") {
      const rows = await searchRead(odoo_url, db, uid, api_key, "stock.lot", [], ["name", "product_id", "ref"]);
      for (const r of rows as Array<Record<string, unknown>>) {
        const name = r.name as string;
        const prodTuple = r.product_id as unknown[];
        const prodName = Array.isArray(prodTuple) ? (prodTuple[1] as string) : null;
        if (!name || !prodName) { skipped++; continue; }
        const { data: prod } = await svc.from("products").select("id").eq("name", prodName).maybeSingle();
        if (!prod?.id) { skipped++; continue; }
        const { error } = await svc.from("serial_numbers").upsert(
          { name, product_id: prod.id, status: "available" },
          { onConflict: "name" },
        );
        if (error) { errors.push(`${name}: ${error.message}`); skipped++; } else imported++;
      }
    } else if (model === "stock") {
      const rows = await searchRead(
        odoo_url, db, uid, api_key, "stock.quant",
        [["location_id.usage", "=", "internal"]],
        ["product_id", "location_id", "quantity", "reserved_quantity"],
      );
      for (const r of rows as Array<Record<string, unknown>>) {
        const qty = Number(r.quantity) || 0;
        if (qty === 0) { skipped++; continue; }
        const prodTuple = r.product_id as unknown[];
        const locTuple = r.location_id as unknown[];
        const prodName = Array.isArray(prodTuple) ? (prodTuple[1] as string) : null;
        const locName = Array.isArray(locTuple) ? (locTuple[1] as string) : "Odoo Import";
        if (!prodName) { skipped++; continue; }
        const { data: prod } = await svc.from("products").select("id, stock_on_hand").eq("name", prodName).maybeSingle();
        if (!prod?.id) { skipped++; continue; }
        const ref = `ODOO/OPEN/${prod.id.slice(0, 8)}/${Date.now()}`;
        const { error: mErr } = await svc.from("stock_moves").insert({
          reference: ref,
          operation_type: "receipt",
          destination_location_name: locName,
          scheduled_date: new Date().toISOString(),
          effective_date: new Date().toISOString(),
          state: "done",
          source_document: "Odoo Import — Opening Stock",
          notes: `Imported from Odoo. Reserved: ${r.reserved_quantity ?? 0}`,
        });
        if (mErr) { errors.push(`stock ${ref}: ${mErr.message}`); skipped++; continue; }
        await svc.from("products").update({ stock_on_hand: Number(prod.stock_on_hand || 0) + qty }).eq("id", prod.id);
        imported++;
      }
    } else {
      return json({ error: `Unknown model ${model}` }, 400);
    }

    return json({ success: true, model, imported_count: imported, skipped_count: skipped, errors });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ success: false, error: message }, 500);
  }
});