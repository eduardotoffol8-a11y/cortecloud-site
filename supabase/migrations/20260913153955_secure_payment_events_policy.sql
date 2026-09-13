create policy "payment_events_no_client_access"
on public.payment_events
for all
to authenticated
using (false)
with check (false);
