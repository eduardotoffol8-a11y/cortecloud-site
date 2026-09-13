create table public.project_attachments (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create index project_attachments_quote_idx on public.project_attachments(quote_id, created_at desc);
create index project_attachments_client_idx on public.project_attachments(client_id, created_at desc);

alter table public.project_attachments enable row level security;
grant select, insert, delete on public.project_attachments to authenticated;

create policy "attachments_select_own" on public.project_attachments for select to authenticated
using ((select auth.uid()) = user_id);

create policy "attachments_insert_own_during_access" on public.project_attachments for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
);

create policy "attachments_delete_own_during_access" on public.project_attachments for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "project_files_select_own" on storage.objects for select to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "project_files_insert_own" on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
);

create policy "project_files_delete_own" on storage.objects for delete to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.subscription_status = 'active' or p.trial_ends_at > now())
  )
);
