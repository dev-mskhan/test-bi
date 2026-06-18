import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { logger } from "../services/logger";
import { BIState } from "../graphs/state";

export interface AnalysisPlan {
  goal: string;
  steps: string[];
  data_sources: string[];
  time_range?: { from: string; to: string };
  filters?: Record<string, string>;
}

const plannerPrompt = ChatPromptTemplate.fromTemplate(`
You are a senior business intelligence analyst and task planner.

Given the user's business question, produce a JSON analysis plan.

Question: {question}

Return ONLY valid JSON with this shape:
{{
  "goal": "one-sentence goal",
  "steps": ["load_sales", "compare_periods", "find_anomalies", "visualize", "generate_report"],
  "data_sources": ["events", "metrics", "entities"],
  "time_range": {{ "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }},
  "filters": {{ "segment": "enterprise", "region": "North" }}
}}

Available steps: load_data, compare_periods, find_anomalies, find_trends,
find_correlations, segment_analysis, visualize, generate_report.
Available data_sources: events, metrics, entities, data_sources.
`);

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

const parser = new JsonOutputParser<AnalysisPlan>();

const chain = plannerPrompt.pipe(llm).pipe(parser);

export async function plannerAgent(state: BIState): Promise<Partial<BIState>> {
  logger.info({ question: state.question }, "Planner agent started");

  const plan = await chain.invoke({ question: state.question });

  logger.info({ plan }, "Planner agent completed");

  return {
    plan,
    agent_trace: [
      ...(state.agent_trace ?? []),
      { agent: "planner", status: "success", output: plan },
    ],
  };
}