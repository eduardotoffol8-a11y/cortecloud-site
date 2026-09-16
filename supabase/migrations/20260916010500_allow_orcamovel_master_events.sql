-- The analytics table predates the richer master-dashboard stages and still
-- restricts event_type to the original four values. Expand the check safely.
alter table public.analytics_events
  drop constraint if exists analytics_events_event_type_check;

alter table public.analytics_events
  add constraint analytics_events_event_type_check
  check (event_type in (
    'site_view',
    'app_open',
    'workspace_open',
    'site_plans_interest',
    'plans_open',
    'checkout_started'
  ));
