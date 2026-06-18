-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE event_type_enum AS ENUM (
  'sale', 'churn', 'signup', 'refund', 'upgrade',
  'downgrade', 'support_ticket', 'login', 'page_view', 'custom'
);

CREATE TYPE entity_type_enum AS ENUM (
  'customer', 'product', 'region', 'campaign', 'employee', 'vendor'
);

CREATE TYPE segment_enum AS ENUM (
  'enterprise', 'smb', 'startup', 'free', 'trial', 'churned'
);

CREATE TYPE data_source_type_enum AS ENUM (
  'postgresql', 'mysql', 'csv', 'excel', 'api', 'stripe',
  'salesforce', 'hubspot', 'bigquery', 'mongodb'
);

CREATE TYPE workflow_status_enum AS ENUM (
  'running', 'success', 'failed', 'cancelled', 'skipped'
);

CREATE TYPE trigger_type_enum AS ENUM (
  'schedule', 'event', 'manual'
);

CREATE TYPE output_type_enum AS ENUM (
  'email', 'slack', 'dashboard', 'pdf', 'webhook', 'none'
);

CREATE TYPE agent_name_enum AS ENUM (
  'planner', 'data_agent', 'investigator', 'visualizer', 'reporter'
);

CREATE TYPE step_status_enum AS ENUM (
  'pending', 'running', 'success', 'failed', 'skipped'
);

CREATE TYPE user_role_enum AS ENUM (
  'admin', 'analyst', 'viewer'
);

CREATE TYPE chart_type_enum AS ENUM (
  'bar', 'line', 'pie', 'heatmap', 'scatter',
  'kpi_card', 'table', 'area', 'funnel'
);

CREATE TYPE dimension_enum AS ENUM (
  'region', 'product', 'segment', 'channel',
  'campaign', 'time_period', 'employee', 'custom'
);

-- ============================================================
-- USERS (admin role for workflow report delivery)
-- ============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          user_role_enum NOT NULL DEFAULT 'viewer',
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  notify_email  BOOLEAN NOT NULL DEFAULT TRUE,   -- receive scheduled reports
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DATA SOURCES
-- ============================================================

