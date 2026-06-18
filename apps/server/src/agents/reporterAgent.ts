import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { logger } from "../services/logger";
import { BIState } from "../graphs/state";
import { embedText } from "../services/embeddings";
import { prisma } from "../services/prisma";

export interface Report {
  executive_summary: string;
  root_causes: string[];
  key_findings: string[];
  recommendations: string[];
  next_actions: Array<{ action: string; owner: string; priority: "high" | "medium" | "low"; deadline: string }>;
  confidence_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
}

const reporterPrompt = ChatPromptTemplate.fromTemplate(`
You are a senior business intelligence consultant writing an executive report.

Original question: {question}

Findings:
{findings}

Charts generated: {chart_count} visualizations

Write a professional business intelligence report. Return ONLY valid JSON:
{{
  "executive_summary": "2-3 paragraph executive summary",
  "root_causes": ["Root cause 1", "Root cause 2"],
  "key_findings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommendations": ["Strategic recommendation 1", "Recommendation 2"],
  "next_actions": [
    {{ "action": "Implement priority support SLA for enterprise", "owner": "Customer Success", "priority": "high", "deadline": "2024-08-01" }}
  ],
  "confidence_score": 0.87,
  "risk_level": "high"
}}
`);

const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.3 });
const parser = new JsonOutputParser<Report>();

export async function reporterAgent(state: BIState): Promise<Partial<BIState>> {
  logger.info("Reporter agent started");

  const report = await reporterPrompt.pipe(llm).pipe(parser).invoke({
    question: state.question,
    findings: JSON.stringify(state.findings ?? {}),
    chart_count: state.charts?.length ?? 0,
  });

  // Persist analysis to DB
  const reportText = report.executive_summary;
  const embedding = await embedText(reportText);

  await prisma.analyses.update({
    where: { id: state.analysis_id! },
    data: {
      plan: state.plan as object,
      raw_data: state.raw_data as object,
      findings: state.findings as object,
      charts: state.charts as object,
      report: report as object,
      status: "done",
      finished_at: new Date(),
    },
  });

  // Update pgvector embedding using raw SQL
  await prisma.$executeRaw`
    UPDATE analyses
    SET embedding = ${JSON.stringify(embedding)}::vector
    WHERE id = ${state.analysis_id!}::uuid
  `;

  logger.info({ confidence: report.confidence_score }, "Reporter completed — analysis saved");

  return {
    report,
    agent_trace: [
      ...(state.agent_trace ?? []),
      { agent: "reporter", status: "success", output: report },
    ],
  };
}