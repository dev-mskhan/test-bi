import { Analysis } from "../types";

export type AnalysisSource = "database" | "webhook";

export function isWebhookAnalysis(analysis: Partial<Analysis> | undefined): boolean {
  if (!analysis) return false;

  const plan = analysis.plan as {
    webhook_endpoint?: string;
    steps?: string[];
    data_sources?: string[];
  } | null;

  if (!plan) return false;

  if (plan.webhook_endpoint) return true;
  if (plan.steps?.some((s) => s.includes("webhook"))) return true;
  if (plan.data_sources?.some((s) => s.startsWith("analytics_") || s === "ecommerce_carts")) {
    return true;
  }

  const rawData = (analysis as { raw_data?: { source?: string } }).raw_data;
  if (rawData?.source === "webhook") return true;

  return false;
}

export function getAnalysisSource(analysis: Partial<Analysis> | undefined): AnalysisSource {
  return isWebhookAnalysis(analysis) ? "webhook" : "database";
}

export function getPipelineLabel(source: AnalysisSource): string {
  return source === "webhook"
    ? "Webhook Planner → Webhook Data → Investigator → Visualizer → Reporter"
    : "Planner → Data Agent → Investigator → Visualizer → Reporter";
}

export function normalizeStatus(status: string | undefined): string {
  if (!status) return "pending";
  if (status === "done") return "completed";
  return status;
}

export function isTerminalStatus(status: string | undefined): boolean {
  if (!status) return false;
  return status !== "pending" && status !== "running";
}
