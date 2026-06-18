import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { logger } from "../services/logger";
import { prisma } from "../services/prisma";
import type { AnalysisPlan } from "../agents/plannerAgent";
import { normalizeJsonToRawData } from "./normalize";
import type { RawData, WebhookConnectionConfig } from "./types";

const DEFAULT_TIMEOUT_MS = Number(process.env.WEBHOOK_FETCH_TIMEOUT_MS ?? 30000);

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

// ── Prompt: pick the best data source for the goal ───────────────────────────
const sourcePickerPrompt = ChatPromptTemplate.fromTemplate(`
You are a data routing agent. Pick the best API data source for the given business goal.

Available API sources:
{sources}

Business goal: {goal}
Filters: {filters}
Time range: {time_range}

Return ONLY the UUID of the best matching source. No explanation, no markdown.
`);

// ── Prompt: build query params for the chosen source ─────────────────────────
const paramGenPrompt = ChatPromptTemplate.fromTemplate(`
You append query parameters to a webhook URL for a business intelligence fetch.

Base endpoint: {endpoint}
Business goal: {goal}
Filters: {filters}
Time range: {time_range}
Available params hint: {params_hint}

Return ONLY the query string (without leading ?), e.g. range=7d or limit=50&metric=pageviews
If no params needed, return an empty string.
No explanation, no markdown.
`);

function buildUrl(base: string, queryString: string): string {
  if (!queryString.trim()) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${queryString.replace(/^\?/, "")}`;
}

// ── Load all active API sources from DB ──────────────────────────────────────
async function loadAllApiSources(): Promise<{
  id: string;
  name: string;
  config: WebhookConnectionConfig;
}[]> {
  const sources = await prisma.data_sources.findMany({
    where: { type: "api", is_active: true },
  });

  if (!sources.length) throw new Error("No active API data sources found");

  return sources.map((s) => ({
    id:     s.id,
    name:   s.name,
    config: s.connection_config as unknown as WebhookConnectionConfig,
  }));
}

// ── Let the LLM pick the best source for the plan ────────────────────────────
async function pickDataSource(
  sources: { id: string; name: string; config: WebhookConnectionConfig }[],
  plan: AnalysisPlan
): Promise<{ id: string; name: string; config: WebhookConnectionConfig }> {
  const sourcesText = sources
    .map((s) => `ID: ${s.id} | Name: ${s.name} | Description: ${s.config.description ?? "N/A"} | Endpoint: ${s.config.endpoint}`)
    .join("\n");

  const pickedId = await sourcePickerPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())
    .invoke({
      sources:    sourcesText,
      goal:       plan.goal ?? "",
      filters:    JSON.stringify(plan.filters ?? {}),
      time_range: JSON.stringify(plan.time_range ?? {}),
    });

  const cleanId = pickedId.trim().replace(/[^a-f0-9-]/gi, "");
  const match   = sources.find((s) => s.id === cleanId);

  if (!match) {
    logger.warn({ pickedId: cleanId }, "LLM picked unknown source ID, falling back to first");
    return sources[0];
  }

  return match;
}

// ── Build query params for the chosen source ─────────────────────────────────
async function buildQueryParams(
  config: WebhookConnectionConfig,
  plan: AnalysisPlan
): Promise<string> {
  const queryString = await paramGenPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())
    .invoke({
      endpoint:   config.endpoint,
      goal:       plan.goal ?? "",
      filters:    JSON.stringify(plan.filters ?? {}),
      time_range: JSON.stringify(plan.time_range ?? {}),
      params_hint: config.description ?? "See endpoint documentation",
    });

  return queryString.replace(/```|"/g, "").trim();
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function fetchFromWebhook(
  plan: AnalysisPlan,
  dataSourceId?: string
): Promise<RawData> {
  const allSources = await loadAllApiSources();

  // If a specific source was provided use it, otherwise let the LLM pick
  let source: { id: string; name: string; config: WebhookConnectionConfig };

  if (dataSourceId?.trim()) {
    const found = allSources.find((s) => s.id === dataSourceId.trim());
    if (!found) throw new Error(`API data source not found or inactive: ${dataSourceId}`);
    source = found;
  } else {
    source = await pickDataSource(allSources, plan);
  }

  const { id, name, config } = source;

  const queryString = await buildQueryParams(config, plan);
  const url         = buildUrl(config.endpoint, queryString);
  const method      = config.method ?? "GET";

  logger.info({ dataSourceId: id, name, url, method }, "Fetching API data source");

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(config.headers ?? {}),
      },
      body:
        method === "POST" && config.bodyTemplate
          ? JSON.stringify(config.bodyTemplate)
          : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API source ${url} returned ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const rawData = normalizeJsonToRawData(url, payload, config.dataPath);

    logger.info({ dataSourceId: id, name, row_count: rawData.row_count, url }, "API fetch completed");

    return rawData;
  } finally {
    clearTimeout(timeout);
  }
}