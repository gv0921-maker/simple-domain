
-- Reusable updated_at trigger is public.update_updated_at_column() (already exists)

-- 1) APP_ROLES ---------------------------------------------------------------
CREATE TABLE public.app_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  inherits_from uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_roles TO authenticated;
GRANT ALL ON public.app_roles TO service_role;
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;

-- 2) APP_ROLE_PERMISSIONS ---------------------------------------------------
CREATE TABLE public.app_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.app_roles(id) ON DELETE CASCADE,
  module text NOT NULL,
  level text NOT NULL DEFAULT 'none' CHECK (level IN ('none','view','create','edit','delete','admin')),
  scope text NOT NULL DEFAULT 'all' CHECK (scope IN ('own','team','all')),
  can_import boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, module)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_role_permissions TO authenticated;
GRANT ALL ON public.app_role_permissions TO service_role;
ALTER TABLE public.app_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_arp_role ON public.app_role_permissions(role_id);

-- 3) APP_USER_ROLE_ASSIGNMENTS ---------------------------------------------
CREATE TABLE public.app_user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.app_roles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, role_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_role_assignments TO authenticated;
GRANT ALL ON public.app_user_role_assignments TO service_role;
ALTER TABLE public.app_user_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_aura_user ON public.app_user_role_assignments(user_id);
CREATE INDEX idx_aura_role ON public.app_user_role_assignments(role_id);

-- 4) APP_AUDIT_LOGS ---------------------------------------------------------
CREATE TABLE public.app_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  user_name text,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  details text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.app_audit_logs TO authenticated;
GRANT ALL ON public.app_audit_logs TO service_role;
ALTER TABLE public.app_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_aal_created ON public.app_audit_logs(created_at DESC);
CREATE INDEX idx_aal_user ON public.app_audit_logs(user_id);

-- Triggers ------------------------------------------------------------------
CREATE TRIGGER trg_app_roles_updated_at BEFORE UPDATE ON public.app_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_app_role_permissions_updated_at BEFORE UPDATE ON public.app_role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: is current user an admin (admin or super_admin role in legacy enum, OR holds Super Admin/Admin in new tables)
CREATE OR REPLACE FUNCTION public.is_app_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_any_role(_user_id, ARRAY['admin','super_admin']::app_role[])
    OR EXISTS (
      SELECT 1 FROM public.app_user_role_assignments a
      JOIN public.app_roles r ON r.id = a.role_id
      WHERE a.user_id = _user_id AND r.name IN ('Super Admin','Admin')
    );
$$;

-- POLICIES ------------------------------------------------------------------
-- app_roles: admins read/write; everyone authenticated may read (needed so UI can resolve permissions)
CREATE POLICY "app_roles_select_auth" ON public.app_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_roles_admin_write_insert" ON public.app_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "app_roles_admin_write_update" ON public.app_roles
  FOR UPDATE TO authenticated USING (public.is_app_admin(auth.uid())) WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "app_roles_admin_write_delete" ON public.app_roles
  FOR DELETE TO authenticated USING (public.is_app_admin(auth.uid()) AND is_system = false);

-- app_role_permissions: same pattern, readable by all authenticated
CREATE POLICY "arp_select_auth" ON public.app_role_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "arp_admin_insert" ON public.app_role_permissions
  FOR INSERT TO authenticated WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "arp_admin_update" ON public.app_role_permissions
  FOR UPDATE TO authenticated USING (public.is_app_admin(auth.uid())) WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "arp_admin_delete" ON public.app_role_permissions
  FOR DELETE TO authenticated USING (public.is_app_admin(auth.uid()));

-- app_user_role_assignments: user can read own; admins read all and manage
CREATE POLICY "aura_select_own_or_admin" ON public.app_user_role_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_app_admin(auth.uid()));
CREATE POLICY "aura_admin_insert" ON public.app_user_role_assignments
  FOR INSERT TO authenticated WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "aura_admin_update" ON public.app_user_role_assignments
  FOR UPDATE TO authenticated USING (public.is_app_admin(auth.uid())) WITH CHECK (public.is_app_admin(auth.uid()));
CREATE POLICY "aura_admin_delete" ON public.app_user_role_assignments
  FOR DELETE TO authenticated USING (public.is_app_admin(auth.uid()));

-- app_audit_logs: any authenticated user may insert; only admins may read
CREATE POLICY "aal_admin_select" ON public.app_audit_logs
  FOR SELECT TO authenticated USING (public.is_app_admin(auth.uid()));
