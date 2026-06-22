import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";

const baseQueryWithRetry = retry(
  fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL + "/api",
    credentials: "include",
    prepareHeaders: (headers) => {
      headers.set("ngrok-skip-browser-warning", "true");
      return headers;
    },
  }),
  { maxRetries: 2 },
);

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithRetry,
  tagTypes: ["User", "Analysis"],
  endpoints: () => ({}),
});
