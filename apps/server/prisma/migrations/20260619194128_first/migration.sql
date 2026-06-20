-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "agent_name_enum" AS ENUM ('planner', 'data_agent', 'investigator', 'visualizer', 'reporter');

-- CreateEnum
CREATE TYPE "chart_type_enum" AS ENUM ('bar', 'line', 'pie', 'heatmap', 'scatter', 'kpi_card', 'table', 'area', 'funnel');

-- CreateEnum
CREATE TYPE "data_source_type_enum" AS ENUM ('postgresql', 'mysql', 'csv', 'excel', 'api', 'stripe', 'salesforce', 'hubspot', 'bigquery', 'mongodb');

-- CreateEnum
CREATE TYPE "dimension_enum" AS ENUM ('region', 'product', 'segment', 'channel', 'campaign', 'time_period', 'employee', 'custom');

-- CreateEnum
CREATE TYPE "entity_type_enum" AS ENUM ('customer', 'product', 'region', 'campaign', 'employee', 'vendor');

-- CreateEnum
CREATE TYPE "event_type_enum" AS ENUM ('sale', 'churn', 'signup', 'refund', 'upgrade', 'downgrade', 'support_ticket', 'login', 'page_view', 'custom');

-- CreateEnum
CREATE TYPE "output_type_enum" AS ENUM ('email', 'slack', 'dashboard', 'pdf', 'webhook', 'none');

-- CreateEnum
CREATE TYPE "segment_enum" AS ENUM ('enterprise', 'smb', 'startup', 'free', 'trial', 'churned');

-- CreateEnum
CREATE TYPE "step_status_enum" AS ENUM ('pending', 'running', 'success', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "trigger_type_enum" AS ENUM ('schedule', 'event', 'manual');

-- CreateEnum
CREATE TYPE "user_role_enum" AS ENUM ('admin', 'analyst', 'viewer');

-- CreateEnum
CREATE TYPE "workflow_status_enum" AS ENUM ('running', 'success', 'failed', 'cancelled', 'skipped');

-- CreateTable
CREATE TABLE "analyses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "question" TEXT NOT NULL,
    "created_by" UUID,
    "plan" JSONB,
    "raw_data" JSONB,
    "findings" JSONB,
    "charts" JSONB,
    "report" JSONB,
    "embedding" vector,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sources" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "type" "data_source_type_enum" NOT NULL,
    "connection_config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" "entity_type_enum" NOT NULL,
    "name" TEXT NOT NULL,
    "segment" "segment_enum",
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "event_type" "event_type_enum" NOT NULL,
    "entity_type" "entity_type_enum" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "value" DECIMAL(18,4),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "metric_name" TEXT NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "dimension" "dimension_enum" NOT NULL,
    "dimension_value" TEXT NOT NULL,
    "period" DATE NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_results" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "run_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "agent" "agent_name_enum" NOT NULL,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "duration_ms" INTEGER,
    "status" "step_status_enum" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "step_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "user_role_enum" NOT NULL DEFAULT 'viewer',
    "password_hash" TEXT NOT NULL,
    "webhook_url" TEXT NOT NULL DEFAULT 'pending',
    "webhook_id" TEXT NOT NULL DEFAULT 'pending',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notify_email" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "workflow_id" UUID NOT NULL,
    "status" "workflow_status_enum" NOT NULL DEFAULT 'running',
    "triggered_by" "trigger_type_enum" NOT NULL DEFAULT 'schedule',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "result" JSONB,
    "error" TEXT,

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "webhook_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Pakistan',
    "website" TEXT,
    "employee_count" INTEGER,
    "annual_revenue" TEXT,
    "description" TEXT,
    "services" TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_by" UUID,
    "trigger_type" "trigger_type_enum" NOT NULL DEFAULT 'schedule',
    "trigger_config" JSONB NOT NULL DEFAULT '{}',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "output_type" "output_type_enum" NOT NULL DEFAULT 'email',
    "output_config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run" TIMESTAMPTZ(6),
    "next_run" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_analyses_embedding" ON "analyses"("embedding");

-- CreateIndex
CREATE INDEX "idx_analyses_user" ON "analyses"("created_by");

-- CreateIndex
CREATE INDEX "idx_entities_segment" ON "entities"("segment");

-- CreateIndex
CREATE INDEX "idx_entities_type" ON "entities"("type");

-- CreateIndex
CREATE INDEX "idx_events_entity" ON "events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "idx_events_occurred_at" ON "events"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_events_type" ON "events"("event_type");

-- CreateIndex
CREATE INDEX "idx_metrics_name" ON "metrics"("metric_name");

-- CreateIndex
CREATE INDEX "idx_metrics_period" ON "metrics"("period" DESC);

-- CreateIndex
CREATE INDEX "idx_step_results_run" ON "step_results"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_webhook_url_key" ON "users"("webhook_url");

-- CreateIndex
CREATE UNIQUE INDEX "users_webhook_id_key" ON "users"("webhook_id");

-- CreateIndex
CREATE INDEX "idx_workflow_runs_status" ON "workflow_runs"("status");

-- CreateIndex
CREATE INDEX "idx_workflow_runs_workflow" ON "workflow_runs"("workflow_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_user_id_key" ON "business_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "step_results" ADD CONSTRAINT "step_results_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "workflow_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
