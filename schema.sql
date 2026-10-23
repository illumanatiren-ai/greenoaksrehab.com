create table if not exists subscribers (
  id bigserial primary key,
  email text not null unique,
  status text not null default 'pending' check (status in ('pending','active','unsubscribed','suppressed')),
  source text,
  consent_text text,
  consent_at timestamptz,
  consent_ip text,
  consent_user_agent text,
  confirm_token text unique,
  confirm_sent_at timestamptz,
  confirmed_at timestamptz,
  confirmed_ip text,
  unsubscribed_at timestamptz,
  soft_bounce_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppression (
  email text primary key,
  reason text not null check (reason in ('bounce','complaint','unsubscribe','manual')),
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists email_events (
  id bigserial primary key,
  event_type text not null,
  email text,
  detail text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id bigserial primary key,
  ref text not null unique,
  paypal_order_id text not null unique,
  status text not null default 'created' check (status in ('created','paid','failed')),
  currency text not null,
  total_cents int not null,
  items jsonb not null,
  needs_shipping boolean not null default false,
  payer_email text,
  payer_name text,
  shipping jsonb,
  paypal_capture_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists contact_messages (
  id bigserial primary key,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscribers_status on subscribers(status);
create index if not exists idx_email_events_email on email_events(email);
