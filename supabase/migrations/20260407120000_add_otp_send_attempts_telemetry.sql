-- Telemetria de tentativas de envio de OTP (separada dos OTPs válidos)
CREATE TABLE public.otp_send_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL CHECK (phone ~ '^\d{10,11}$'),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider TEXT NOT NULL DEFAULT 'twilio',
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_send_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to otp_send_attempts"
ON public.otp_send_attempts
FOR ALL
TO anon, authenticated
USING (false);

CREATE INDEX idx_otp_send_attempts_phone_created_at
  ON public.otp_send_attempts (phone, created_at DESC);
