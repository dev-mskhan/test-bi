export interface RawData {
  query: string;
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  source?: "postgresql" | "webhook";
  fetched_at?: string;
}

export interface WebhookConnectionConfig {
  endpoint: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  bodyTemplate?: Record<string, unknown>;
  dataPath?: string;
  description?: string;
}
