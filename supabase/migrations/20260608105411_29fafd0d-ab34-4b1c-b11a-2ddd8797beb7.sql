
-- =========================================================
-- Inventory module schema
-- =========================================================

-- ===== products =====
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'stockable' CHECK (type IN ('stockable','consumable','service')),
  category text NOT NULL DEFAULT '',
  unit_of_measure text NOT NULL DEFAULT 'unit',
  cost_method text NOT NULL DEFAULT 'average' CHECK (cost_method IN ('fifo','average','lifo')),
  cost_price numeric(14,2) NOT NULL DEFAULT 0,
  sale_price numeric(14,2) NOT NULL DEFAULT 0,
  stock_on_hand numeric(14,3) NOT NULL DEFAULT 0,
  reorder_level numeric(14,3) NOT NULL DEFAULT 0,
  barcode text,
  barcodes text[] NOT NULL DEFAULT '{}',
  track_inventory boolean NOT NULL DEFAULT true,
  track_lots boolean NOT NULL DEFAULT false,
  track_serials boolean NOT NULL DEFAULT false,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_location_id uuid,
  weight numeric(14,3),
  volume numeric(14,3),
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX products_barcode_unique ON public.products(barcode) WHERE barcode IS NOT NULL;

-- ===== warehouses =====
CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  default_receipt_location_id uuid,
  default_delivery_location_id uuid,
  default_internal_location_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== warehouse_locations =====
CREATE TABLE public.warehouse_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  parent_location_id uuid REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL,
  type text NOT NULL DEFAULT 'internal'
    CHECK (type IN ('internal','customer','vendor','transit','virtual','production')),
  is_active boolean NOT NULL DEFAULT true,
  barcode text,
  aisle text,
  shelf text,
  bin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (warehouse_id, code)
);

-- Now that warehouse_locations exists, add the soft references on products/warehouses
ALTER TABLE public.products
  ADD CONSTRAINT products_default_location_fk
  FOREIGN KEY (default_location_id) REFERENCES public.warehouse_locations(id) ON DELETE SET NULL;
ALTER TABLE public.warehouses
  ADD CONSTRAINT warehouses_default_receipt_fk
  FOREIGN KEY (default_receipt_location_id) REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  ADD CONSTRAINT warehouses_default_delivery_fk
  FOREIGN KEY (default_delivery_location_id) REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  ADD CONSTRAINT warehouses_default_internal_fk
  FOREIGN KEY (default_internal_location_id) REFERENCES public.warehouse_locations(id) ON DELETE SET NULL;

-- ===== lots =====
CREATE TABLE public.lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  name text NOT NULL,
  quantity numeric(14,3) NOT NULL DEFAULT 0,
  manufacturing_date date,
  expiration_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, name)
);

-- ===== serial_numbers =====
CREATE TABLE public.serial_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  lot_id uuid REFERENCES public.lots(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','reserved','sold','scrapped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, name)
);

-- ===== stock_moves =====
CREATE TABLE public.stock_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  operation_type text NOT NULL
    CHECK (operation_type IN ('receipt','delivery','internal','adjustment','production','return')),
  source_location_id uuid REFERENCES public.warehouse_locations(id) ON DELETE RESTRICT,
  source_location_name text,
  destination_location_id uuid REFERENCES public.warehouse_locations(id) ON DELETE RESTRICT,
  destination_location_name text,
  partner_id text,
  partner_name text,
  scheduled_date timestamptz NOT NULL DEFAULT now(),
  effective_date timestamptz,
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft','waiting','confirmed','assigned','done','cancelled')),
  source_document text,
  back_order_id uuid REFERENCES public.stock_moves(id) ON DELETE SET NULL,
  notes text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_moves_state_idx ON public.stock_moves(state);
CREATE INDEX stock_moves_operation_idx ON public.stock_moves(operation_type);

