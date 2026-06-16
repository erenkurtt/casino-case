CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_games_name_trgm
ON games USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_games_slug_trgm
ON games USING GIN (slug gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_games_provider_name_trgm
ON games USING GIN (provider_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_games_active_created_at
ON games (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_games_active_provider_name
ON games (is_active, provider_name);