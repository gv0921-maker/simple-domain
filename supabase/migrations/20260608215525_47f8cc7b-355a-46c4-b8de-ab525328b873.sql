
-- Stock Reservations table linking Sales Orders to specific inventory (serials/lots)
CREATE TABLE public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  order_line_id uuid REFERENCES public.order_lines(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  serial_number_id uuid REFERENCES public.serial_numbers(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES public.lots(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','released','delivered')),
  reserved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_reservations TO authenticated;
GRANT ALL ON public.stock_reservations TO service_role;

ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view
CREATE POLICY "stock_reservations_select_auth"
ON public.stock_reservations FOR SELECT
TO authenticated
USING (true);

-- Any authenticated user can create reservations
CREATE POLICY "stock_reservations_insert_auth"
ON public.stock_reservations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only warehouse operators+ (admin, super_admin, warehouse_operator, sales_manager) can update (release)
CREATE POLICY "stock_reservations_update_warehouse"
ON public.stock_reservations FOR UPDATE
TO authenticated
USING (public.can_write_inventory())
WITH CHECK (public.can_write_inventory());

-- Only admins can delete
CREATE POLICY "stock_reservations_delete_admin"
ON public.stock_reservations FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE INDEX idx_stock_reservations_sales_order ON public.stock_reservations(sales_order_id);
CREATE INDEX idx_stock_reservations_product ON public.stock_reservations(product_id);
CREATE INDEX idx_stock_reservations_serial ON public.stock_reservations(serial_number_id);
CREATE INDEX idx_stock_reservations_status ON public.stock_reservations(status);

CREATE TRIGGER stock_reservations_updated_at
BEFORE UPDATE ON public.stock_reservations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
