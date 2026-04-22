const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPEC = {
  openapi: "3.0.3",
  info: {
    title: "GLF ERP — CRM API",
    version: "1.0.0",
    description: "RESTful API for the CRM module of GLF ERP. All endpoints require Bearer token authentication via Supabase Auth.",
  },
  servers: [{ url: "https://mdtwvuiakvxoqvksemyt.supabase.co/functions/v1/crm-api" }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    parameters: {
      page: { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
      limit: { name: "limit", in: "query", schema: { type: "integer", default: 25, maximum: 100 }, description: "Items per page" },
      sort: { name: "sort", in: "query", schema: { type: "string", default: "created_at" }, description: "Sort column" },
      order: { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sort direction" },
      q: { name: "q", in: "query", schema: { type: "string" }, description: "Full-text search query" },
      id: { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "Record UUID" },
    },
    schemas: {
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
        },
      },
      Contact: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["individual", "company"] },
          first_name: { type: "string" }, last_name: { type: "string" },
          email: { type: "string" }, phone: { type: "string" },
          emails: { type: "array", items: { type: "object" } },
          phones: { type: "array", items: { type: "object" } },
          company_id: { type: "string", format: "uuid", nullable: true },
          company_name: { type: "string" },
          job_title: { type: "string" }, department: { type: "string" },
          website: { type: "string" }, gstin: { type: "string" },
          addresses: { type: "array", items: { type: "object" } },
          tags: { type: "array", items: { type: "string" } },
          notes: { type: "string" }, assigned_to: { type: "string" },
          status: { type: "string", enum: ["active", "archived"] },
          score: { type: "integer" },
          parent_contact_id: { type: "string", format: "uuid", nullable: true },
          custom_fields: { type: "array", items: { type: "object" } },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Company: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          website: { type: "string" }, industry: { type: "string" },
          employee_count: { type: "string" },
          annual_revenue: { type: "number" },
          phone: { type: "string" }, email: { type: "string" },
          addresses: { type: "array", items: { type: "object" } },
          parent_company_id: { type: "string", format: "uuid", nullable: true },
          tags: { type: "array", items: { type: "string" } },
          notes: { type: "string" }, assigned_to: { type: "string" },
          status: { type: "string", enum: ["active", "archived"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Lead: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" }, contact_name: { type: "string" },
          email: { type: "string" }, phone: { type: "string" },
          source: { type: "string", enum: ["website","referral","social_media","trade_show","cold_call","email_campaign","import","manual","other"] },
          status: { type: "string", enum: ["new","contacted","qualified","unqualified","converted","lost"] },
          priority: { type: "string", enum: ["low","medium","high","urgent"] },
          score: { type: "integer" },
          expected_revenue: { type: "number" },
          probability: { type: "integer" },
          assigned_to: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Opportunity: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          contact_name: { type: "string" }, company_name: { type: "string" },
          pipeline_id: { type: "string", format: "uuid" },
          stage_id: { type: "string" },
          stage: { type: "string", enum: ["new","qualified","proposition","won","lost"] },
          expected_revenue: { type: "number" },
          probability: { type: "integer" },
          priority: { type: "integer" },
          expected_close_date: { type: "string", format: "date" },
          products: { type: "array", items: { type: "object" } },
          tags: { type: "array", items: { type: "string" } },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Activity: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["call","email","meeting","task","note","follow_up"] },
          subject: { type: "string" }, description: { type: "string" },
          related_to: { type: "string" }, related_id: { type: "string", format: "uuid" },
          user_id: { type: "string" }, user_name: { type: "string" },
          due_date: { type: "string", format: "date-time", nullable: true },
          completed: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Note: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          content: { type: "string" },
          related_to: { type: "string" }, related_id: { type: "string", format: "uuid" },
          visibility: { type: "string", enum: ["private","team","public"] },
          mentions: { type: "array", items: { type: "string" } },
          attachments: { type: "array", items: { type: "object" } },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Pipeline: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" }, description: { type: "string" },
          is_default: { type: "boolean" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      Tag: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" }, color: { type: "string" },
          category: { type: "string" },
        },
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
  paths: {} as Record<string, unknown>,
};

// Generate CRUD paths for each resource
function crudPaths(resource: string, schema: string, searchable: boolean) {
  const tag = resource.charAt(0).toUpperCase() + resource.slice(1);
  const base: Record<string, unknown> = {};
  const listPath = `/${resource}`;
  const itemPath = `/${resource}/{id}`;

  base[listPath] = {
    get: {
      tags: [tag], summary: `List ${resource}`, operationId: `list${tag}`,
      parameters: [
        { $ref: "#/components/parameters/page" },
        { $ref: "#/components/parameters/limit" },
        { $ref: "#/components/parameters/sort" },
        { $ref: "#/components/parameters/order" },
        ...(searchable ? [{ $ref: "#/components/parameters/q" }] : []),
      ],
      responses: {
        "200": { description: "Paginated list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: `#/components/schemas/${schema}` } }, pagination: { $ref: "#/components/schemas/Pagination" } } } } } },
        "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      },
    },
    post: {
      tags: [tag], summary: `Create ${resource.slice(0, -1)}`, operationId: `create${tag}`,
      requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } } },
      responses: {
        "201": { description: "Created", content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } } },
      },
    },
  };

  base[itemPath] = {
    get: {
      tags: [tag], summary: `Get ${resource.slice(0, -1)} by ID`, operationId: `get${tag}ById`,
      parameters: [{ $ref: "#/components/parameters/id" }],
      responses: {
        "200": { description: "Record", content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } } },
        "404": { description: "Not found" },
      },
    },
    patch: {
      tags: [tag], summary: `Update ${resource.slice(0, -1)}`, operationId: `update${tag}`,
      parameters: [{ $ref: "#/components/parameters/id" }],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${schema}` } } } },
      responses: { "200": { description: "Updated" } },
    },
    delete: {
      tags: [tag], summary: `Delete ${resource.slice(0, -1)}`, operationId: `delete${tag}`,
      parameters: [{ $ref: "#/components/parameters/id" }],
      responses: { "200": { description: "Deleted" } },
    },
  };

  return base;
}

// Build paths
const allPaths: Record<string, unknown> = {};
Object.assign(allPaths, crudPaths("contacts", "Contact", true));
Object.assign(allPaths, crudPaths("companies", "Company", true));
Object.assign(allPaths, crudPaths("leads", "Lead", true));
Object.assign(allPaths, crudPaths("opportunities", "Opportunity", true));
Object.assign(allPaths, crudPaths("activities", "Activity", true));
Object.assign(allPaths, crudPaths("notes", "Note", false));
Object.assign(allPaths, crudPaths("pipelines", "Pipeline", false));
Object.assign(allPaths, crudPaths("tags", "Tag", false));

// Special endpoints
allPaths["/leads/{id}/convert"] = {
  post: {
    tags: ["Leads"], summary: "Convert lead to opportunity", operationId: "convertLead",
    parameters: [{ $ref: "#/components/parameters/id" }],
    responses: { "201": { description: "Converted" } },
  },
};
allPaths["/opportunities/{id}/stage"] = {
  patch: {
    tags: ["Opportunities"], summary: "Update opportunity stage", operationId: "updateStage",
    parameters: [{ $ref: "#/components/parameters/id" }],
    requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { stage: { type: "string" }, stage_id: { type: "string" }, lost_reason: { type: "string" } } } } } },
    responses: { "200": { description: "Stage updated" } },
  },
};
allPaths["/activities/{id}/complete"] = {
  patch: {
    tags: ["Activities"], summary: "Mark activity as complete", operationId: "completeActivity",
    parameters: [{ $ref: "#/components/parameters/id" }],
    responses: { "200": { description: "Completed" } },
  },
};

SPEC.paths = allPaths;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return new Response(JSON.stringify(SPEC, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});