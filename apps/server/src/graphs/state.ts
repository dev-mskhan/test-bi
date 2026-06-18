import { Annotation } from "@langchain/langgraph";
import { AnalysisPlan } from "../agents/plannerAgent";
import { RawData } from "../dataSources/types";
import { Findings } from "../agents/investigatorAgent";
import { ChartConfig } from "../agents/visualizerAgent";
import { Report } from "../agents/reporterAgent";

export interface AgentTrace {
  agent: string;
  status: "success" | "failed" | "skipped";
  output: unknown;
  error?: string;
}

export const BIStateAnnotation = Annotation.Root({
  // Input
  analysis_id:    Annotation<string | undefined>(),
  question:       Annotation<string>(),
  data_source_id: Annotation<string | undefined>(),

  // Agent outputs
  plan:     Annotation<AnalysisPlan | undefined>(),
  raw_data: Annotation<RawData | undefined>(),
  findings: Annotation<Findings | undefined>(),
  charts:   Annotation<ChartConfig[] | undefined>(),
  report:   Annotation<Report | undefined>(),

  // Control
  error: Annotation<string | undefined>(),
  agent_trace: Annotation<AgentTrace[]>({
    reducer: (existing, update) => update,
    default: () => [],
  }),
});

export type BIState = typeof BIStateAnnotation.State;

export const initialState = (question: string, analysis_id: string, data_source_id?: string): BIState => ({
  analysis_id,
  question,
  data_source_id,
  plan:        undefined,
  raw_data:    undefined,
  findings:    undefined,
  charts:      undefined,
  report:      undefined,
  error:       undefined,
  agent_trace: [],
});