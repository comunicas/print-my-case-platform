-- Fase 6: Adicionar attempt_count em otp_verifications para proteção contra brute-force
ALTER TABLE public.otp_verifications ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;