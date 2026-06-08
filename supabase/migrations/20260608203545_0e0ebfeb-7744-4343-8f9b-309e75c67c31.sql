
-- 1. Product eligibility flags
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS warranty_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS factory_eligible boolean NOT NULL DEFAULT false;

-- 2. Invoice price approval status
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS price_approval_status text NOT NULL DEFAULT 'not_required';

-- 3. Invoice line approved price + notes
ALTER TABLE public.invoice_lines
  ADD COLUMN IF NOT EXISTS approved_price numeric,
  ADD COLUMN IF NOT EXISTS approval_notes text;

-- 4. Rename existing invoice type values: 'minimum' -> 'warranty', 'kh' -> 'factory'
UPDATE public.invoices SET type = 'warranty' WHERE type = 'minimum';
UPDATE public.invoices SET type = 'factory' WHERE type = 'kh';

-- 5. Update RLS for invoices to support type-aware rules
DROP POLICY IF EXISTS invoices_insert_admin ON public.invoices;
DROP POLICY IF EXISTS invoices_update_admin ON public.invoices;
DROP POLICY IF EXISTS invoices_delete_admin ON public.invoices;

CREATE POLICY invoices_insert ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    type IN ('warranty','factory') OR public.is_admin()
  );

CREATE POLICY invoices_update ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY invoices_delete ON public.invoices
  FOR DELETE TO authenticated
  USING (
    (type = 'regular' AND public.is_admin())
    OR (type IN ('warranty','factory') AND public.has_role(auth.uid(), 'super_admin'::public.app_role))
  );

-- 6. Mirror policies on invoice_lines
DROP POLICY IF EXISTS invoice_lines_insert_admin ON public.invoice_lines;
DROP POLICY IF EXISTS invoice_lines_update_admin ON public.invoice_lines;
DROP POLICY IF EXISTS invoice_lines_delete_admin ON public.invoice_lines;

CREATE POLICY invoice_lines_insert ON public.invoice_lines
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id
        AND (i.type IN ('warranty','factory') OR public.is_admin())
    )
  );

CREATE POLICY invoice_lines_update ON public.invoice_lines
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY invoice_lines_delete ON public.invoice_lines
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id
        AND (
          (i.type = 'regular' AND public.is_admin())
          OR (i.type IN ('warranty','factory') AND public.has_role(auth.uid(), 'super_admin'::public.app_role))
        )
    )
  );
