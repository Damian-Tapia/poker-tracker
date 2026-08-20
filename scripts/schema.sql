-- Run once against the external Postgres server:
-- psql "$DATABASE_URL" -f scripts/schema.sql

CREATE TABLE IF NOT EXISTS players (
  id          TEXT      PRIMARY KEY,
  name        TEXT      NOT NULL,
  avatar      TEXT,
  created_at  BIGINT    NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT      PRIMARY KEY,
  date        BIGINT    NOT NULL,
  location    TEXT,
  status      TEXT      NOT NULL CHECK (status IN ('open', 'closed')),
  mode        TEXT      CHECK (mode IN ('real', 'play')),
  currency    TEXT      NOT NULL DEFAULT 'MXN',
  rake        NUMERIC(12,2) NOT NULL DEFAULT 0,
  chip_rack   JSONB,
  created_at  BIGINT    NOT NULL,
  closed_at   BIGINT
);

CREATE TABLE IF NOT EXISTS session_players (
  id          TEXT      PRIMARY KEY,
  session_id  TEXT      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id   TEXT      NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seat        INTEGER,
  joined_at   BIGINT    NOT NULL,
  UNIQUE (session_id, player_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT      PRIMARY KEY,
  session_id  TEXT      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id   TEXT      NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type        TEXT      NOT NULL CHECK (type IN ('BUY_IN','REBUY','CASHOUT','BET','POT_WIN')),
  money       NUMERIC(12,2) NOT NULL,
  chips       NUMERIC(12,2) NOT NULL,
  ts          BIGINT    NOT NULL,
  note        TEXT
);

CREATE TABLE IF NOT EXISTS round_results (
  id                TEXT    PRIMARY KEY,
  session_id        TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round             INTEGER NOT NULL,
  bets              JSONB   NOT NULL,
  winner_player_id  TEXT    NOT NULL REFERENCES players(id),
  ts                BIGINT  NOT NULL
);
