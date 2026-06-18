import { StateGraph, END, START } from "@langchain/langgraph";
import { BIStateAnnotation, BIState, AgentTrace } from "./state";
import { webhookPlannerAgent } from "../webhookAgents/webhookPlannerAgent";
import { webhookDataAgent } from "../webhookAgents/webhookDataAgent";
import { investigatorAgent } from "../agents/investigatorAgent";
import { visualizerAgent } from "../agents/visualizerAgent";
import { reporterAgent } from "../agents/reporterAgent";
import { logger } from "../services/logger";

function withErrorHandling(
  agent: (state: BIState) => Promise<Partial<BIState>>,
  agentName: string
) {
  return async (state: BIState): Promise<Partial<BIState>> => {
    try {
      return await agent(state);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ agent: agentName, error: message }, "Agent failed");
      const trace: AgentTrace = { agent: agentName, status: "failed", output: null, error: message };
      return {
        error: `${agentName} failed: ${message}`,
        agent_trace: [trace],
      };
    }
  };
}

function shouldContinue(state: BIState): "continue" | "stop" {
  return state.error ? "stop" : "continue";
}

export const biWebhookGraph = new StateGraph(BIStateAnnotation)
  .addNode("webhook_planner", withErrorHandling(webhookPlannerAgent, "webhook_planner"))
  .addNode("webhook_data_agent", withErrorHandling(webhookDataAgent, "webhook_data_agent"))
  .addNode("investigator", withErrorHandling(investigatorAgent, "investigator"))
  .addNode("visualizer", withErrorHandling(visualizerAgent, "visualizer"))
  .addNode("reporter", withErrorHandling(reporterAgent, "reporter"))

  .addEdge(START, "webhook_planner")

  .addConditionalEdges("webhook_planner", shouldContinue, { continue: "webhook_data_agent", stop: END })
  .addConditionalEdges("webhook_data_agent", shouldContinue, { continue: "investigator", stop: END })
  .addConditionalEdges("investigator", shouldContinue, { continue: "visualizer", stop: END })
  .addConditionalEdges("visualizer", shouldContinue, { continue: "reporter", stop: END })

  .addEdge("reporter", END)
  .compile();

export async function runWebhookAnalysis(
  question: string,
  analysisId: string,
  dataSourceId?: string
): Promise<BIState> {
  logger.info({ question, analysisId, dataSourceId }, "Starting webhook BI analysis graph");
  const finalState = await biWebhookGraph.invoke({
    analysis_id: analysisId,
    question,
    data_source_id: dataSourceId,
    plan: undefined,
    raw_data: undefined,
    findings: undefined,
    charts: undefined,
    report: undefined,
    error: undefined,
    agent_trace: [],
  });
  return finalState as BIState;
}
