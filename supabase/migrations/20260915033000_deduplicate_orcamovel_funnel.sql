-- Funnel stages are lifetime-unique per signed-in account or anonymous browser.
-- Anonymous identities are random browser IDs, never e-mail addresses or fingerprints.
alter table public.analytics_events
  add column if not exists dedupe_key text;

create unique index if not exists analytics_events_orcamovel_funnel_unique
  on public.analytics_events (
    event_type,
    (coalesce(metadata ->> 'product', 'moveis')),
    dedupe_key
  )
  where dedupe_key is not null;

create or replace function public.track_orcamovel_event(
  p_event_type text,
  p_session_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_visitor_id text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_metadata jsonb;
  v_dedupe_key text;
begin
  if p_event_type not in ('site_view', 'app_open', 'plans_open', 'checkout_started') then
    raise exception 'invalid event';
  end if;

  v_metadata := coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('product', 'moveis');
  v_dedupe_key := case
    when auth.uid() is not null then 'account:' || auth.uid()::text
    when nullif(left(coalesce(p_visitor_id, p_session_id, ''), 100), '') is not null
      then 'browser:' || left(coalesce(p_visitor_id, p_session_id), 100)
    else null
  end;

  insert into public.analytics_events (user_id, session_id, event_type, metadata, dedupe_key)
  values (
    auth.uid(),
    left(coalesce(p_session_id, ''), 100),
    p_event_type,
    v_metadata,
    v_dedupe_key
  )
  on conflict (
    event_type,
    (coalesce(metadata ->> 'product', 'moveis')),
    dedupe_key
  ) where dedupe_key is not null do nothing;
end;
$$;

revoke all on function public.track_orcamovel_event(text, text, jsonb, text) from public;
grant execute on function public.track_orcamovel_event(text, text, jsonb, text) to anon, authenticated;

-- Keep the previous RPC signature working for already-open app tabs.
create or replace function public.track_orcamovel_event(
  p_event_type text,
  p_session_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.track_orcamovel_event(
    p_event_type,
    p_session_id,
    p_metadata,
    p_session_id
  );
end;
$$;

revoke all on function public.track_orcamovel_event(text, text, jsonb) from public;
grant execute on function public.track_orcamovel_event(text, text, jsonb) to anon, authenticated;

create or replace function public.admin_orcamovel_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
 if not public.is_orcamovel_admin() then raise exception 'forbidden'; end if;
 select jsonb_build_object(
  'summary',jsonb_build_object(
    'users',(select count(*) from public.profiles),
    'trial',(select count(*) from public.profiles where subscription_status='trial' and trial_ends_at>now()),
    'active',(select count(*) from public.profiles where subscription_status='active'),
    'monthly',(select count(*) from public.profiles where subscription_status='active' and plan_type='monthly'),
    'annual',(select count(*) from public.profiles where subscription_status='active' and plan_type='annual'),
    'lifetime',(select count(*) from public.profiles where subscription_status='active' and plan_type='lifetime'),
    'site_views',(select count(distinct coalesce(nullif(dedupe_key,''), 'legacy:' || session_id)) from public.analytics_events where event_type='site_view' and nullif(session_id,'') is not null and coalesce(metadata->>'product','moveis')='moveis'),
    'app_opens',(select count(distinct coalesce(nullif(dedupe_key,''), 'legacy:' || session_id)) from public.analytics_events where event_type='app_open' and nullif(session_id,'') is not null and coalesce(metadata->>'product','moveis')='moveis'),
    'plan_opens',(select count(distinct coalesce(nullif(dedupe_key,''), 'legacy:' || session_id)) from public.analytics_events where event_type='plans_open' and nullif(session_id,'') is not null and coalesce(metadata->>'product','moveis')='moveis'),
    'checkout_starts',(select count(distinct coalesce(nullif(dedupe_key,''), 'legacy:' || session_id)) from public.analytics_events where event_type='checkout_started' and nullif(session_id,'') is not null and coalesce(metadata->>'product','moveis')='moveis'),
    'purchases',(select count(distinct payment_id) from public.payment_events where status='approved')
  ),
  'settings',(select to_jsonb(s) from public.app_settings s where id=true),
  'feedback',coalesce((select jsonb_agg(to_jsonb(f) order by f.created_at desc) from (select id,user_email,user_name,rating,message,status,created_at from public.app_feedback order by created_at desc limit 100) f),'[]'::jsonb),
  'users',coalesce((select jsonb_agg(to_jsonb(u) order by u.created_at desc) from (select id,email,subscription_status,plan_type,trial_ends_at,access_expires_at,created_at from public.profiles order by created_at desc limit 200) u),'[]'::jsonb)
 ) into result;
 return result;
end;
$$;
