import { OpenAIEmbeddings } from "@langchain/openai";
import { redisClient } from "./redis";
import { logger } from "./logger";

const embedder = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embedText(text: string): Promise<number[]> {
  const cacheKey = `embed:${Buffer.from(text.slice(0, 200)).toString("base64")}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    logger.debug("Embedding cache hit");
    return JSON.parse(cached) as number[];
  }

  const [embedding] = await embedder.embedDocuments([text]);

  // Cache for 24 hours
  await redisClient.setEx(cacheKey, 86400, JSON.stringify(embedding));

  return embedding;
}

export async function similaritySearch(
  queryText: string,
  limit = 5
): Promise<string[]> {
  const { prisma } = await import("./prisma");
  const embedding = await embedText(queryText);

  // pgvector cosine similarity search
  const results = await prisma.$queryRaw<Array<{ id: string; question: string }>>`
    SELECT id, question
    FROM analyses
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT ${limit}
  `;

  return results.map((r: any) => r.id);
}