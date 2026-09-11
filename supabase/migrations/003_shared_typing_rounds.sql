-- Shared 50-word rounds, short invite codes, and server-validated scoring.

alter table public.matches
  add column if not exists room_code text,
  add column if not exists word_sequence jsonb not null default '[]'::jsonb,
  add column if not exists round_starts_at timestamptz,
  add column if not exists winner_player_id uuid references public.match_players(id) on delete set null;

update public.matches
set room_code = upper(substr(replace(id::text, '-', ''), 1, 6))
where room_code is null;

alter table public.matches
  alter column room_code set not null;

create unique index if not exists matches_room_code_key on public.matches (room_code);

alter table public.match_players
  add column if not exists word_index integer not null default 0,
  add column if not exists words_completed integer not null default 0,
  add column if not exists mistakes integer not null default 0,
  add column if not exists last_word_at timestamptz;

create or replace function public.create_typing_room(p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_player_id uuid;
  v_room_code text;
  v_name text := left(btrim(p_display_name), 32);
begin
  if auth.uid() is null then raise exception 'Sign in before creating a room'; end if;
  if char_length(v_name) < 2 then raise exception 'Choose a name with at least two characters'; end if;

  loop
    v_room_code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (select 1 from public.matches where room_code = v_room_code);
  end loop;

  insert into public.matches (host_user_id, room_code, required_score)
  values (auth.uid(), v_room_code, 50)
  returning id into v_match_id;

  insert into public.match_players (match_id, user_id, display_name)
  values (v_match_id, auth.uid(), v_name)
  returning id into v_player_id;

  insert into public.match_secrets (player_id) values (v_player_id);
  return jsonb_build_object('match_id', v_match_id, 'room_code', v_room_code);
end;
$$;

create or replace function public.start_typing_room(p_match_id uuid, p_words jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_ready_players integer;
begin
  if jsonb_typeof(p_words) <> 'array' or jsonb_array_length(p_words) <> 50 then
    raise exception 'A round needs exactly fifty words';
  end if;
  if exists (select 1 from jsonb_array_elements_text(p_words) word where word !~ '^[a-z]{2,32}$') then
    raise exception 'The word list is invalid';
  end if;
  if not exists (select 1 from public.matches where id = p_match_id and host_user_id = auth.uid() and status = 'lobby') then
    raise exception 'Only the room host can start this round';
  end if;
  select count(*) into v_ready_players from public.match_players where match_id = p_match_id and ready;
  if v_ready_players < 2 then raise exception 'Wait for at least two ready players'; end if;

  update public.matches
  set status = 'playing', word_sequence = p_words, round_starts_at = now() + interval '3 seconds', team_score = 0, winner_player_id = null
  where id = p_match_id;
  update public.match_players
  set word_index = 0, words_completed = 0, mistakes = 0, public_contributed = 0, last_word_at = null
  where match_id = p_match_id;
  update public.match_secrets secrets
  set hidden_combo_count = 0, embezzled_points = 0, flawless_run = false
  from public.match_players players
  where players.id = secrets.player_id and players.match_id = p_match_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.submit_typed_word(p_match_id uuid, p_word_index integer, p_word text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player public.match_players%rowtype;
  v_expected text;
  v_is_saboteur boolean;
  v_credit integer := 1;
  v_score integer;
begin
  select * into v_player from public.match_players where match_id = p_match_id and user_id = auth.uid() for update;
  if not found then raise exception 'Join this room before typing'; end if;
  if v_player.last_word_at > now() - interval '250 milliseconds' then raise exception 'Slow down, little larper'; end if;

  select word_sequence ->> v_player.word_index into v_expected from public.matches where id = p_match_id and status = 'playing' and round_starts_at <= now() for update;
  if not found or v_expected is null then raise exception 'The round has not started'; end if;
  if p_word_index <> v_player.word_index or lower(p_word) <> v_expected then raise exception 'That word does not match'; end if;

  select is_saboteur into v_is_saboteur from public.match_secrets where player_id = v_player.id for update;
  if v_is_saboteur and (v_player.words_completed + 1) % 5 = 0 then v_credit := 0; end if;

  update public.match_players set word_index = word_index + 1, words_completed = words_completed + 1, public_contributed = public_contributed + v_credit, last_word_at = now(), updated_at = now() where id = v_player.id;
  update public.matches set team_score = team_score + v_credit where id = p_match_id returning team_score into v_score;
  if v_is_saboteur then update public.match_secrets set hidden_combo_count = hidden_combo_count + 1, embezzled_points = embezzled_points + (1 - v_credit), updated_at = now() where player_id = v_player.id; end if;
  if v_score >= 50 then update public.matches set status = 'complete', winner_player_id = v_player.id where id = p_match_id; end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.create_typing_room(text) from public;
revoke all on function public.start_typing_room(uuid, jsonb) from public;
revoke all on function public.submit_typed_word(uuid, integer, text) from public;
grant execute on function public.create_typing_room(text) to authenticated;
grant execute on function public.start_typing_room(uuid, jsonb) to authenticated;
grant execute on function public.submit_typed_word(uuid, integer, text) to authenticated;
