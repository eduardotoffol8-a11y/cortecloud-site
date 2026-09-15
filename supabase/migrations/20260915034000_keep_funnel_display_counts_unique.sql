-- Existing open tabs can still send the legacy and authenticated app-open
-- events together. They share a session ID, so keep the panel's display
-- count session-based while the tracking function prevents future repeats.
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
    'site_views',(select count(distinct session_id) from public.analytics_events where event_type='site_view' and nullif(session_id,'') is not null and coalesce(metadata->>'product','moveis')='moveis'),
    'app_opens',(select count(distinct session_id) from public.analytics_events where event_type='app_open' and nullif(session_id,'') is not null and coalesce(metadata->>'product','moveis')='moveis'),
    'plan_opens',(select count(distinct session_id) from public.analytics_events where event_type='plans_open' and nullif(session_id,'') is not null and coalesce(metadata->>'product','moveis')='moveis'),
    'checkout_starts',(select count(distinct session_id) from public.analytics_events where event_type='checkout_started' and nullif(session_id,'') is not null and coalesce(metadata->>'product','moveis')='moveis'),
    'purchases',(select count(distinct payment_id) from public.payment_events where status='approved')
  ),
  'settings',(select to_jsonb(s) from public.app_settings s where id=true),
  'feedback',coalesce((select jsonb_agg(to_jsonb(f) order by f.created_at desc) from (select id,user_email,user_name,rating,message,status,created_at from public.app_feedback order by created_at desc limit 100) f),'[]'::jsonb),
  'users',coalesce((select jsonb_agg(to_jsonb(u) order by u.created_at desc) from (select id,email,subscription_status,plan_type,trial_ends_at,access_expires_at,created_at from public.profiles order by created_at desc limit 200) u),'[]'::jsonb)
 ) into result;
 return result;
end;
$$;
