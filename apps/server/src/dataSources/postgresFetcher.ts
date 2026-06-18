import { Pool } from "pg";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { logger } from "../services/logger";
import type { AnalysisPlan } from "../agents/plannerAgent";
import type { RawData } from "./types";

const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "bi_platform",
  user: process.env.DB_USER ?? "bi_user",
  password: process.env.DB_PASSWORD ?? "pass",
});

const sqlGenPrompt = ChatPromptTemplate.fromTemplate(`
You are a PostgreSQL expert. Generate a SQL query for this task.

Business goal: {goal}
Steps to execute: {steps}
Filters: {filters}
Time range: {time_range}

Available tables:
- events(id UUID, event_type ENUM, entity_type ENUM, entity_id TEXT, value NUMERIC, metadata JSON, occurred_at TIMESTAMPTZ)
- metrics(id UUID, metric_name TEXT, value NUMERIC, dimension ENUM, dimension_value TEXT, period DATE, recorded_at TIMESTAMPTZ)
- entities(id UUID, type ENUM, name TEXT, segment ENUM, attributes JSON, created_at TIMESTAMPTZ)

CRITICAL RULES:
- entities.id is UUID, events.entity_id is TEXT — always cast: events.entity_id::uuid = entities.id
- Every table referenced in SELECT, WHERE, or JOIN must appear in the FROM clause.
- Do NOT use implicit cross joins or reference a table only in a subquery alias without aliasing correctly.
- When using CTEs (WITH ...), reference only the CTE name in subsequent FROM clauses, not the original table.
- Use explicit JOIN ... ON ... syntax, never comma-separated tables.
- Return ONLY the raw SQL query, no explanation, no markdown, no backticks.
`);

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

export async function fetchFromPostgres(plan: AnalysisPlan): Promise<RawData> {
  const sql = await sqlGenPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())
    .invoke({
      goal: plan.goal ?? "",
      steps: JSON.stringify(plan.steps ?? []),
      filters: JSON.stringify(plan.filters ?? {}),
      time_range: JSON.stringify(plan.time_range ?? {}),
    });

  const cleanSql = sql.replace(/```sql|```/g, "").trim();
  logger.info({ sql: cleanSql }, "Executing SQL");

  const result = await pool.query(cleanSql);

  return {
    query: cleanSql,
    columns: result.fields.map((f) => f.name),
    rows: result.rows,
    row_count: result.rowCount ?? 0,
    source: "postgresql",
    fetched_at: new Date().toISOString(),
  };
}
