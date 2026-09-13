create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '30 days'),
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  document text not null default '',
  contact text not null default '',
  email text not null default '',
  address text not null default '',
  logo_data text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null default '',
  document text not null default '',
  project_name text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  quote_number text not null,
  client_name text not null default '',
  payload jsonb not null,
  pdf_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, quote_number)
);

create index clients_user_updated_idx on public.clients(user_id, updated_at desc);
create index quotes_user_updated_idx on public.quotes(user_id, updated_at desc);
create index quotes_client_idx on public.quotes(client_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;

grant select on public.profiles to authenticated;
grant select, insert, update on public.company_profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.quotes to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "company_select_own" on public.company_profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "company_insert_own_during_access" on public.company_profiles for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
);

create policy "company_update_own_during_access" on public.company_profiles for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
)
with check ((select auth.uid()) = user_id);

create policy "clients_select_own" on public.clients for select to authenticated
using ((select auth.uid()) = user_id);

create policy "clients_insert_own_during_access" on public.clients for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
);

create policy "clients_update_own_during_access" on public.clients for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
)
with check ((select auth.uid()) = user_id);

create policy "clients_delete_own_during_access" on public.clients for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
);

create policy "quotes_select_own" on public.quotes for select to authenticated
using ((select auth.uid()) = user_id);

create policy "quotes_insert_own_during_access" on public.quotes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
);

create policy "quotes_update_own_during_access" on public.quotes for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
)
with check ((select auth.uid()) = user_id);

create policy "quotes_delete_own_during_access" on public.quotes for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
);

create or replace function private.handle_new_orcamovel_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

revoke all on function private.handle_new_orcamovel_user() from public;
revoke all on function private.handle_new_orcamovel_user() from anon;
revoke all on function private.handle_new_orcamovel_user() from authenticated;

create trigger on_orcamovel_user_created
after insert on auth.users
for each row execute function private.handle_new_orcamovel_user();
