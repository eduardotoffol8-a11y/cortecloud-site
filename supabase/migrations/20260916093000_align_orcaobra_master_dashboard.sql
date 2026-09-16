-- Bring OrçaObra admin/analytics to the same semantics used by OrçaMóvel.
-- This migration is additive and does not delete or rewrite customer/project data.

create or replace function public.track_orca_event(
  p_product_id text, p_event_type text, p_session_id text default null,
  p_metadata jsonb default '{}'::jsonb, p_visitor_id text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_metadata jsonb; v_dedupe_key text; v_visitor text;
begin
  if p_product_id not in ('moveis','obra-civil') then raise exception 'invalid product'; end if;
  if p_event_type not in ('site_view','app_open','workspace_open','site_plans_interest','plans_open','checkout_started') then raise exception 'invalid event'; end if;
  if p_event_type in ('workspace_open','plans_open','checkout_started') and auth.uid() is null then raise exception 'authentication required'; end if;
  v_metadata := coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('product',p_product_id);
  v_visitor := nullif(left(coalesce(p_visitor_id,p_session_id,''),100),'');
  v_dedupe_key := case
    when p_event_type in ('site_view','app_open','site_plans_interest') and v_visitor is not null then 'browser:'||v_visitor
    when auth.uid() is not null then 'account:'||auth.uid()::text
    when v_visitor is not null then 'browser:'||v_visitor else null end;
  insert into public.analytics_events(user_id,session_id,event_type,metadata,dedupe_key)
  values(auth.uid(),left(coalesce(p_session_id,''),100),p_event_type,v_metadata,v_dedupe_key)
  on conflict(event_type,(coalesce(metadata->>'product','moveis')),dedupe_key) where dedupe_key is not null do nothing;
end;
$$;
revoke all on function public.track_orca_event(text,text,text,jsonb,text) from public;
grant execute on function public.track_orca_event(text,text,text,jsonb,text) to anon, authenticated;

create or replace function public.admin_orcaobra_dashboard()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.is_orcamovel_admin() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'users',(select count(*) from public.product_entitlements where product_id='obra-civil'),
      'trial',(select count(*) from public.product_entitlements where product_id='obra-civil' and subscription_status='trial' and trial_ends_at>now()),
      'active',(select count(*) from public.product_entitlements where product_id='obra-civil' and subscription_status='active' and plan_type is not null and (plan_type='lifetime' or access_expires_at is null or access_expires_at>now())),
      'monthly',(select count(*) from public.product_entitlements where product_id='obra-civil' and subscription_status='active' and plan_type='monthly' and (access_expires_at is null or access_expires_at>now())),
      'annual',(select count(*) from public.product_entitlements where product_id='obra-civil' and subscription_status='active' and plan_type='annual' and (access_expires_at is null or access_expires_at>now())),
      'lifetime',(select count(*) from public.product_entitlements where product_id='obra-civil' and subscription_status='active' and plan_type='lifetime'),
      'site_views',(select count(distinct coalesce(nullif(dedupe_key,''),'legacy-session:'||session_id)) from public.analytics_events where event_type='site_view' and nullif(session_id,'') is not null and metadata->>'product'='obra-civil'),
      'app_opens',(select count(distinct coalesce(nullif(dedupe_key,''),'legacy-session:'||session_id)) from public.analytics_events where event_type='app_open' and nullif(session_id,'') is not null and metadata->>'product'='obra-civil'),
      'workspace_opens',(select count(distinct coalesce(nullif(dedupe_key,''),'legacy-session:'||session_id)) from public.analytics_events where event_type='workspace_open' and nullif(session_id,'') is not null and metadata->>'product'='obra-civil'),
      'site_plan_interests',(select count(distinct coalesce(nullif(dedupe_key,''),'legacy-session:'||session_id)) from public.analytics_events where event_type='site_plans_interest' and nullif(session_id,'') is not null and metadata->>'product'='obra-civil'),
      'plan_opens',(select count(distinct coalesce(nullif(dedupe_key,''),'legacy-session:'||session_id)) from public.analytics_events where event_type='plans_open' and nullif(session_id,'') is not null and metadata->>'product'='obra-civil'),
      'checkout_starts',(select count(distinct coalesce(nullif(dedupe_key,''),'legacy-session:'||session_id)) from public.analytics_events where event_type='checkout_started' and nullif(session_id,'') is not null and metadata->>'product'='obra-civil'),
      'purchases',(select count(distinct payment_id) from public.payment_events where status='approved' and product_id='obra-civil'),
      'feedback_total',(select count(*) from public.app_feedback where product_id='obra-civil')
    ),
    'settings',(select to_jsonb(s) from public.app_settings s where id=true),
    'feedback',coalesce((select jsonb_agg(to_jsonb(f) order by f.created_at desc) from (select id,user_email,user_name,rating,message,status,created_at from public.app_feedback where product_id='obra-civil' order by created_at desc limit 100) f),'[]'::jsonb),
    'users',coalesce((select jsonb_agg(to_jsonb(u) order by u.created_at desc) from (select e.user_id as id,coalesce(au.email,'') as email,e.subscription_status,e.plan_type,e.trial_ends_at,e.access_expires_at,e.created_at from public.product_entitlements e left join auth.users au on au.id=e.user_id where e.product_id='obra-civil' order by e.created_at desc limit 200) u),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_orcaobra_dashboard() from public;
revoke all on function public.admin_orcaobra_dashboard() from anon;
grant execute on function public.admin_orcaobra_dashboard() to authenticated;

create or replace function public.admin_extend_product_access(p_user_id uuid,p_product_id text,p_days integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_status text; v_plan text;
begin
  if not public.is_orcamovel_admin() then raise exception 'forbidden'; end if;
  if p_product_id not in ('obra-civil') then raise exception 'invalid product'; end if;
  if p_days < 1 or p_days > 3650 then raise exception 'invalid days'; end if;
  select subscription_status,plan_type into v_status,v_plan from public.product_entitlements where user_id=p_user_id and product_id=p_product_id;
  if not found then raise exception 'user not found'; end if;
  if v_status='active' and v_plan='lifetime' then raise exception 'lifetime plan'; end if;
  if v_status='active' and v_plan in ('monthly','annual') then
    update public.product_entitlements set access_expires_at=greatest(coalesce(access_expires_at,now()),now())+make_interval(days=>p_days),updated_at=now() where user_id=p_user_id and product_id=p_product_id;
  else
    update public.product_entitlements set trial_ends_at=greatest(trial_ends_at,now())+make_interval(days=>p_days),updated_at=now() where user_id=p_user_id and product_id=p_product_id;
  end if;
end;
$$;
revoke all on function public.admin_extend_product_access(uuid,text,integer) from public;
revoke all on function public.admin_extend_product_access(uuid,text,integer) from anon;
grant execute on function public.admin_extend_product_access(uuid,text,integer) to authenticated;

create or replace function public.admin_update_product_feedback_status(p_id bigint,p_product_id text,p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_orcamovel_admin() then raise exception 'forbidden'; end if;
  if p_product_id not in ('moveis','obra-civil') then raise exception 'invalid product'; end if;
  if p_status not in ('new','approved','archived') then raise exception 'invalid status'; end if;
  update public.app_feedback set status=p_status,updated_at=now() where id=p_id and coalesce(product_id,'moveis')=p_product_id;
  if not found then raise exception 'feedback not found'; end if;
end;
$$;
revoke all on function public.admin_update_product_feedback_status(bigint,text,text) from public;
revoke all on function public.admin_update_product_feedback_status(bigint,text,text) from anon;
grant execute on function public.admin_update_product_feedback_status(bigint,text,text) to authenticated;
