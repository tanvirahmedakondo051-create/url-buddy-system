-- Per-plan Pterodactyl docker image / startup / environment
-- Run this in Supabase Dashboard → SQL editor on YOUR project BEFORE deploying the code.
-- Existing plans keep working: empty (NULL) values fall back to Admin → Settings defaults.
ALTER TABLE plans ADD COLUMN IF NOT EXISTS docker_image text;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS startup text;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS environment text;
