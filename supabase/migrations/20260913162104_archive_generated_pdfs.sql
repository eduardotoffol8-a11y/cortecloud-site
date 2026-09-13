alter table public.project_attachments
  add column include_in_pdf boolean not null default true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quote-pdfs', 'quote-pdfs', false, 20971520, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "quote_pdfs_select_own" on storage.objects for select to authenticated
using (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "quote_pdfs_insert_own_during_access" on storage.objects for insert to authenticated
with check (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (
      p.trial_ends_at > now()
      or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now()))
    )
  )
);

create policy "quote_pdfs_update_own_during_access" on storage.objects for update to authenticated
using (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (
      p.trial_ends_at > now()
      or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now()))
    )
  )
)
with check (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "quote_pdfs_delete_own_during_access" on storage.objects for delete to authenticated
using (
  bucket_id = 'quote-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and (
      p.trial_ends_at > now()
      or (p.subscription_status = 'active' and (p.plan_type = 'lifetime' or p.access_expires_at is null or p.access_expires_at > now()))
    )
  )
);
