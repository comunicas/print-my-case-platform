-- Fix 1: Replace permissive notifications INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Only admins can directly insert notifications (system uses SECURITY DEFINER functions)
CREATE POLICY "Admins can insert notifications for their org"
ON notifications FOR INSERT
WITH CHECK (
  organization_id = get_user_org_id(auth.uid())
  AND is_admin(auth.uid())
);

-- Fix 2: Add database constraints for product_requests validation
ALTER TABLE product_requests 
ADD CONSTRAINT customer_name_length CHECK (length(customer_name) BETWEEN 2 AND 100);

ALTER TABLE product_requests 
ADD CONSTRAINT customer_phone_format CHECK (customer_phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$');

ALTER TABLE product_requests 
ADD CONSTRAINT requested_model_length CHECK (length(requested_model) BETWEEN 2 AND 200);

-- Add length constraint for message if present
ALTER TABLE product_requests 
ADD CONSTRAINT message_length CHECK (message IS NULL OR length(message) <= 1000);