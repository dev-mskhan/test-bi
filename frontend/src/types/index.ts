export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
  createdAt: string;
  webhook_id?: string;
  webhook_url?: string;
};

export type Analysis = {
  id: string;
  question: string;
  plan: {
    goal?: string;
    steps?: string[];
    data_sources?: string[];
    webhook_endpoint?: string;
    time_range?: { from: string; to: string };
    filters?: Record<string, string>;
  } | null;
  raw_data?: {
    query?: string;
    columns?: string[];
    rows?: Record<string, unknown>[];
    row_count?: number;
    source?: "postgresql" | "webhook";
    fetched_at?: string;
  } | null;
  findings: {
    summary: string;
    anomalies?: Array<{ field: string; value: number; zscore: number; description: string }>;
    trends?: Array<{ direction: "up" | "down" | "flat"; magnitude: number; period: string; description: string }>;
    correlations?: Array<{ field_a: string; field_b: string; correlation: number; interpretation: string }>;
    top_drivers?: string[];
    risk_level?: "low" | "medium" | "high" | "critical";
    confidence_score?: number;
  } | null;
  report: {
    executive_summary?: string;
    root_causes?: string[];
    key_findings?: string[];
    recommendations?: string[];
    next_actions?: Array<{ action: string; owner: string; priority: "high" | "medium" | "low"; deadline: string }>;
    confidence_score?: number;
    risk_level?: "low" | "medium" | "high" | "critical";
  } | null;
  status: "pending" | "running" | "completed" | "failed" | "done";
  charts: ChartConfig[];
  createdAt: string;
  created_at?: string;
  error?: string | null;
};

export type ChartConfig = {
  type: "bar" | "line" | "pie" | "heatmap" | "scatter" | "kpi_card" | "table" | "area";
  title: string;
  labels?: string[];
  values?: number[];
  series?: { name: string; data: number[] }[];
  kpi_value?: string;
  kpi_trend?: "up" | "down" | "flat";
  kpi_change?: string;
  color_scheme?: "blue" | "red" | "green" | "orange" | "purple" | "multi";
};

export type Metric = {
  id: string;
  metric_name: string;
  value: number;
  dimension: string;
  dimension_value: string;
  period: string;
  recorded_at: string;
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  trigger_type: "schedule" | "event" | "manual";
  trigger_config: {
    cron?: string;
    timezone?: string;
    event_type?: string;
    threshold?: number;
  };
  steps: {
    order: number;
    agent: "planner" | "data_agent" | "investigator" | "visualizer" | "reporter";
    task: string;
    config?: Record<string, unknown>;
  }[];
  output_type: "email" | "slack" | "dashboard" | "pdf" | "webhook" | "none";
  output_config: Record<string, unknown>;
  is_active: boolean;
  created_by: string;
  last_run: string | null;
  next_run: string | null;
};

export type WorkflowRun = {
  id: string;
  workflow_id: string;
  status: "running" | "success" | "failed";
  started_at: string;
  finished_at: string | null;
  result: {
    analysis_id?: string;
    report?: any;
  } | null;
  error: string | null;
  step_results?: StepResult[];
};

export type StepResult = {
  id: string;
  run_id: string;
  step_order: number;
  agent: "planner" | "data_agent" | "investigator" | "visualizer" | "reporter";
  input: object;
  output: any;
  duration_ms: number | null;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  error: string | null;
  created_at: string;
};

export type DataSource = {
  id: string;
  name: string;
  type: "postgresql" | "api" | "csv";
  last_synced: string | null;
  connection_config?: {
    endpoint?: string;
    method?: string;
    dataPath?: string;
    description?: string;
  };
  is_active?: boolean;
};

export type WebhookAnalysisCreateResponse = {
  analysis_id: string;
  status: string;
  source: "webhook";
  data_source_id?: string;
};

export type Event = {
  id: string;
  event_type: "sale" | "churn" | "signup" | "refund";
  entity_type: "customer" | "product" | "campaign";
  entity_id: string;
  value: number;
  metadata: Record<string, unknown>;
  occurred_at: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type ApiError = {
  success: false;
  statusCode: number;
  message: string;
};
