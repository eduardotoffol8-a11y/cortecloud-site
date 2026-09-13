alter table public.profiles
  add column plan_type text check (plan_type in ('monthly', 'annual', 'lifetime')),
  add column access_expires_at timestamptz,
  add column last_payment_id text;

create table public.payment_events (
  payment_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_type text not null check (plan_type in ('monthly', 'annual', 'lifetime')),
  amount numeric(10,2) not null,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.payment_events enable row level security;
revoke all on public.payment_events from anon, authenticated;
create index payment_events_user_idx on public.payment_events(user_id, created_at desc);

drop policy "company_insert_own_during_access" on public.company_profiles;
drop policy "company_update_own_during_access" on public.company_profiles;
drop policy "clients_insert_own_during_access" on public.clients;
drop policy "clients_update_own_during_access" on public.clients;
drop policy "clients_delete_own_during_access" on public.clients;
drop policy "quotes_insert_own_during_access" on public.quotes;
drop policy "quotes_update_own_during_access" on public.quotes;
drop policy "quotes_delete_own_during_access" on public.quotes;
drop policy "attachments_insert_own_during_access" on public.project_attachments;
drop policy "attachments_delete_own_during_access" on public.project_attachments;
drop policy "project_files_insert_own" on storage.objects;
drop policy "project_files_delete_own" on storage.objects;

create policy "company_insert_own_during_access" on public.company_profiles for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now())))));
create policy "company_update_own_during_access" on public.company_profiles for update to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now()))))) with check ((select auth.uid()) = user_id);
create policy "clients_insert_own_during_access" on public.clients for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now())))));
create policy "clients_update_own_during_access" on public.clients for update to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now()))))) with check ((select auth.uid()) = user_id);
create policy "clients_delete_own_during_access" on public.clients for delete to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now())))));
create policy "quotes_insert_own_during_access" on public.quotes for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now())))));
create policy "quotes_update_own_during_access" on public.quotes for update to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now()))))) with check ((select auth.uid()) = user_id);
create policy "quotes_delete_own_during_access" on public.quotes for delete to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now())))));
create policy "attachments_insert_own_during_access" on public.project_attachments for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now())))));
create policy "attachments_delete_own_during_access" on public.project_attachments for delete to authenticated
using ((select auth.uid()) = user_id and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now())))));
create policy "project_files_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid())::text and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now())))));
create policy "project_files_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid())::text and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.trial_ends_at > now() or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now())))));
