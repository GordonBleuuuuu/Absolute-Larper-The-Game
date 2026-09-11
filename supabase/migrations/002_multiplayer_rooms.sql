-- Multiplayer room helpers. Apply after 001_larperbonia_game.sql.

alter table public.matches
  add column if not exists host_user_id uuid references auth.users(id) on delete set null;

alter table public.match_players
  add column if not exists ready boolean not null default false;

create or replace function public.create_typing_room(p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_player_id uuid;
  v_name text := left(btrim(p_display_name), 32);
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating a room';
  end if;

  if char_length(v_name) < 2 then
    raise exception 'Choose a name with at least two characters';
  end if;

  insert into public.matches (host_user_id)
  values (auth.uid())
  returning id into v_match_id;

  insert into public.match_players (match_id, user_id, display_name)
  values (v_match_id, auth.uid(), v_name)
  returning id into v_player_id;

  insert into public.match_secrets (player_id, is_saboteur)
  values (v_player_id, false);

  return jsonb_build_object('match_id', v_match_id);
end;
$$;

create or replace function public.join_typing_room(
  p_match_id uuid,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_name text := left(btrim(p_display_name), 32);
  v_player_count integer;
  v_status text;
  v_has_saboteur boolean;
  v_is_saboteur boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Sign in before joining a room';
  end if;

  if char_length(v_name) < 2 then
    raise exception 'Choose a name with at least two characters';
  end if;

  select status into v_status
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'This room no longer exists';
  end if;

  if v_status <> 'lobby' then
    raise exception 'This room has already started';
  end if;

  select id into v_player_id
  from public.match_players
  where match_id = p_match_id
    and user_id = auth.uid();

  if found then
    return jsonb_build_object('match_id', p_match_id, 'player_id', v_player_id);
  end if;

  select count(*) into v_player_count
  from public.match_players
  where match_id = p_match_id;

  if v_player_count >= 6 then
    raise exception 'This meadow is full';
  end if;

  select exists (
    select 1
    from public.match_secrets secrets
    join public.match_players players on players.id = secrets.player_id
    where players.match_id = p_match_id
      and secrets.is_saboteur
  ) into v_has_saboteur;

  -- At most one secret role per room; its existence is never returned from this RPC.
  v_is_saboteur := not v_has_saboteur and v_player_count >= 2 and random() < 0.25;

  insert into public.match_players (match_id, user_id, display_name)
  values (p_match_id, auth.uid(), v_name)
  returning id into v_player_id;

  insert into public.match_secrets (player_id, is_saboteur)
  values (v_player_id, v_is_saboteur);

  return jsonb_build_object('match_id', p_match_id, 'player_id', v_player_id);
end;
$$;

create or replace function public.set_player_ready(p_match_id uuid, p_ready boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.match_players
  set ready = p_ready,
      updated_at = now()
  where match_id = p_match_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Join this room before changing your ready state';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.start_typing_room(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ready_players integer;
begin
  if not exists (
    select 1 from public.matches
    where id = p_match_id
      and host_user_id = auth.uid()
      and status = 'lobby'
  ) then
    raise exception 'Only the room host can start this round';
  end if;

  select count(*) into v_ready_players
  from public.match_players
  where match_id = p_match_id
    and ready;

  if v_ready_players < 2 then
    raise exception 'Wait for at least two ready players';
  end if;

  update public.matches
  set status = 'playing'
  where id = p_match_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.create_typing_room(text) from public;
revoke all on function public.join_typing_room(uuid, text) from public;
revoke all on function public.set_player_ready(uuid, boolean) from public;
revoke all on function public.start_typing_room(uuid) from public;

grant execute on function public.create_typing_room(text) to authenticated;
grant execute on function public.join_typing_room(uuid, text) to authenticated;
grant execute on function public.set_player_ready(uuid, boolean) to authenticated;
grant execute on function public.start_typing_room(uuid) to authenticated;
