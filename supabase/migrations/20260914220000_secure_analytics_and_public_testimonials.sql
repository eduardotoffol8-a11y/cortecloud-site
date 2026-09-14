-- Keep analytics writable from the browser without exposing event rows.
grant insert on public.analytics_events to anon, authenticated;
create policy "analytics_events_insert" on public.analytics_events
for insert to anon, authenticated
with check (
  event_type in ('site_view', 'app_open', 'plans_open', 'checkout_started')
  and user_id is not distinct from (select auth.uid())
);
alter function public.track_orcamovel_event(text, text, jsonb) security invoker;
revoke all on function public.track_orcamovel_event(text, text, jsonb) from public;
grant execute on function public.track_orcamovel_event(text, text, jsonb) to anon, authenticated;

-- The public site receives only approved testimonials and never reviewer emails.
create or replace function public.get_public_orcamovel_feedback()
returns table (
  user_name text,
  rating smallint,
  message text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(nullif(trim(f.user_name), ''), 'Usuário do OrçaMóvel') as user_name,
    f.rating,
    f.message,
    f.created_at
  from public.app_feedback f
  where f.status = 'approved'
  order by f.created_at desc
  limit 12;
$$;
revoke all on function public.get_public_orcamovel_feedback() from public;
grant execute on function public.get_public_orcamovel_feedback() to anon, authenticated;
