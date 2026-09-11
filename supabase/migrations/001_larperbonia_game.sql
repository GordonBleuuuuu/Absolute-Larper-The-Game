-- Larperbonia Simulator: public game state plus per-player private state.
-- Apply from the Supabase SQL Editor or with the Supabase CLI after linking a project.

create extension if not exists pgcrypto;

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'lobby'
    check (status in ('lobby', 'playing', 'complete')),
  team_score integer not null default 0,
  required_score integer not null default 100,
  created_at timestamptz not null default now()
);

create table public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 32),
  x real not null default 0,
  y real not null default 0,
  carried_coins integer not null default 0 check (carried_coins >= 0),
  public_contributed integer not null default 0,
  speed_modifier numeric(4, 3) not null default 1.000,
  modifier_expires_at timestamptz,
  forced_boost_until timestamptz,
  updated_at timestamptz not null default now(),
  unique (match_id, user_id)
);

-- Other players cannot select this table. Do not return these fields from public RPCs.
create table public.match_secrets (
  player_id uuid primary key references public.match_players(id) on delete cascade,
  is_saboteur boolean not null default false,
  hidden_combo_count integer not null default 0,
  embezzled_points integer not null default 0,
  flawless_run boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_secrets enable row level security;

-- These helpers avoid RLS recursion while preserving a member-only public match view.
create or replace function public.is_match_member(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.match_players
    where match_id = p_match_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.owns_player(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.match_players
    where id = p_player_id
      and user_id = auth.uid()
  );
$$;

create policy "Match members read their public match"
on public.matches for select to authenticated
using (public.is_match_member(id));

create policy "Match members read public player positions and scores"
on public.match_players for select to authenticated
using (public.is_match_member(match_id));

create policy "Players read only their own private state"
on public.match_secrets for select to authenticated
using (public.owns_player(player_id));

-- There are deliberately no client-side INSERT, UPDATE, or DELETE policies.
-- Trusted server code creates matches and players; RPCs resolve game actions.

create or replace function public.deposit_resources(
  p_match_id uuid,
  p_coins integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.match_players%rowtype;
  v_is_saboteur boolean;
  v_team_credit integer;
  v_embezzled integer;
begin
  if p_coins <= 0 then
    raise exception 'Invalid deposit';
  end if;

  select *
  into v_player
  from public.match_players
  where match_id = p_match_id
    and user_id = auth.uid()
  for update;

  if not found or v_player.carried_coins < p_coins then
    raise exception 'Deposit unavailable';
  end if;

  select is_saboteur
  into v_is_saboteur
  from public.match_secrets
  where player_id = v_player.id
  for update;

  if not found then
    raise exception 'Player state unavailable';
  end if;

  v_embezzled := case
    when v_is_saboteur then floor(p_coins * 0.20)::integer
    else 0
  end;
  v_team_credit := p_coins - v_embezzled;

  update public.match_players
  set carried_coins = carried_coins - p_coins,
      public_contributed = public_contributed + v_team_credit,
      updated_at = now()
  where id = v_player.id;

  update public.matches
  set team_score = team_score + v_team_credit
  where id = p_match_id;

  if v_embezzled > 0 then
    update public.match_secrets
    set embezzled_points = embezzled_points + v_embezzled,
        updated_at = now()
    where player_id = v_player.id;
  end if;

  -- The client receives only a generic response; public state updates via Realtime.
  return jsonb_build_object('ok', true, 'message', 'Deposit accepted');
end;
$$;

revoke all on function public.deposit_resources(uuid, integer) from public;
grant execute on function public.deposit_resources(uuid, integer) to authenticated;

alter table public.matches replica identity full;
alter table public.match_players replica identity full;
alter table public.match_secrets replica identity full;

alter publication supabase_realtime
  add table public.matches, public.match_players, public.match_secrets;
