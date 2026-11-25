begin;

create schema if not exists math_quest_private;
revoke all on schema math_quest_private from public, anon, authenticated;

create table if not exists math_quest_private.runs (
  id uuid primary key default gen_random_uuid(),
  player text not null check (char_length(player) between 1 and 24),
  grade integer not null check (grade between 1 and 12),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  elapsed integer check (elapsed >= 0)
);
alter table math_quest_private.runs enable row level security;
revoke all on math_quest_private.runs from public, anon, authenticated;

create index if not exists math_quest_finishes_order
  on math_quest_private.runs (elapsed, finished_at, id)
  where finished_at is not null;

create or replace function public.math_quest_start_run(player_name text, player_grade integer)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  new_id uuid;
begin
  if player_name is null or char_length(btrim(player_name)) not between 1 and 24
     or player_grade is null or player_grade not between 1 and 12 then
    raise exception 'Enter a nickname and a class from 1 to 12' using errcode = '22023';
  end if;
  insert into math_quest_private.runs (player, grade)
    values (btrim(player_name), player_grade)
    returning id into new_id;
  return jsonb_build_object('id', new_id);
end;
$$;

create or replace function public.math_quest_finish_run(run_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  finish_seconds integer;
begin
  update math_quest_private.runs
     set finished_at = now(),
         elapsed = greatest(0, floor(extract(epoch from (now() - started_at))))::integer
   where id = run_id and finished_at is null;
  select elapsed into finish_seconds from math_quest_private.runs
   where id = run_id and finished_at is not null;
  if not found then
    raise exception 'Run not found' using errcode = '22023';
  end if;
  return jsonb_build_object('elapsed', finish_seconds);
end;
$$;

create or replace function public.math_quest_leaderboard()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('scores', coalesce(
    jsonb_agg(jsonb_build_object('name', player, 'grade', grade, 'elapsed', elapsed)
              order by elapsed, finished_at, id), '[]'::jsonb))
  from (
    select id, player, grade, elapsed, finished_at
    from math_quest_private.runs
    where finished_at is not null
    order by elapsed, finished_at, id
    limit 10
  ) as best;
$$;

revoke all on function public.math_quest_start_run(text, integer) from public, anon, authenticated;
revoke all on function public.math_quest_finish_run(uuid) from public, anon, authenticated;
revoke all on function public.math_quest_leaderboard() from public, anon, authenticated;
grant execute on function public.math_quest_start_run(text, integer) to anon, authenticated;
grant execute on function public.math_quest_finish_run(uuid) to anon, authenticated;
grant execute on function public.math_quest_leaderboard() to anon, authenticated;

notify pgrst, 'reload schema';
commit;
