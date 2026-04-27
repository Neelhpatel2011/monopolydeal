create table if not exists public.player_sessions (
  token_hash text primary key,
  game_id uuid not null references public.games (id) on delete cascade,
  player_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz null,
  last_seen_at timestamptz null
);

create index if not exists player_sessions_game_id_idx
  on public.player_sessions (game_id);

create unique index if not exists player_sessions_active_player_unique
  on public.player_sessions (game_id, player_id)
  where revoked_at is null;