CREATE TABLE data_sources (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  type              data_source_type_enum NOT NULL,
  connection_config JSONB NOT NULL DEFAULT '{}',
  -- { host, port, database, user, password, endpoint, apiKey }
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ENTITIES  (dimensions — who/what things are)
-- ============================================================

CREATE TABLE entities (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       entity_type_enum NOT NULL,
  name       TEXT NOT NULL,
  segment    segment_enum,
  attributes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_segment ON entities(segment);

-- ============================================================
-- EVENTS  (raw business signals)
-- ============================================================

CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type   event_type_enum NOT NULL,
  entity_type  entity_type_enum NOT NULL,
  entity_id    TEXT NOT NULL,             -- FK-less, cross-source
  value        NUMERIC(18,4),
  metadata     JSONB NOT NULL DEFAULT '{}',
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_type        ON events(event_type);
CREATE INDEX idx_events_entity      ON events(entity_type, entity_id);
CREATE INDEX idx_events_occurred_at ON events(occurred_at DESC);

-- ============================================================
-- METRICS  (pre-calculated KPIs)
-- ============================================================

CREATE TABLE metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name     TEXT NOT NULL,          -- 'monthly_revenue', 'churn_rate'
  value           NUMERIC(18,4) NOT NULL,
  dimension       dimension_enum NOT NULL,
  dimension_value TEXT NOT NULL,          -- 'North', 'Enterprise', 'Product A'
  period          DATE NOT NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metrics_name   ON metrics(metric_name);
CREATE INDEX idx_metrics_period ON metrics(period DESC);

-- ============================================================
-- ANALYSES  (one per user question / investigation run)
-- ============================================================

CREATE TABLE analyses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question   TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Planner Agent output
  plan       JSONB,
  -- {
  --   "goal": "Find why Q2 sales dropped",
  --   "steps": ["load_sales", "compare_q1_q2", "find_anomalies", "generate_report"],
  --   "data_sources": ["events", "metrics"],
  --   "time_range": { "from": "2024-04-01", "to": "2024-06-30" }
  -- }

  -- Data Agent output
  raw_data   JSONB,
  -- {
  --   "tables": [{ "name": "sales_q2", "rows": [...], "columns": [...] }],
  --   "query_log": ["SELECT ..."],
  --   "row_count": 1240
  -- }

  -- Investigator Agent output
  findings   JSONB,
  -- {
  --   "summary": "Sales dropped 30% in the South region",
  --   "anomalies": [{ "field": "revenue", "value": 1200, "zscore": -3.2 }],
  --   "trends": [{ "direction": "down", "magnitude": 0.30, "period": "Q2" }],
  --   "correlations": [{ "a": "support_tickets", "b": "churn", "r": 0.87 }],
  --   "top_drivers": ["South region", "Product B", "Enterprise segment"]
  -- }

  -- Visualizer Agent output
  charts     JSONB,
  -- [
  --   { "type": "bar", "title": "Revenue by Region", "labels": [...], "values": [...] },
  --   { "type": "line", "title": "Q1 vs Q2 Trend", "series": [...] },
  --   { "type": "kpi_card", "label": "Revenue Drop", "value": "-30%", "trend": "down" }
  -- ]

  -- Reporter Agent output
  report     JSONB,
  -- {
  --   "executive_summary": "...",
  --   "root_causes": ["..."],
  --   "recommendations": ["..."],
  --   "next_actions": ["..."],
  --   "confidence_score": 0.87
  -- }

  -- Vector embedding of the report for semantic search
  embedding  vector(1536),

  status     TEXT NOT NULL DEFAULT 'pending',  -- pending|running|done|failed
  error      TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analyses_user ON analyses(created_by);
CREATE INDEX idx_analyses_embedding ON analyses USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- WORKFLOWS
-- ============================================================

CREATE TABLE workflows (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  description    TEXT,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  trigger_type   trigger_type_enum NOT NULL DEFAULT 'schedule',
  trigger_config JSONB NOT NULL DEFAULT '{}',
  -- schedule:  { "cron": "0 9 * * *", "timezone": "Asia/Karachi" }
  -- event:     { "event_type": "churn", "threshold": 0.05 }
  steps          JSONB NOT NULL DEFAULT '[]',
  -- [{ "order": 1, "agent": "data_agent", "task": "load_sales", "config": {} }]
  output_type    output_type_enum NOT NULL DEFAULT 'email',
  output_config  JSONB NOT NULL DEFAULT '{}',
  -- email:  { "to": ["admin@co.com"], "subject": "Daily Report" }
  -- slack:  { "webhook": "https://...", "channel": "#reports" }
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_run       TIMESTAMPTZ,
  next_run       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKFLOW RUNS  (every execution instance)
-- ============================================================

CREATE TABLE workflow_runs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status      workflow_status_enum NOT NULL DEFAULT 'running',
  triggered_by trigger_type_enum NOT NULL DEFAULT 'schedule',
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  result      JSONB,
  -- { "analysis_id": "...", "report": {...}, "charts": [...] }
  error       TEXT
);

CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status   ON workflow_runs(status);

-- ============================================================
-- STEP RESULTS  (each agent's result within a run)
-- ============================================================

CREATE TABLE step_results (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id           UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_order       INT NOT NULL,
  agent            agent_name_enum NOT NULL,
  input            JSONB NOT NULL DEFAULT '{}',
  output           JSONB NOT NULL DEFAULT '{}',
  duration_ms      INT,
  status           step_status_enum NOT NULL DEFAULT 'pending',
  error            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_step_results_run ON step_results(run_id);


-- Data Sources
INSERT INTO data_sources (id, name, type, connection_config, last_synced) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Main PostgreSQL', 'postgresql',
   '{"host":"localhost","port":5432,"database":"bi_platform","user":"bi_user"}',
   NOW() - INTERVAL '1 hour'),
  ('b0000000-0000-0000-0000-000000000002', 'Stripe API', 'stripe',
   '{"endpoint":"https://api.stripe.com","apiKey":"sk_test_xxx"}',
   NOW() - INTERVAL '30 minutes'),
  ('b0000000-0000-0000-0000-000000000003', 'Sales CSV Export', 'csv',
   '{"filePath":"/data/sales_2024.csv","delimiter":","}',
   NOW() - INTERVAL '2 hours'),
  -- Free public webhook/API sources (no auth required)
  ('b0000000-0000-0000-0000-000000000004', 'Analytics Metrics API', 'api',
   '{"endpoint":"https://fakeapifordevs.vercel.app/api/analytics/metrics","method":"GET","dataPath":"breakdown","description":"Daily requests, errors, latency. Params: range=7d|30d"}',
   NOW() - INTERVAL '5 minutes'),
  ('b0000000-0000-0000-0000-000000000005', 'Analytics Events API', 'api',
   '{"endpoint":"https://fakeapifordevs.vercel.app/api/analytics/events","method":"GET","dataPath":"data","description":"User events: page_view, click, purchase, signup, login. Params: limit=N"}',
   NOW() - INTERVAL '5 minutes'),
  ('b0000000-0000-0000-0000-000000000006', 'Analytics Timeseries API', 'api',
   '{"endpoint":"https://fakeapifordevs.vercel.app/api/analytics/timeseries","method":"GET","dataPath":"data","description":"Pageview time series. Params: metric=pageviews&granularity=day"}',
   NOW() - INTERVAL '5 minutes'),
  ('b0000000-0000-0000-0000-000000000007', 'E-commerce Carts API', 'api',
   '{"endpoint":"https://dummyjson.com/carts","method":"GET","dataPath":"carts","description":"Shopping cart totals and product counts. Params: limit=N&skip=N"}',
   NOW() - INTERVAL '5 minutes');

-- Entities
INSERT INTO entities (id, type, name, segment, attributes) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'customer', 'Acme Corp', 'enterprise',
   '{"industry":"tech","country":"US","mrr":12000}'),
  ('c0000000-0000-0000-0000-000000000002', 'customer', 'Beta Startup', 'startup',
   '{"industry":"fintech","country":"PK","mrr":300}'),
  ('c0000000-0000-0000-0000-000000000003', 'product', 'Analytics Pro', null,
   '{"category":"saas","price":499,"seats":10}'),
  ('c0000000-0000-0000-0000-000000000004', 'product', 'Basic Plan', null,
   '{"category":"saas","price":49,"seats":1}'),
  ('c0000000-0000-0000-0000-000000000005', 'region', 'South Asia', null,
   '{"countries":["PK","IN","BD"],"currency":"USD"}'),
  ('c0000000-0000-0000-0000-000000000006', 'region', 'North America', null,
   '{"countries":["US","CA"],"currency":"USD"}');

-- Events
INSERT INTO events (event_type, entity_type, entity_id, value, metadata, occurred_at) VALUES
  ('sale',   'customer', 'c0000000-0000-0000-0000-000000000001', 12000, '{"product":"Analytics Pro","quarter":"Q1"}', NOW() - INTERVAL '90 days'),
  ('sale',   'customer', 'c0000000-0000-0000-0000-000000000002', 300,   '{"product":"Basic Plan","quarter":"Q1"}',    NOW() - INTERVAL '88 days'),
  ('sale',   'customer', 'c0000000-0000-0000-0000-000000000001', 12000, '{"product":"Analytics Pro","quarter":"Q2"}', NOW() - INTERVAL '60 days'),
  ('churn',  'customer', 'c0000000-0000-0000-0000-000000000002', 300,   '{"reason":"price","segment":"startup"}',     NOW() - INTERVAL '45 days'),
  ('sale',   'customer', 'c0000000-0000-0000-0000-000000000001', 8000,  '{"product":"Analytics Pro","quarter":"Q2","note":"partial_month"}', NOW() - INTERVAL '30 days'),
  ('refund', 'customer', 'c0000000-0000-0000-0000-000000000001', 2000,  '{"reason":"billing_error","quarter":"Q2"}',  NOW() - INTERVAL '29 days'),
  ('signup', 'customer', 'c0000000-0000-0000-0000-000000000003', 0,     '{"plan":"trial","source":"organic"}',        NOW() - INTERVAL '10 days'),
  ('sale',   'customer', 'c0000000-0000-0000-0000-000000000003', 499,   '{"product":"Analytics Pro","quarter":"Q3"}', NOW() - INTERVAL '5 days');

-- Metrics
INSERT INTO metrics (metric_name, value, dimension, dimension_value, period) VALUES
  ('monthly_revenue', 24300, 'time_period', 'Q1-2024', '2024-03-31'),
  ('monthly_revenue', 18000, 'time_period', 'Q2-2024', '2024-06-30'),
  ('churn_rate',      0.04,  'segment',     'startup',  '2024-06-30'),
  ('churn_rate',      0.01,  'segment',     'enterprise','2024-06-30'),
  ('monthly_revenue', 9000,  'region',      'North America', '2024-06-30'),
  ('monthly_revenue', 3000,  'region',      'South Asia',    '2024-06-30'),
  ('monthly_revenue', 6000,  'region',      'North America', '2024-03-31'),
  ('churn_rate',      0.08,  'region',      'South Asia',    '2024-06-30'),
  ('avg_deal_size',   4500,  'segment',     'enterprise',    '2024-06-30'),
  ('avg_deal_size',   300,   'segment',     'startup',       '2024-06-30');