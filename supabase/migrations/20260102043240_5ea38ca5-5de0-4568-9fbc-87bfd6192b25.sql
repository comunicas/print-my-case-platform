-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID, -- NULL = all users in org
  type TEXT NOT NULL, -- 'product_request', 'upload_processed', 'stock_alert', 'team_member'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_org ON public.notifications(user_id, organization_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their notifications or org-wide notifications (user_id is null)
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (
  organization_id = get_user_org_id(auth.uid())
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Users can update their notifications (mark as read)
CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (
  organization_id = get_user_org_id(auth.uid())
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE
USING (
  organization_id = get_user_org_id(auth.uid())
  AND is_admin(auth.uid())
);

-- System can insert notifications (via triggers/functions)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Function to create notifications (used by triggers and edge functions)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_org_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (organization_id, user_id, type, title, message, metadata)
  VALUES (p_org_id, p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger function for new product requests
CREATE OR REPLACE FUNCTION public.notify_new_product_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification for all admins in the organization (user_id = NULL)
  INSERT INTO notifications (organization_id, user_id, type, title, message, metadata)
  VALUES (
    NEW.organization_id,
    NULL,
    'product_request',
    'Novo pedido de produto',
    NEW.customer_name || ' solicitou: ' || NEW.requested_model,
    jsonb_build_object('request_id', NEW.id, 'customer_phone', NEW.customer_phone)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on product_requests
CREATE TRIGGER on_new_product_request
AFTER INSERT ON public.product_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_new_product_request();