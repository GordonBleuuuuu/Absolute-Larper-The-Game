-- Supabase projects do not always have pgcrypto enabled, so avoid
-- gen_random_bytes() when generating a short, non-secret invite code.
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
    v_room_code := upper(substr(md5(random()::text || clock_timestamp()::text || pg_backend_pid()::text), 1, 6));
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

revoke all on function public.create_typing_room(text) from public;
grant execute on function public.create_typing_room(text) to authenticated;
