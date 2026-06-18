import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { logger } from "../services/logger";
import { BIState } from "../graphs/state";

export interface ChartConfig {
  type: "bar" | "line" | "pie" | "heatmap" | "scatter" | "kpi_card" | "table" | "area";
  title: string;
  description?: string;
  labels?: string[];
  values?: number[];
  series?: Array<{ name: string; data: number[] }>;
  x_axis_label?: string;
  y_axis_label?: string;
  color_scheme?: "blue" | "red" | "green" | "orange" | "purple" | "multi";
  // For KPI cards
  kpi_value?: string;
  kpi_trend?: "up" | "down" | "flat";
  kpi_change?: string;
}

const visualizerPrompt = ChatPromptTemplate.fromTemplate(`
You are a data visualization expert. Based on the findings and raw data, 
design the most effective charts to communicate insights.

Findings summary: {findings_summary}
Top drivers: {top_drivers}
Raw data sample: {data_sample}

Return ONLY valid JSON array of chart configs (2-4 charts):
[
  {{
    "type": "bar",
    "title": "Revenue by Region Q1 vs Q2",
    "labels": ["North America", "South Asia", "Europe"],
    "values": [24000, 8000, 15000],
    "x_axis_label": "Region",
    "y_axis_label": "Revenue (USD)",
    "color_scheme": "blue"
  }},
  {{
    "type": "kpi_card",
    "title": "Revenue Change",
    "kpi_value": "-26%",
    "kpi_trend": "down",
    "kpi_change": "vs Q1 2024",
    "color_scheme": "red"
  }},
  {{
    "type": "line",
    "title": "Monthly Revenue Trend",
    "series": [
      {{ "name": "Q1", "data": [8000, 8500, 7800] }},
      {{ "name": "Q2", "data": [6000, 5500, 6500] }}
    ],
    "x_axis_label": "Month",
    "y_axis_label": "Revenue",
    "color_scheme": "multi"
  }}
]
`);

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.2 });
const parser = new JsonOutputParser<ChartConfig[]>();

export async function visualizerAgent(state: BIState): Promise<Partial<BIState>> {
  logger.info("Visualizer agent started");

  const charts = await visualizerPrompt.pipe(llm).pipe(parser).invoke({
    findings_summary: state.findings?.summary ?? "",
    top_drivers: JSON.stringify(state.findings?.top_drivers ?? []),
    data_sample: JSON.stringify(state.raw_data?.rows?.slice(0, 50) ?? []),
  });

  logger.info({ chart_count: charts.length }, "Visualizer completed");

  return {
    charts,
    agent_trace: [
      ...(state.agent_trace ?? []),
      { agent: "visualizer", status: "success", output: charts },
    ],
  };
}