-- ===== stock_move_lines =====
CREATE TABLE public.stock_move_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_move_id uuid NOT NULL REFERENCES public.stock_moves(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  product_sku text NOT NULL,
  demand_qty numeric(14,3) NOT NULL DEFAULT 0,
  reserved_qty numeric(14,3) NOT NULL DEFAULT 0,
  done_qty numeric(14,3) NOT NULL DEFAULT 0,
  unit_of_measure text NOT NULL DEFAULT 'unit',
  lot_id uuid REFERENCES public.lots(id) ON DELETE SET NULL,
  lot_name text,
  serial_numbers text[] NOT NULL DEFAULT '{}',
  source_location_id uuid REFERENCES public.warehouse_locations(id) ON DELETE RESTRICT,
  destination_location_id uuid REFERENCES public.warehouse_locations(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_move_lines_move_idx ON public.stock_move_lines(stock_move_id);
CREATE INDEX stock_move_lines_product_idx ON public.stock_move_lines(product_id);

-- ===== transfers =====
CREATE TABLE public.transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  from_warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  to_warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  contact text,
  contact_phone text,
  operation_type text,
  source_location text,
  destination_location text,
  scheduled_date timestamptz NOT NULL DEFAULT now(),
  estimate_date timestamptz,
  state text NOT NULL DEFAULT 'draft'
    CHECK (state IN ('draft','waiting','ready','done','cancelled')),
  product_availability text NOT NULL DEFAULT 'not_available'
    CHECK (product_availability IN ('available','partial','not_available')),
  source_document text,
  back_order_of uuid REFERENCES public.transfers(id) ON DELETE SET NULL,
  notes text[] NOT NULL DEFAULT '{}',
  activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== transfer_lines =====
CREATE TABLE public.transfer_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES public.transfers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  demand_qty numeric(14,3) NOT NULL DEFAULT 0,
  done_qty numeric(14,3) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'unit',
  available boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transfer_lines_transfer_idx ON public.transfer_lines(transfer_id);

-- ===== reorder_rules =====
CREATE TABLE public.reorder_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  warehouse_name text NOT NULL,
  min_qty numeric(14,3) NOT NULL DEFAULT 0,
  max_qty numeric(14,3) NOT NULL DEFAULT 0,
  reorder_qty numeric(14,3) NOT NULL DEFAULT 0,
  lead_time_days integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== inventory_adjustments =====
CREATE TABLE public.inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  location_id uuid REFERENCES public.warehouse_locations(id) ON DELETE SET NULL,
  location_name text,
  reason text NOT NULL DEFAULT 'count'
    CHECK (reason IN ('count','damage','theft','expiry','correction','other')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','rejected','done')),
  notes text,
  created_by text,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== adjustment_lines =====
CREATE TABLE public.adjustment_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_id uuid NOT NULL REFERENCES public.inventory_adjustments(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  product_sku text NOT NULL,
  theoretical_qty numeric(14,3) NOT NULL DEFAULT 0,
  counted_qty numeric(14,3) NOT NULL DEFAULT 0,
  difference numeric(14,3) NOT NULL DEFAULT 0,
  lot_id uuid REFERENCES public.lots(id) ON DELETE SET NULL,
  serial_numbers text[] NOT NULL DEFAULT '{}',
  unit_cost numeric(14,2) NOT NULL DEFAULT 0,
  value_difference numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- updated_at triggers (reuse public.update_updated_at_column)
-- =========================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products','warehouses','warehouse_locations','lots','serial_numbers',
    'stock_moves','stock_move_lines','transfers','transfer_lines',
    'reorder_rules','inventory_adjustments','adjustment_lines'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
       t, t);
  END LOOP;
END$$;

-- =========================================================
-- Grants
-- =========================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.products, public.warehouses, public.warehouse_locations,
  public.lots, public.serial_numbers,
  public.stock_moves, public.stock_move_lines,
  public.transfers, public.transfer_lines,
  public.reorder_rules,
  public.inventory_adjustments, public.adjustment_lines
TO authenticated;

GRANT ALL ON
  public.products, public.warehouses, public.warehouse_locations,
  public.lots, public.serial_numbers,
  public.stock_moves, public.stock_move_lines,
  public.transfers, public.transfer_lines,
  public.reorder_rules,
  public.inventory_adjustments, public.adjustment_lines
TO service_role;

-- =========================================================
-- RLS: read-all-authenticated, admin-only mutations
-- =========================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products','warehouses','warehouse_locations','lots','serial_numbers',
    'stock_moves','stock_move_lines','transfers','transfer_lines',
    'reorder_rules','inventory_adjustments','adjustment_lines'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
      t || '_select_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())',
      t || '_insert_admin', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t || '_update_admin', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_admin())',
      t || '_delete_admin', t);
  END LOOP;
END$$;

-- =========================================================
-- RPC: validate a stock move atomically
-- =========================================================
CREATE OR REPLACE FUNCTION public.inv_validate_stock_move(_move_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state text;
  v_op text;
  v_line record;
  v_sign int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can validate stock moves';
  END IF;

  SELECT state, operation_type INTO v_state, v_op
  FROM public.stock_moves WHERE id = _move_id FOR UPDATE;

  IF v_state IS NULL THEN
    RAISE EXCEPTION 'Stock move % not found', _move_id;
  END IF;
  IF v_state NOT IN ('confirmed','assigned') THEN
    RAISE EXCEPTION 'Stock move % is in state % and cannot be validated', _move_id, v_state;
  END IF;

  v_sign := CASE WHEN v_op = 'receipt' THEN 1
                 WHEN v_op IN ('delivery','return') THEN -1
                 ELSE 0 END;

  FOR v_line IN
    SELECT product_id, done_qty FROM public.stock_move_lines WHERE stock_move_id = _move_id
  LOOP
    IF v_sign <> 0 AND v_line.done_qty <> 0 THEN
      UPDATE public.products
      SET stock_on_hand = stock_on_hand + (v_sign * v_line.done_qty),
          updated_at = now()
      WHERE id = v_line.product_id;
    END IF;
  END LOOP;

  UPDATE public.stock_moves
  SET state = 'done', effective_date = now(), updated_at = now()
  WHERE id = _move_id;
END;
$$;

-- =========================================================
-- RPC: approve an inventory adjustment atomically
-- =========================================================
CREATE OR REPLACE FUNCTION public.inv_approve_adjustment(_adjustment_id uuid, _approved_by text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_line record;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve adjustments';
  END IF;

  SELECT status INTO v_status
  FROM public.inventory_adjustments WHERE id = _adjustment_id FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Adjustment % not found', _adjustment_id;
  END IF;
  IF v_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Adjustment % is in status % and cannot be approved', _adjustment_id, v_status;
  END IF;

  FOR v_line IN
    SELECT product_id, difference FROM public.adjustment_lines WHERE adjustment_id = _adjustment_id
  LOOP
    IF v_line.difference <> 0 THEN
      UPDATE public.products
      SET stock_on_hand = stock_on_hand + v_line.difference,
          updated_at = now()
      WHERE id = v_line.product_id;
    END IF;
  END LOOP;

  UPDATE public.inventory_adjustments
  SET status = 'done',
      approved_by = _approved_by,
      approved_at = now(),
      updated_at = now()
  WHERE id = _adjustment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.inv_validate_stock_move(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inv_approve_adjustment(uuid, text) TO authenticated;
