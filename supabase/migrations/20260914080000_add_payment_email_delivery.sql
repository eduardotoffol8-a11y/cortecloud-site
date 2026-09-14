alter table public.payment_events
  add column confirmation_email_sent_at timestamptz,
  add column confirmation_email_id text;
