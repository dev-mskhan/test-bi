import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { logger } from "../services/logger";
import { BIState } from "../graphs/state";

export interface Findings {
  summary: string;
  anomalies: Array<{ field: string; value: number; zscore: number; description: string }>;
  trends: Array<{ direction: "up" | "down" | "flat"; magnitude: number; period: string; description: string }>;
  correlations: Array<{ field_a: string; field_b: string; correlation: number; interpretation: string }>;
  top_drivers: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  confidence_score: number;
}

const investigatorPrompt = ChatPromptTemplate.fromTemplate(`
You are an expert business data analyst and detective.

Original question: {question}
Analysis goal: {goal}

Raw data (JSON):
{raw_data}

Analyze this data deeply and return ONLY valid JSON:
{{
  "summary": "one paragraph executive summary of what you found",
  "anomalies": [
    {{ "field": "revenue", "value": 1200, "zscore": -3.2, "description": "Revenue in South region dropped 3.2 standard deviations below mean" }}
  ],
  "trends": [
    {{ "direction": "down", "magnitude": 0.30, "period": "Q2-2024", "description": "30% revenue decline vs Q1" }}
  ],
  "correlations": [
    {{ "field_a": "support_tickets", "field_b": "churn", "correlation": 0.87, "interpretation": "High ticket volume strongly predicts churn" }}
  ],
  "top_drivers": ["South region underperformance", "Enterprise churn spike"],
  "risk_level": "high",
  "confidence_score": 0.85
}}
`);

const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.1 });
const parser = new JsonOutputParser<Findings>();

export async function investigatorAgent(state: BIState): Promise<Partial<BIState>> {
  logger.info("Investigator agent started");

  const findings = await investigatorPrompt.pipe(llm).pipe(parser).invoke({
    question: state.question,
    goal: state.plan?.goal ?? "",
    raw_data: JSON.stringify(state.raw_data?.rows?.slice(0, 200) ?? []),
  });

  logger.info({ risk_level: findings.risk_level, confidence: findings.confidence_score }, "Investigator completed");

  return {
    findings,
    agent_trace: [
      ...(state.agent_trace ?? []),
      { agent: "investigator", status: "success", output: findings },
    ],
  };
}