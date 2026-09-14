create or replace function public.get_public_orcamovel_feedback_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with approved as (
    select user_name, rating, message, created_at
    from public.app_feedback
    where status = 'approved'
  ),
  totals as (
    select count(*)::int as total, coalesce(round(avg(rating)::numeric, 1), 0) as average
    from approved
  )
  select jsonb_build_object(
    'total', (select total from totals),
    'average', (select average from totals),
    'distribution', jsonb_build_object(
      '5', (select count(*)::int from approved where rating = 5),
      '4', (select count(*)::int from approved where rating = 4),
      '3', (select count(*)::int from approved where rating = 3),
      '2', (select count(*)::int from approved where rating = 2),
      '1', (select count(*)::int from approved where rating = 1)
    ),
    'reviews', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_name', coalesce(nullif(trim(user_name), ''), 'Usuário do OrçaMóvel'),
        'rating', rating,
        'message', message,
        'created_at', created_at
      ) order by created_at desc)
      from (select user_name, rating, message, created_at from approved order by created_at desc limit 12) reviews
    ), '[]'::jsonb)
  );
$$;
revoke all on function public.get_public_orcamovel_feedback_summary() from public;
grant execute on function public.get_public_orcamovel_feedback_summary() to anon, authenticated;
