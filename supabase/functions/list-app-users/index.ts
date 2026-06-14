import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);

    // Authorization: caller must be super_admin or admin.
    const { data: callerRoles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);
    const roleNames = (callerRoles ?? []).map((r: any) => r.role);
    if (!roleNames.some((r: string) => r === 'super_admin' || r === 'admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // List all auth users (paginate up to 1000 — enough for current scale).
    const { data: usersPage, error: usersErr } =
      await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersErr) {
      return new Response(JSON.stringify({ error: 'Failed to list users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load all assignments + roles in two queries.
    const [assignsRes, rolesRes] = await Promise.all([
      admin.from('app_user_role_assignments').select('user_id, role_id'),
      admin.from('app_roles').select('id, name'),
    ]);
    const roleMap = new Map<string, string>();
    for (const r of rolesRes.data ?? []) roleMap.set(r.id, r.name);
    const assignsByUser = new Map<string, { id: string; name: string }[]>();
    for (const a of assignsRes.data ?? []) {
      const name = roleMap.get(a.role_id);
      if (!name) continue;
      const arr = assignsByUser.get(a.user_id) ?? [];
      arr.push({ id: a.role_id, name });
      assignsByUser.set(a.user_id, arr);
    }

    const result = (usersPage.users ?? []).map((u: any) => ({
      user_id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned_until: u.banned_until ?? null,
      roles: assignsByUser.get(u.id) ?? [],
    }));

    return new Response(JSON.stringify({ users: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});