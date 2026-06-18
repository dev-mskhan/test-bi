-- ============================================================
-- MAIN SERVER DATABASE  (run on: main_db)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- ============================================================
-- WEBHOOK SERVER DATABASE  (run on: webhook_db)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Webhook dashboard users (separate auth)
CREATE TABLE IF NOT EXISTS dashboard_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboard_refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES dashboard_users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Registered webhook endpoints (created by main server on startup)
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_user_id         UUID NOT NULL REFERENCES dashboard_users(id) ON DELETE CASCADE,
  webhook_id      TEXT UNIQUE NOT NULL,   -- e.g. "wh_user_events"
  name            TEXT NOT NULL,
  secret          TEXT NOT NULL,          -- HMAC secret, store hashed
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- One row per inbound webhook event
CREATE TABLE IF NOT EXISTS webhook_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id     UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,          -- e.g. "user.registered"
  payload         JSONB NOT NULL,
  headers         JSONB,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','success','failed')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- One row per delivery attempt
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id          UUID NOT NULL REFERENCES webhook_logs(id) ON DELETE CASCADE,
  attempt         INT NOT NULL DEFAULT 1,
  status          TEXT NOT NULL CHECK (status IN ('queued','processing','delivered','failed','retrying')),
  response_status INT,                    -- HTTP status from target
  response_body   TEXT,
  response_time   INT,                    -- ms
  error_message   TEXT,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_endpoint    ON webhook_logs(endpoint_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_event       ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_logs_status      ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_log   ON webhook_deliveries(log_id, attempt);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON webhook_deliveries(status)
  WHERE status IN ('queued','retrying','processing');