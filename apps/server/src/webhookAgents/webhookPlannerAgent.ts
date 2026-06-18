import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { logger } from "../services/logger";
import { BIState } from "../graphs/state";

export interface WebhookAnalysisPlan {
  goal: string;
  steps: string[];
  data_sources: string[];
  webhook_endpoint?: string;
  time_range?: { from: string; to: string };
  filters?: Record<string, string>;
}

const webhookPlannerPrompt = ChatPromptTemplate.fromTemplate(`
You are a senior business intelligence analyst planning analysis over live webhook/API data.

Given the user's business question, produce a JSON analysis plan.

Question: {question}

Available webhook data sources:
- analytics_metrics: daily request/error/latency breakdown (fields: date, requests, errors, avg_latency_ms)
- analytics_events: user events (fields: id, user_id, event_type, timestamp, properties_page, properties_referrer)
- analytics_timeseries: pageview trends (fields: timestamp, label, value, change_from_previous)
- ecommerce_carts: shopping cart totals (fields: id, total, discountedTotal, userId, totalProducts, totalQuantity)

Return ONLY valid JSON with this shape:
{{
  "goal": "one-sentence goal",
  "steps": ["load_webhook_data", "compare_periods", "find_anomalies", "visualize", "generate_report"],
  "data_sources": ["analytics_metrics"],
  "webhook_endpoint": "analytics_metrics",
  "time_range": {{ "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }},
  "filters": {{ "range": "7d", "metric": "pageviews" }}
}}

Available steps: load_webhook_data, compare_periods, find_anomalies, find_trends,
find_correlations, segment_analysis, visualize, generate_report.
Pick the single best data_sources entry for the question, and return the selected webhook_endpoint.
`);

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
const parser = new JsonOutputParser<WebhookAnalysisPlan>();

export async function webhookPlannerAgent(state: BIState): Promise<Partial<BIState>> {
  logger.info({ question: state.question }, "Webhook planner agent started");

  const plan = await webhookPlannerPrompt.pipe(llm).pipe(parser).invoke({
    question: state.question,
  });

  logger.info({ plan }, "Webhook planner agent completed");

  return {
    plan,
    agent_trace: [
      ...(state.agent_trace ?? []),
      { agent: "webhook_planner", status: "success", output: plan },
    ],
  };
}
