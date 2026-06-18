import { StateGraph, END, START } from "@langchain/langgraph";
import { BIStateAnnotation, BIState, initialState, AgentTrace } from "./state";
import { plannerAgent } from "../agents/plannerAgent";
import { dataAgent } from "../agents/dataAgent";
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

export const biGraph = new StateGraph(BIStateAnnotation)
  .addNode("planner",      withErrorHandling(plannerAgent,      "planner"))
  .addNode("data_agent",   withErrorHandling(dataAgent,         "data_agent"))
  .addNode("investigator", withErrorHandling(investigatorAgent, "investigator"))
  .addNode("visualizer",   withErrorHandling(visualizerAgent,   "visualizer"))
  .addNode("reporter",     withErrorHandling(reporterAgent,     "reporter"))

  .addEdge(START, "planner")

  .addConditionalEdges("planner",      shouldContinue, { continue: "data_agent",   stop: END })
  .addConditionalEdges("data_agent",   shouldContinue, { continue: "investigator", stop: END })
  .addConditionalEdges("investigator", shouldContinue, { continue: "visualizer",   stop: END })
  .addConditionalEdges("visualizer",   shouldContinue, { continue: "reporter",     stop: END })

  .addEdge("reporter", END)
  .compile();

export async function runAnalysis(
  question: string,
  analysisId: string
): Promise<BIState> {
  logger.info({ question, analysisId }, "Starting BI analysis graph");
  const finalState = await biGraph.invoke(initialState(question, analysisId));
  return finalState as BIState;
}