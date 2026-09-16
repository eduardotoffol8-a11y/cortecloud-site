-- Reconcile the OrçaMóvel master dashboard without deleting historical data.
-- Public acquisition events use an anonymous browser ID. Authenticated commercial
-- stages use the account ID so the same account is counted once across devices.

alter table public.payment_events
  add column if not exists product_id text not null default 'moveis';

alter table public.app_feedback
  add column if not exists product_id text not null default 'moveis';

-- Keep the browser-facing insert policy aligned with the event vocabulary.
drop policy if exists "analytics_events_insert" on public.analytics_events;
create policy "analytics_events_insert" on public.analytics_events
for insert to anon, authenticated
with check (
  event_type in (
    'site_view',
    'app_open',
    'workspace_open',
    'site_plans_interest',
    'plans_open',
    'checkout_started'
  )
  and user_id is not distinct from (select auth.uid())
);

create or replace function public.track_orcamovel_event(
  p_event_type text,
  p_session_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_visitor_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_metadata jsonb;
  v_dedupe_key text;
  v_visitor text;
begin
  if p_event_type not in (
    'site_view',
    'app_open',
    'workspace_open',
    'site_plans_interest',
    'plans_open',
    'checkout_started'
  ) then
    raise exception 'invalid event';
  end if;

  if p_event_type in ('workspace_open', 'plans_open', 'checkout_started')
     and auth.uid() is null then
    raise exception 'authentication required';
  end if;

  v_metadata := coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('product', 'moveis');
  v_visitor := nullif(left(coalesce(p_visitor_id, p_session_id, ''), 100), '');

  v_dedupe_key := case
    -- Public acquisition is browser based. This also keeps the legacy
    -- authenticated app_open call from creating a second copy of the same open.
    when p_event_type in ('site_view', 'app_open', 'site_plans_interest') and v_visitor is not null
      then 'browser:' || v_visitor
    -- Authenticated stages are account based, so one account is counted once
    -- even when it uses more than one device.
    when auth.uid() is not null
      then 'account:' || auth.uid()::text
    when v_visitor is not null
      then 'browser:' || v_visitor
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

-- Preserve the previous RPC signature for tabs that were already open before
-- this release. Protected commercial stages still require authentication.
create or replace function public.track_orcamovel_event(
  p_event_type text,
  p_session_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
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
    'summary', jsonb_build_object(
      'users', (select count(*) from public.profiles),
      'trial', (
        select count(*) from public.profiles
        where subscription_status = 'trial' and trial_ends_at > now()
      ),
      'active', (
        select count(*) from public.profiles
        where subscription_status = 'active'
          and plan_type is not null
          and (plan_type = 'lifetime' or access_expires_at is null or access_expires_at > now())
      ),
      'monthly', (
        select count(*) from public.profiles
        where subscription_status = 'active'
          and plan_type = 'monthly'
          and (access_expires_at is null or access_expires_at > now())
      ),
      'annual', (
        select count(*) from public.profiles
        where subscription_status = 'active'
          and plan_type = 'annual'
          and (access_expires_at is null or access_expires_at > now())
      ),
      'lifetime', (
        select count(*) from public.profiles
        where subscription_status = 'active' and plan_type = 'lifetime'
      ),
      'site_views', (
        select count(distinct coalesce(nullif(dedupe_key, ''), 'legacy-session:' || session_id))
        from public.analytics_events
        where event_type = 'site_view'
          and nullif(session_id, '') is not null
          and coalesce(metadata ->> 'product', 'moveis') = 'moveis'
      ),
      'app_opens', (
        select count(distinct coalesce(nullif(dedupe_key, ''), 'legacy-session:' || session_id))
        from public.analytics_events
        where event_type = 'app_open'
          and nullif(session_id, '') is not null
          and coalesce(metadata ->> 'product', 'moveis') = 'moveis'
      ),
      'workspace_opens', (
        select count(distinct coalesce(nullif(dedupe_key, ''), 'legacy-session:' || session_id))
        from public.analytics_events
        where event_type = 'workspace_open'
          and nullif(session_id, '') is not null
          and coalesce(metadata ->> 'product', 'moveis') = 'moveis'
      ),
      'site_plan_interests', (
        select count(distinct coalesce(nullif(dedupe_key, ''), 'legacy-session:' || session_id))
        from public.analytics_events
        where event_type = 'site_plans_interest'
          and nullif(session_id, '') is not null
          and coalesce(metadata ->> 'product', 'moveis') = 'moveis'
      ),
      'plan_opens', (
        select count(distinct coalesce(nullif(dedupe_key, ''), 'legacy-session:' || session_id))
        from public.analytics_events
        where event_type = 'plans_open'
          and nullif(session_id, '') is not null
          and coalesce(metadata ->> 'product', 'moveis') = 'moveis'
      ),
      'checkout_starts', (
        select count(distinct coalesce(nullif(dedupe_key, ''), 'legacy-session:' || session_id))
        from public.analytics_events
        where event_type = 'checkout_started'
          and nullif(session_id, '') is not null
          and coalesce(metadata ->> 'product', 'moveis') = 'moveis'
      ),
      'purchases', (
        select count(distinct payment_id) from public.payment_events
        where status = 'approved' and coalesce(product_id, 'moveis') = 'moveis'
      ),
      'feedback_total', (
        select count(*) from public.app_feedback
        where coalesce(product_id, 'moveis') = 'moveis'
      )
    ),
    'settings', (select to_jsonb(s) from public.app_settings s where id = true),
    'feedback', coalesce((
      select jsonb_agg(to_jsonb(f) order by f.created_at desc)
      from (
        select id, user_email, user_name, rating, message, status, created_at
        from public.app_feedback
        where coalesce(product_id, 'moveis') = 'moveis'
        order by created_at desc
        limit 100
      ) f
    ), '[]'::jsonb),
    'users', coalesce((
      select jsonb_agg(to_jsonb(u) order by u.created_at desc)
      from (
        select id, email, subscription_status, plan_type, trial_ends_at, access_expires_at, created_at
        from public.profiles
        order by created_at desc
        limit 200
      ) u
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_orcamovel_dashboard() from public;
grant execute on function public.admin_orcamovel_dashboard() to authenticated;

create or replace function public.admin_extend_user_access(
  p_user_id uuid,
  p_days integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_plan text;
begin
  if not public.is_orcamovel_admin() then raise exception 'forbidden'; end if;
  if p_days < 1 or p_days > 3650 then raise exception 'invalid days'; end if;

  select subscription_status, plan_type
  into v_status, v_plan
  from public.profiles
  where id = p_user_id;

  if not found then raise exception 'user not found'; end if;
  if v_status = 'active' and v_plan = 'lifetime' then raise exception 'lifetime plan'; end if;

  if v_status = 'active' and v_plan in ('monthly', 'annual') then
    update public.profiles
    set access_expires_at = greatest(coalesce(access_expires_at, now()), now()) + make_interval(days => p_days),
        updated_at = now()
    where id = p_user_id;
  else
    update public.profiles
    set trial_ends_at = greatest(trial_ends_at, now()) + make_interval(days => p_days),
        updated_at = now()
    where id = p_user_id;
  end if;
end;
$$;

revoke all on function public.admin_extend_user_access(uuid, integer) from public;
grant execute on function public.admin_extend_user_access(uuid, integer) to authenticated;

-- Restrict feedback moderation to the OrçaMóvel records surfaced by this panel.
create or replace function public.admin_update_feedback_status(
  p_id bigint,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_orcamovel_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('new', 'approved', 'archived') then raise exception 'invalid status'; end if;

  update public.app_feedback
  set status = p_status, updated_at = now()
  where id = p_id and coalesce(product_id, 'moveis') = 'moveis';

  if not found then raise exception 'feedback not found'; end if;
end;
$$;

revoke all on function public.admin_update_feedback_status(bigint, text) from public;
grant execute on function public.admin_update_feedback_status(bigint, text) to authenticated;
