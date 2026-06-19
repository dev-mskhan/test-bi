import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface WebhookUserResponse {
  webhookId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// In production, set VITE_WEBHOOK_API_URL to the deployed API origin.
const API_BASE_URL =
  import.meta.env.VITE_WEBHOOK_API_URL ?? "http://localhost:5002";

export const webhookApi = createApi({
  reducerPath: "webhookApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE_URL}/webhooks` }),
  endpoints: (builder) => ({
    getWebhookUser: builder.query<WebhookUserResponse, string>({
      query: (webhookId) => `/${webhookId}`,
    }),
  }),
});

export const { useGetWebhookUserQuery } = webhookApi;
