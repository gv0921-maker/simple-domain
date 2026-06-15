// Universal import endpoint. Validates rows, performs upsert/insert,
// logs the operation to import_export_jobs.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ImportBody {
  module: string;
  table: string;
  upsertKey?: string;
  rows: Record<string, unknown>[];
  fileName?: string;
  options?: { dryRun?: boolean };
  /** Required column keys to validate server-side. */
  requiredFields?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const token = authHeader.replace('Bearer ', '');

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claims, error: cerr } = await userClient.auth.getClaims(token);
  if (cerr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = claims.claims.sub as string;

  let body: ImportBody;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.module || !body.table || !Array.isArray(body.rows)) {
    return new Response(JSON.stringify({ error: 'Missing module/table/rows' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Permission check: must have 'admin' OR 'super_admin' role.
  const { data: roles } = await admin
    .from('user_roles').select('role').eq('user_id', userId);
  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  if (!roleSet.has('admin') && !roleSet.has('super_admin')) {
    return new Response(JSON.stringify({ error: 'Forbidden: import requires admin role' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const errors: { row: number; message: string }[] = [];
  const validRows: Record<string, unknown>[] = [];
  const required = body.requiredFields ?? [];

  body.rows.forEach((row, i) => {
    const rowNum = i + 2;
    const missing = required.filter((k) => row[k] == null || row[k] === '');
    if (missing.length) {
      errors.push({ row: rowNum, message: `Missing required field(s): ${missing.join(', ')}` });
      return;
    }
    validRows.push(row);
  });

  let succeeded = 0;
  let failed = errors.length;

  if (!body.options?.dryRun && validRows.length) {
    // Allowed tables whitelist — extend as more modules onboard.
    const ALLOWED = new Set(['crm_contacts', 'crm_opportunities']);
    if (!ALLOWED.has(body.table)) {
      return new Response(JSON.stringify({ error: `Table "${body.table}" not allowed` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve crm_opportunities pipeline/stage if missing.
    if (body.table === 'crm_opportunities') {
      const { data: pipes } = await admin.from('crm_pipelines').select('id').limit(1);
      const pipelineId = pipes?.[0]?.id;
      const { data: stages } = await admin.from('crm_pipeline_stages').select('id, name');
      const stageByName = new Map<string, string>(
        (stages ?? []).map((s: { id: string; name: string }) => [s.name.toLowerCase(), s.id]),
      );
      for (const r of validRows) {
        if (!r.pipeline_id && pipelineId) r.pipeline_id = pipelineId;
        const stageName = String(r.stage ?? 'new').toLowerCase();
        if (!r.stage_id) r.stage_id = stageByName.get(stageName) ?? stages?.[0]?.id;
      }
    }

    // Batch upsert / insert. Per-row error isolation: try whole batch then fall back to per-row on failure.
    const upsertKey = body.upsertKey;
    const tryBatch = async (rows: Record<string, unknown>[]) => {
      if (upsertKey && upsertKey !== 'id') {
        return admin.from(body.table).upsert(rows, { onConflict: upsertKey });
      }
      return admin.from(body.table).insert(rows);
    };

    const { error: batchErr } = await tryBatch(validRows);
    if (!batchErr) {
      succeeded = validRows.length;
    } else {
      // Per-row retry to attribute failures.
      for (let i = 0; i < validRows.length; i++) {
        const { error } = await tryBatch([validRows[i]]);
        if (error) {
          failed++;
          errors.push({ row: i + 2, message: error.message });
        } else {
          succeeded++;
        }
      }
    }
  }

  const total = body.rows.length;
  const status = body.options?.dryRun ? 'validated' : (failed > 0 ? 'partial' : 'success');

  // Log job
  let jobId: string | null = null;
  if (!body.options?.dryRun) {
    const { data: job } = await admin
      .from('import_export_jobs')
      .insert([{
        user_id: userId,
        module: body.module,
        job_type: 'import',
        file_name: body.fileName ?? null,
        total_rows: total,
        succeeded_rows: succeeded,
        failed_rows: failed,
        error_log: errors,
        status,
        completed_at: new Date().toISOString(),
      }])
      .select('id').single();
    jobId = job?.id ?? null;

    // Activity log (best-effort)
    await admin.from('activity_log').insert([{
      changed_by: userId,
      action_type: 'import',
      record_type: body.module,
      record_id: jobId ?? '00000000-0000-0000-0000-000000000000',
      note_text: `Import: ${succeeded}/${total} succeeded, ${failed} failed${body.fileName ? ` (${body.fileName})` : ''}`,
    }]).then(() => null, () => null);
  }

  return new Response(JSON.stringify({
    total, succeeded, failed, errors, job_id: jobId, status,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});