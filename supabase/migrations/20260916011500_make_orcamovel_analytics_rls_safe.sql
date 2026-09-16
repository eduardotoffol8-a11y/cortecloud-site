-- ON CONFLICT requires permissions that anonymous analytics callers intentionally
-- do not have. Insert normally and swallow only the unique-index collision instead.
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
    when p_event_type in ('site_view', 'app_open', 'site_plans_interest') and v_visitor is not null
      then 'browser:' || v_visitor
    when auth.uid() is not null
      then 'account:' || auth.uid()::text
    when v_visitor is not null
      then 'browser:' || v_visitor
    else null
  end;

  begin
    insert into public.analytics_events (user_id, session_id, event_type, metadata, dedupe_key)
    values (
      auth.uid(),
      left(coalesce(p_session_id, ''), 100),
      p_event_type,
      v_metadata,
      v_dedupe_key
    );
  exception
    when unique_violation then
      null;
  end;
end;
$$;

revoke all on function public.track_orcamovel_event(text, text, jsonb, text) from public;
grant execute on function public.track_orcamovel_event(text, text, jsonb, text) to anon, authenticated;

alter function public.track_orcamovel_event(text, text, jsonb) security invoker;
