import { logger } from "../services/logger";
import { BIState } from "../graphs/state";
import { fetchFromPostgres } from "../dataSources/postgresFetcher";

export type { RawData } from "../dataSources/types";

export async function dataAgent(state: BIState): Promise<Partial<BIState>> {
  logger.info({ plan: state.plan }, "Data agent started");

  try {
    const rawData = await fetchFromPostgres(state.plan!);

    logger.info({ row_count: rawData.row_count }, "Data agent completed");

    return {
      raw_data: rawData,
      agent_trace: [
        ...(state.agent_trace ?? []),
        { agent: "data_agent", status: "success", output: rawData },
      ],
    };
  } catch (error) {
    logger.error({ error }, "Data agent failed");
    return {
      agent_trace: [
        ...(state.agent_trace ?? []),
        { agent: "data_agent", status: "failed", output: error },
      ],
    };
  }
}
