ALTER TYPE public.audit_event_type ADD VALUE IF NOT EXISTS 'user_deletion_success';
ALTER TYPE public.audit_event_type ADD VALUE IF NOT EXISTS 'user_deletion_failed';
