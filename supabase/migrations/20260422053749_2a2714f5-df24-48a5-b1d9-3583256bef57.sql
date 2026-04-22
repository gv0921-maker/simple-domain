
-- 1. Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'sales_manager', 'sales_rep', 'readonly');

-- 2. Table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Functions (before policies that reference them)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- 4. user_roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Replace crm_contacts policies
DROP POLICY IF EXISTS "Authenticated users can create contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Authenticated users can delete contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.crm_contacts;

CREATE POLICY "Authenticated users can view contacts"
ON public.crm_contacts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authorized roles can create contacts"
ON public.crm_contacts FOR INSERT TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin', 'sales_manager', 'sales_rep']::public.app_role[])
);

CREATE POLICY "Owner or managers can update contacts"
ON public.crm_contacts FOR UPDATE TO authenticated
USING (
  assigned_to = auth.uid()::text
  OR public.has_any_role(auth.uid(), ARRAY['admin', 'sales_manager']::public.app_role[])
);

CREATE POLICY "Admins can delete contacts"
ON public.crm_contacts FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);