CREATE POLICY "aal_auth_insert" ON public.app_audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- ===========================================================================
-- SEED DEFAULT ROLES + PERMISSIONS
-- ===========================================================================
DO $seed$
DECLARE
  all_modules text[] := ARRAY[
    'inventory','manufacturing','sales','crm','accounting','invoicing',
    'hr','projects','discuss','pos','settings','users','reports'
  ];
  m text;
  super_admin_id uuid;
  admin_id uuid;
  sales_mgr_id uuid;
  wh_op_id uuid;
  acct_id uuid;
  hr_mgr_id uuid;
  pos_op_id uuid;
  read_only_id uuid;
  first_user uuid;
BEGIN
  -- Roles
  INSERT INTO public.app_roles(name, description, is_system) VALUES
    ('Super Admin','Full system access with all permissions',true) RETURNING id INTO super_admin_id;
  INSERT INTO public.app_roles(name, description, is_system) VALUES
    ('Admin','Administrative access to most modules',true) RETURNING id INTO admin_id;
  INSERT INTO public.app_roles(name, description, is_system) VALUES
    ('Sales Manager','Manage sales team and CRM',true) RETURNING id INTO sales_mgr_id;
  INSERT INTO public.app_roles(name, description, is_system) VALUES
    ('Warehouse Operator','Manage inventory operations',true) RETURNING id INTO wh_op_id;
  INSERT INTO public.app_roles(name, description, is_system) VALUES
    ('Accountant','Handle financial operations',true) RETURNING id INTO acct_id;
  INSERT INTO public.app_roles(name, description, is_system) VALUES
    ('HR Manager','Manage employee records',true) RETURNING id INTO hr_mgr_id;
  INSERT INTO public.app_roles(name, description, is_system) VALUES
    ('POS Operator','Point of sale operations',true) RETURNING id INTO pos_op_id;
  INSERT INTO public.app_roles(name, description, is_system) VALUES
    ('Read Only','View-only access to all modules',true) RETURNING id INTO read_only_id;

  -- Super Admin: every module admin/all + import/export
  FOREACH m IN ARRAY all_modules LOOP
    INSERT INTO public.app_role_permissions(role_id, module, level, scope, can_import, can_export)
    VALUES (super_admin_id, m, 'admin','all', true, true);
  END LOOP;

  -- Admin: every module edit/all + import/export
  FOREACH m IN ARRAY all_modules LOOP
    INSERT INTO public.app_role_permissions(role_id, module, level, scope, can_import, can_export)
    VALUES (admin_id, m, 'edit','all', true, true);
  END LOOP;

  -- Sales Manager
  INSERT INTO public.app_role_permissions(role_id, module, level, scope, can_import, can_export) VALUES
    (sales_mgr_id,'sales','admin','all', true, true),
    (sales_mgr_id,'crm','edit','all', true, true),
    (sales_mgr_id,'inventory','view','all', false, true);

  -- Warehouse Operator
  INSERT INTO public.app_role_permissions(role_id, module, level, scope, can_import, can_export) VALUES
    (wh_op_id,'inventory','edit','all', false, true),
    (wh_op_id,'manufacturing','edit','all', false, true);

  -- Accountant
  INSERT INTO public.app_role_permissions(role_id, module, level, scope, can_import, can_export) VALUES
    (acct_id,'invoicing','admin','all', true, true),
    (acct_id,'accounting','admin','all', true, true),
    (acct_id,'sales','view','all', false, true);

  -- HR Manager
  INSERT INTO public.app_role_permissions(role_id, module, level, scope, can_import, can_export) VALUES
    (hr_mgr_id,'hr','admin','all', true, true);

  -- POS Operator
  INSERT INTO public.app_role_permissions(role_id, module, level, scope, can_import, can_export) VALUES
    (pos_op_id,'pos','edit','own', false, false),
    (pos_op_id,'sales','view','all', false, false);

  -- Read Only: every module view/all
  FOREACH m IN ARRAY all_modules LOOP
    INSERT INTO public.app_role_permissions(role_id, module, level, scope, can_import, can_export)
    VALUES (read_only_id, m, 'view','all', false, false);
  END LOOP;

  -- Auto-assign first user (oldest) to Super Admin
  SELECT id INTO first_user FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF first_user IS NOT NULL THEN
    INSERT INTO public.app_user_role_assignments(user_id, role_id, assigned_by)
    VALUES (first_user, super_admin_id, first_user)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Also grant legacy enum 'super_admin' so existing 40+ RLS policies recognize them
    INSERT INTO public.user_roles(user_id, role)
    VALUES (first_user, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END
$seed$;
