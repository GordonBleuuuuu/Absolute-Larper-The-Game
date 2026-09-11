-- Multiplayer strikes, short-code joining, Focus Blooms, and timed rounds.

alter table public.matches
  add column if not exists round_ends_at timestamptz,
  add column if not exists losing_player_id uuid references public.match_players(id) on delete set null;

alter table public.match_players
  add column if not exists strike_count integer not null default 0,
  add column if not exists bloom_charges integer not null default 2,
  add column if not exists bloom_active boolean not null default false,
  add column if not exists is_eliminated boolean not null default false;

create or replace function public.join_typing_room_by_code(p_room_code text, p_display_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_match_id uuid;
begin
  select id into v_match_id from public.matches where room_code = upper(btrim(p_room_code));
  if not found then raise exception 'That invite code does not exist'; end if;
  return public.join_typing_room(v_match_id, p_display_name);
end;
$$;

create or replace function public.use_focus_bloom(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.match_players set bloom_charges = bloom_charges - 1, bloom_active = true
  where match_id = p_match_id and user_id = auth.uid() and bloom_charges > 0 and not bloom_active and not is_eliminated;
  if not found then raise exception 'No Focus Bloom is available'; end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.record_typing_mistake(p_match_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_player public.match_players%rowtype; v_strikes integer;
begin
  select * into v_player from public.match_players where match_id = p_match_id and user_id = auth.uid() for update;
  if not found or v_player.is_eliminated then raise exception 'You are out of this round'; end if;
  if v_player.bloom_active then
    update public.match_players set bloom_active = false where id = v_player.id;
    return jsonb_build_object('protected', true);
  end if;
  update public.match_players set strike_count = strike_count + 1 where id = v_player.id returning strike_count into v_strikes;
  if v_strikes >= 3 then
    update public.match_players set is_eliminated = true where id = v_player.id;
  end if;
  return jsonb_build_object('strikes', v_strikes, 'eliminated', v_strikes >= 3);
end;
$$;

create or replace function public.start_typing_room(p_match_id uuid, p_words jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ready_players integer;
begin
  if jsonb_typeof(p_words) <> 'array' or jsonb_array_length(p_words) <> 50 then raise exception 'A round needs exactly fifty words'; end if;
  if exists (select 1 from jsonb_array_elements_text(p_words) word where word !~ '^[a-z]{2,32}$') then raise exception 'The word list is invalid'; end if;
  if not exists (select 1 from public.matches where id = p_match_id and host_user_id = auth.uid() and status = 'lobby') then raise exception 'Only the host can start'; end if;
  select count(*) into v_ready_players from public.match_players where match_id = p_match_id and ready;
  if v_ready_players < 2 then raise exception 'Wait for two ready players'; end if;
  update public.matches set status='playing', word_sequence=p_words, round_starts_at=now()+interval '3 seconds', round_ends_at=now()+interval '93 seconds', team_score=0, winner_player_id=null, losing_player_id=null where id=p_match_id;
  update public.match_players set word_index=0, words_completed=0, mistakes=0, public_contributed=0, last_word_at=null, strike_count=0, bloom_charges=2, bloom_active=false, is_eliminated=false where match_id=p_match_id;
  update public.match_secrets secrets set hidden_combo_count=0, embezzled_points=0, flawless_run=false from public.match_players players where players.id=secrets.player_id and players.match_id=p_match_id;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.join_typing_room_by_code(text,text) from public;
revoke all on function public.use_focus_bloom(uuid) from public;
revoke all on function public.record_typing_mistake(uuid) from public;
grant execute on function public.join_typing_room_by_code(text,text) to authenticated;
grant execute on function public.use_focus_bloom(uuid) to authenticated;
grant execute on function public.record_typing_mistake(uuid) to authenticated;
