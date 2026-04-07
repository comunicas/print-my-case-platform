-- Compatível com ambientes antigos (valor ausente) e novos (valor já presente)
ALTER TYPE public.audit_event_type ADD VALUE IF NOT EXISTS 'user_creation_rollback';
