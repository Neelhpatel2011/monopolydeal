alter table public.games
  add column if not exists game_code text;

create unique index if not exists games_lobby_game_code_unique
  on public.games (game_code)
  where status = 'lobby' and game_code is not null;
