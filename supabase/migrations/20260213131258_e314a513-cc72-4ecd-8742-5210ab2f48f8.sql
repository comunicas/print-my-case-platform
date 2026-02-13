
-- Table to store OTP verification codes
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL CHECK (phone ~ '^\d{10,11}$'),
  code TEXT NOT NULL CHECK (char_length(code) = 6),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (edge function uses service role, but allow reads for verification)
CREATE POLICY "No direct access to otp_verifications"
ON public.otp_verifications
FOR ALL
TO anon, authenticated
USING (false);

-- Index for lookups
CREATE INDEX idx_otp_phone_code ON public.otp_verifications (phone, code, expires_at);

-- Cleanup old OTPs automatically (older than 10 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.otp_verifications WHERE expires_at < now() - interval '10 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_cleanup_otps
AFTER INSERT ON public.otp_verifications
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_otps();
