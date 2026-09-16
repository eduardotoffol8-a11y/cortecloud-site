-- Analytics already has an explicit INSERT grant and RLS policy for anon/authenticated,
-- so the tracking RPC does not need elevated privileges.
alter function public.track_orcamovel_event(text, text, jsonb, text) security invoker;
alter function public.track_orcamovel_event(text, text, jsonb) security invoker;
