import { logger } from "../services/logger";
import { BIState } from "../graphs/state";
import { fetchFromWebhook } from "../dataSources/webhookFetcher";
import { prisma } from "../services/prisma";

async function resolveDataSourceId(state: BIState): Promise<string | undefined> {
  if (state.data_source_id) return state.data_source_id;

  const webhookEndpoint = (state.plan as { webhook_endpoint?: string } | undefined)?.webhook_endpoint;
  if (!webhookEndpoint) return undefined;

  const planKey = webhookEndpoint.toLowerCase().replace(/[_\s-]+/g, "");
  const sources = await prisma.data_sources.findMany({
    where: { type: "api", is_active: true },
  });

  const match = sources.find((source) => {
    const nameKey = source.name
      .toLowerCase()
      .replace(/[_\s-]+/g, "")
      .replace(/[^a-z0-9]/g, "");
    if (nameKey.includes(planKey) || planKey.includes(nameKey)) return true;

    const endpoint = String((source.connection_config as any)?.endpoint ?? "").toLowerCase();
    if (endpoint.includes(planKey) || endpoint.includes(webhookEndpoint.toLowerCase())) return true;

    return false;
  });

  return match?.id;
}

export async function webhookDataAgent(state: BIState): Promise<Partial<BIState>> {
  logger.info({ plan: state.plan, data_source_id: state.data_source_id }, "Webhook data agent started");

  const dataSourceId = await resolveDataSourceId(state);

  try {
    if (!dataSourceId) {
      throw new Error("Unable to resolve a webhook data source for this request");
    }

    const rawData = await fetchFromWebhook(state.plan!, dataSourceId);

    await prisma.data_sources.update({
      where: { id: dataSourceId },
      data: { last_synced: new Date() },
    });

    logger.info({ row_count: rawData.row_count, url: rawData.query }, "Webhook data agent completed");

    return {
      raw_data: rawData,
      agent_trace: [
        ...(state.agent_trace ?? []),
        { agent: "webhook_data_agent", status: "success", output: rawData },
      ],
    };
  } catch (error) {
    logger.error({ error }, "Webhook data agent failed");
    return {
      agent_trace: [
        ...(state.agent_trace ?? []),
        { agent: "webhook_data_agent", status: "failed", output: error },
      ],
    };
  }
}
