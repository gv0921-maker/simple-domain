
-- 1. notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  category text NOT NULL CHECK (category IN ('sales','inventory','manufacturing','hr','returns','chat','system','vendor_orders')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent','high','normal','low')),
  title text NOT NULL,
  body text NOT NULL,
  link_url text,
  related_entity_type text,
  related_entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_notif_recipient_unread ON public.notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_category ON public.notifications(category, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_select_own ON public.notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY notif_update_own ON public.notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid()) WITH CHECK (recipient_user_id = auth.uid());
CREATE POLICY notif_delete_own ON public.notifications
  FOR DELETE TO authenticated USING (recipient_user_id = auth.uid());

-- 2. notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled boolean NOT NULL DEFAULT true,
  browser_push_enabled boolean NOT NULL DEFAULT false,
  browser_push_subscription jsonb,
  categories_enabled jsonb NOT NULL DEFAULT '["sales","inventory","manufacturing","hr","returns","chat","system","vendor_orders"]'::jsonb,
  chat_sound_enabled boolean NOT NULL DEFAULT true,
  chat_sound_url text NOT NULL DEFAULT '/sounds/chat-notification.mp3',
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY np_own ON public.notification_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Helpers
CREATE OR REPLACE FUNCTION public.get_users_with_role(_role app_role)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.user_roles WHERE role = _role
$$;

CREATE OR REPLACE FUNCTION public.get_workflow_recipients(p_so_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT uid FROM (
    SELECT created_by AS uid FROM public.sales_orders WHERE id = p_so_id AND created_by IS NOT NULL
    UNION SELECT public.get_users_with_role('sales_manager')
    UNION SELECT public.get_users_with_role('admin')
    UNION SELECT public.get_users_with_role('super_admin')
  ) x WHERE uid IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.get_warehouse_recipients()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT uid FROM (
    SELECT public.get_users_with_role('warehouse_operator') AS uid
    UNION SELECT public.get_users_with_role('admin')
    UNION SELECT public.get_users_with_role('super_admin')
  ) x WHERE uid IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.get_hr_recipients()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT uid FROM (
    SELECT public.get_users_with_role('hr_manager') AS uid
    UNION SELECT public.get_users_with_role('super_admin')
  ) x WHERE uid IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.get_factory_recipients()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT uid FROM (
    SELECT public.get_users_with_role('factory_incharge') AS uid
    UNION SELECT public.get_users_with_role('admin')
    UNION SELECT public.get_users_with_role('super_admin')
  ) x WHERE uid IS NOT NULL
$$;

-- 4. Core creators
CREATE OR REPLACE FUNCTION public.create_app_notification(
  p_recipient uuid, p_type text, p_category text, p_priority text,
  p_title text, p_body text,
  p_link text DEFAULT NULL, p_entity_type text DEFAULT NULL, p_entity_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_prefs record; v_now_local time; v_skip boolean := false;
BEGIN
  IF p_recipient IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO v_prefs FROM public.notification_preferences WHERE user_id = p_recipient;
  IF FOUND THEN
    IF NOT v_prefs.in_app_enabled THEN RETURN NULL; END IF;
    IF NOT (v_prefs.categories_enabled ? p_category) THEN RETURN NULL; END IF;
    IF v_prefs.quiet_hours_start IS NOT NULL AND v_prefs.quiet_hours_end IS NOT NULL
       AND p_priority NOT IN ('urgent','high') THEN
      v_now_local := (now() AT TIME ZONE 'Asia/Kolkata')::time;
      IF v_prefs.quiet_hours_start <= v_prefs.quiet_hours_end THEN
        v_skip := v_now_local >= v_prefs.quiet_hours_start AND v_now_local < v_prefs.quiet_hours_end;
      ELSE
        v_skip := v_now_local >= v_prefs.quiet_hours_start OR v_now_local < v_prefs.quiet_hours_end;
      END IF;
      IF v_skip THEN RETURN NULL; END IF;
    END IF;
  END IF;
  INSERT INTO public.notifications (
    recipient_user_id, notification_type, category, priority, title, body,
    link_url, related_entity_type, related_entity_id
  ) VALUES (p_recipient, p_type, p_category, COALESCE(p_priority,'normal'), p_title, p_body, p_link, p_entity_type, p_entity_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.broadcast_app_notification(
  p_recipients uuid[], p_type text, p_category text, p_priority text,
  p_title text, p_body text,
  p_link text DEFAULT NULL, p_entity_type text DEFAULT NULL, p_entity_id uuid DEFAULT NULL
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r uuid; n integer := 0;
BEGIN
  FOREACH r IN ARRAY COALESCE(p_recipients, ARRAY[]::uuid[]) LOOP
    IF public.create_app_notification(r, p_type, p_category, p_priority, p_title, p_body, p_link, p_entity_type, p_entity_id) IS NOT NULL THEN
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  UPDATE public.notifications SET is_read = true, read_at = now()
  WHERE id = p_id AND recipient_user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  WITH upd AS (
    UPDATE public.notifications SET is_read = true, read_at = now()
    WHERE recipient_user_id = auth.uid() AND is_read = false RETURNING 1
  ) SELECT count(*) INTO n FROM upd;
  RETURN n;
END $$;

-- 5. Workflow triggers
CREATE OR REPLACE FUNCTION public.tg_notify_sales_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[]; v_ref text := COALESCE(NEW.reference, NEW.id::text);
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT array_agg(uid) INTO v_recipients FROM public.get_workflow_recipients(NEW.id) uid;
    PERFORM public.broadcast_app_notification(v_recipients, 'so_created', 'sales', 'normal',
      'New Sales Order ' || v_ref, 'A new sales order has been created.',
      '/sales/orders/' || NEW.id, 'sales_order', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.status,'') IS DISTINCT FROM COALESCE(OLD.status,'') THEN
    SELECT array_agg(uid) INTO v_recipients FROM public.get_workflow_recipients(NEW.id) uid;
    IF NEW.status = 'confirmed' THEN
      v_recipients := (SELECT array_agg(DISTINCT u) FROM unnest(v_recipients || ARRAY(SELECT public.get_warehouse_recipients())) u);
      PERFORM public.broadcast_app_notification(v_recipients, 'so_confirmed', 'sales', 'high',
        'SO ' || v_ref || ' confirmed', 'Sales order confirmed and ready for fulfillment.',
        '/sales/orders/' || NEW.id, 'sales_order', NEW.id);
    ELSIF NEW.status = 'ready_to_invoice' THEN
      PERFORM public.broadcast_app_notification(v_recipients, 'so_ready_invoice', 'sales', 'high',
        'SO ' || v_ref || ' ready to invoice', 'Sales order is ready to be invoiced.',
        '/sales/orders/' || NEW.id, 'sales_order', NEW.id);
    ELSIF NEW.status IN ('closed','completed') THEN
      PERFORM public.broadcast_app_notification(v_recipients, 'so_closed', 'sales', 'normal',
        'SO ' || v_ref || ' closed', 'Sales order has been closed.',
        '/sales/orders/' || NEW.id, 'sales_order', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_sales_order ON public.sales_orders;
CREATE TRIGGER trg_notify_sales_order AFTER INSERT OR UPDATE ON public.sales_orders
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_sales_order();

CREATE OR REPLACE FUNCTION public.tg_notify_so_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[]; v_ref text;
BEGIN
  SELECT reference INTO v_ref FROM public.sales_orders WHERE id = NEW.sales_order_id;
  SELECT array_agg(uid) INTO v_recipients FROM public.get_workflow_recipients(NEW.sales_order_id) uid;
  PERFORM public.broadcast_app_notification(v_recipients, 'payment_recorded', 'sales', 'normal',
    'Payment recorded for ' || COALESCE(v_ref, NEW.sales_order_id::text),
    'A payment of ₹' || COALESCE(NEW.amount::text,'?') || ' has been recorded.',
    '/sales/orders/' || NEW.sales_order_id, 'sales_order', NEW.sales_order_id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_so_payment ON public.sales_order_payments;
CREATE TRIGGER trg_notify_so_payment AFTER INSERT ON public.sales_order_payments
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_so_payment();

CREATE OR REPLACE FUNCTION public.tg_notify_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[];
BEGIN
  IF NEW.sales_order_id IS NOT NULL THEN
    SELECT array_agg(uid) INTO v_recipients FROM public.get_workflow_recipients(NEW.sales_order_id) uid;
  ELSE
    SELECT array_agg(uid) INTO v_recipients FROM (
      SELECT public.get_users_with_role('accountant') uid
      UNION SELECT public.get_users_with_role('super_admin')
    ) x;
  END IF;
  PERFORM public.broadcast_app_notification(v_recipients, 'invoice_created', 'sales', 'normal',
    'Invoice ' || COALESCE(NEW.reference, NEW.id::text) || ' created',
    'A new invoice has been generated.',
    '/invoicing/invoices/' || NEW.id, 'invoice', NEW.id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_invoice ON public.invoices;
CREATE TRIGGER trg_notify_invoice AFTER INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_invoice();

CREATE OR REPLACE FUNCTION public.tg_notify_delivery_note()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[];
BEGIN
  SELECT array_agg(uid) INTO v_recipients FROM (SELECT public.get_warehouse_recipients() uid) x;
  PERFORM public.broadcast_app_notification(v_recipients, 'dn_created', 'inventory', 'normal',
    'Delivery Note created', 'A new delivery note is ready for scan and dispatch.',
    '/inventory/delivery-notes/' || NEW.id, 'delivery_note', NEW.id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_delivery_note ON public.delivery_notes;
CREATE TRIGGER trg_notify_delivery_note AFTER INSERT ON public.delivery_notes
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_delivery_note();

CREATE OR REPLACE FUNCTION public.tg_notify_goods_receipt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[];
BEGIN
  IF (TG_OP = 'UPDATE' AND COALESCE(NEW.status,'') <> COALESCE(OLD.status,'') AND NEW.status IN ('completed','received'))
     OR (TG_OP = 'INSERT' AND NEW.status IN ('completed','received')) THEN
    SELECT array_agg(uid) INTO v_recipients FROM (
      SELECT public.get_users_with_role('sales_manager') uid
      UNION SELECT public.get_users_with_role('super_admin')
    ) x;
    PERFORM public.broadcast_app_notification(v_recipients, 'gr_completed', 'inventory', 'normal',
      'Goods Receipt completed', 'A goods receipt has been completed.',
      '/inventory/goods-receipts/' || NEW.id, 'goods_receipt', NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_goods_receipt ON public.goods_receipts;
CREATE TRIGGER trg_notify_goods_receipt AFTER INSERT OR UPDATE ON public.goods_receipts
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_goods_receipt();

CREATE OR REPLACE FUNCTION public.tg_notify_work_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[]; v_ref text := COALESCE(NEW.wo_number, NEW.id::text);
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT array_agg(uid) INTO v_recipients FROM (
      SELECT public.get_users_with_role('admin') uid
      UNION SELECT public.get_users_with_role('super_admin')
    ) x;
    PERFORM public.broadcast_app_notification(v_recipients, 'wo_created', 'manufacturing', 'normal',
      'Work Order ' || v_ref || ' submitted', 'A new work order has been submitted for approval.',
      '/manufacturing/work-orders/' || NEW.id, 'work_order', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.current_stage,'') IS DISTINCT FROM COALESCE(OLD.current_stage,'') THEN
    SELECT array_agg(uid) INTO v_recipients FROM (SELECT public.get_factory_recipients() uid) x;
    PERFORM public.broadcast_app_notification(v_recipients, 'wo_stage_change', 'manufacturing', 'normal',
      'WO ' || v_ref || ' → ' || NEW.current_stage, 'Work order stage updated.',
      '/manufacturing/work-orders/' || NEW.id, 'work_order', NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_work_order ON public.work_orders;
CREATE TRIGGER trg_notify_work_order AFTER INSERT OR UPDATE ON public.work_orders
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_work_order();

CREATE OR REPLACE FUNCTION public.tg_notify_vendor_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[]; v_ref text := COALESCE(NEW.vo_number, NEW.id::text);
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT array_agg(uid) INTO v_recipients FROM (SELECT public.get_users_with_role('super_admin') uid) x;
    PERFORM public.broadcast_app_notification(v_recipients, 'vo_submitted', 'vendor_orders', 'normal',
      'Vendor Order ' || v_ref || ' submitted', 'A vendor order needs approval.',
      '/vendor-orders/' || NEW.id, 'vendor_order', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.status,'') IS DISTINCT FROM COALESCE(OLD.status,'') THEN
    IF NEW.status = 'approved' THEN
      SELECT array_agg(uid) INTO v_recipients FROM (SELECT public.get_warehouse_recipients() uid) x;
      PERFORM public.broadcast_app_notification(v_recipients, 'vo_approved', 'vendor_orders', 'normal',
        'Vendor Order ' || v_ref || ' approved', 'Expect incoming receipt soon.',
        '/vendor-orders/' || NEW.id, 'vendor_order', NEW.id);
    ELSIF NEW.status IN ('received','partial_received') THEN
      SELECT array_agg(uid) INTO v_recipients FROM (SELECT public.get_users_with_role('super_admin') uid) x;
      PERFORM public.broadcast_app_notification(v_recipients, 'vo_received', 'vendor_orders', 'normal',
        'Vendor Order ' || v_ref || ' received', 'Vendor order has been received.',
        '/vendor-orders/' || NEW.id, 'vendor_order', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_vendor_order ON public.vendor_orders;
CREATE TRIGGER trg_notify_vendor_order AFTER INSERT OR UPDATE ON public.vendor_orders
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_vendor_order();

CREATE OR REPLACE FUNCTION public.tg_notify_leave_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[]; v_applicant uuid;
BEGIN
  SELECT user_id INTO v_applicant FROM public.employees WHERE id = NEW.employee_id;
  IF TG_OP = 'INSERT' THEN
    SELECT array_agg(uid) INTO v_recipients FROM (SELECT public.get_users_with_role('super_admin') uid) x;
    PERFORM public.broadcast_app_notification(v_recipients, 'leave_submitted', 'hr', 'normal',
      'Leave application submitted', 'A new leave request needs your review.',
      '/leave/admin/requests', 'leave_request', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.status,'') IS DISTINCT FROM COALESCE(OLD.status,'')
        AND NEW.status IN ('approved','rejected') AND v_applicant IS NOT NULL THEN
    PERFORM public.create_app_notification(v_applicant, 'leave_' || NEW.status, 'hr',
      CASE WHEN NEW.status='approved' THEN 'normal' ELSE 'high' END,
      'Leave ' || NEW.status, 'Your leave request has been ' || NEW.status || '.',
      '/leave/my', 'leave_request', NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_leave_request ON public.leave_requests;
CREATE TRIGGER trg_notify_leave_request AFTER INSERT OR UPDATE ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_leave_request();

CREATE OR REPLACE FUNCTION public.tg_notify_return_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[]; v_ref text := COALESCE(NEW.rt_number, NEW.id::text);
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT array_agg(uid) INTO v_recipients FROM (SELECT public.get_users_with_role('super_admin') uid) x;
    PERFORM public.broadcast_app_notification(v_recipients, 'return_submitted', 'returns', 'normal',
      'Return Request ' || v_ref || ' submitted', 'A new return request needs approval.',
      '/returns/' || NEW.id, 'return_request', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND COALESCE(NEW.request_status,'') IS DISTINCT FROM COALESCE(OLD.request_status,'') THEN
    IF NEW.request_status = 'approved' THEN
      SELECT array_agg(uid) INTO v_recipients FROM (
        SELECT public.get_warehouse_recipients() uid
        UNION SELECT NEW.created_by
      ) x WHERE uid IS NOT NULL;
      PERFORM public.broadcast_app_notification(v_recipients, 'return_approved', 'returns', 'high',
        'Return ' || v_ref || ' approved', 'Return request has been approved.',
        '/returns/' || NEW.id, 'return_request', NEW.id);
    ELSIF NEW.request_status = 'received' THEN
      SELECT array_agg(uid) INTO v_recipients FROM (SELECT public.get_users_with_role('super_admin') uid) x;
      PERFORM public.broadcast_app_notification(v_recipients, 'return_received', 'returns', 'high',
        'Return ' || v_ref || ' received', 'Resolution needed for this return.',
        '/returns/' || NEW.id, 'return_request', NEW.id);
    ELSIF NEW.request_status = 'resolved' AND NEW.created_by IS NOT NULL THEN
      PERFORM public.create_app_notification(NEW.created_by, 'return_resolved', 'returns', 'normal',
        'Return ' || v_ref || ' resolved', 'The return request has been resolved.',
        '/returns/' || NEW.id, 'return_request', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_return_request ON public.return_requests;
CREATE TRIGGER trg_notify_return_request AFTER INSERT OR UPDATE ON public.return_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_return_request();

CREATE OR REPLACE FUNCTION public.tg_notify_payroll_period()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_recipients uuid[];
BEGIN
  SELECT array_agg(uid) INTO v_recipients FROM (SELECT public.get_users_with_role('super_admin') uid) x;
  PERFORM public.broadcast_app_notification(v_recipients, 'payroll_period_created', 'hr', 'high',
    'Payroll period ' || COALESCE(NEW.period_label,'') || ' created',
    'A new payroll period is ready for review.',
    '/payroll/periods/' || NEW.id, 'payroll_period', NEW.id);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_payroll_period ON public.payroll_periods;
CREATE TRIGGER trg_notify_payroll_period AFTER INSERT ON public.payroll_periods
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_payroll_period();

-- 6. Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
