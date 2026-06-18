import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";

export const gpt4oMini = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

export const gpt4o = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.1,
  apiKey: process.env.OPENAI_API_KEY,
});

// For streaming (API routes)
export const gpt4oStream = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.1,
  streaming: true,
  apiKey: process.env.OPENAI_API_KEY,
});