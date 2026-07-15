-- Exposes a per-show count of `reports` rows to the anon role without
-- granting SELECT on `reports` (that table stays insert-only for anon
-- per the RLS policy in design.txt — submitted reports are not publicly
-- listed in v1). SECURITY DEFINER runs as the function owner, who can
-- read the table regardless of RLS; the function only ever returns a count.
create or replace function public.report_count(show uuid)
returns bigint
language sql
security definer
set search_path = public, pg_temp
as $$
  select count(*) from public.reports where show_id = show;
$$;

revoke all on function public.report_count(uuid) from public;
grant execute on function public.report_count(uuid) to anon;
