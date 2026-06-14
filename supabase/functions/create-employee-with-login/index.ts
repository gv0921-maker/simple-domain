import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function genTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out + '!2';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = claims.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);

    // Authorization: caller must be super_admin or hr_manager.
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);
    const callerRoles = (roles ?? []).map((r: any) => r.role);
    if (!callerRoles.some((r: string) => r === 'super_admin' || r === 'hr_manager')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      employee_data,
      default_password,
      role = 'employee',
    }: {
      employee_data: Record<string, unknown>;
      default_password?: string;
      role?: string;
    } = body ?? {};

    if (!employee_data || typeof employee_data !== 'object') {
      return new Response(JSON.stringify({ error: 'employee_data required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const email = (employee_data as any).email as string | undefined;
    if (!email) {
      return new Response(JSON.stringify({ error: 'email required on employee_data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tempPassword = default_password && default_password.length >= 8
      ? default_password
      : genTempPassword();

    // 1. Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { password_must_change: true },
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? 'auth user create failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authUserId = created.user.id;

    // 2. Insert employee row with auth linkage
    const { data: emp, error: empErr } = await admin
      .from('employees')
      .insert({ ...employee_data, auth_user_id: authUserId })
      .select('id')
      .single();
    if (empErr || !emp) {
      // best-effort: roll back auth user so we don't orphan
      await admin.auth.admin.deleteUser(authUserId).catch(() => {});
      return new Response(JSON.stringify({ error: empErr?.message ?? 'employee insert failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Assign role
    await admin.from('user_roles').insert({ user_id: authUserId, role });

    return new Response(JSON.stringify({
      employee_id: emp.id,
      auth_user_id: authUserId,
      login_email: email,
      temporary_password: tempPassword,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});