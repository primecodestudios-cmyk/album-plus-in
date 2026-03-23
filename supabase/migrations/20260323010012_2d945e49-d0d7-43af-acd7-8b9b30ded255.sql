-- Add phone and OTP columns to chat_conversations
ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS otp_code text,
  ADD COLUMN IF NOT EXISTS otp_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz;

-- Enable realtime for chat_messages so admin replies appear in widget
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
