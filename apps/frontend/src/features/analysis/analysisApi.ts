import { baseApi } from "../../services/baseApi";
import { Analysis, ApiResponse, DataSource, WebhookAnalysisCreateResponse } from "../../types";

export const analysisApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyses: builder.query<ApiResponse<{ analyses: Analysis[]; total: number; page: number; limit: number }>, void>({
      query: () => "/analysis",
      providesTags: (result) =>
        result?.data?.analyses
          ? [
            ...result.data.analyses.map(({ id }) => ({ type: "Analysis" as const, id })),
            { type: "Analysis", id: "LIST" },
          ]
          : [{ type: "Analysis", id: "LIST" }],
    }),
    getAnalysis: builder.query<ApiResponse<Analysis>, string>({
      query: (id) => `/analysis/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Analysis", id }],
    }),
    getAnalysisStatus: builder.query<ApiResponse<{ id: string; status: Analysis["status"]; error: string | null }>, string>({
      query: (id) => `/analysis/${id}/status`,
    }),
    getWebhookSources: builder.query<ApiResponse<DataSource[]>, void>({
      query: () => "/analysis/webhook/sources",
    }),
    createAnalysis: builder.mutation<ApiResponse<{ analysis_id: string; status: string }>, { question: string }>({
      query: (body) => ({
        url: "/analysis",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Analysis", id: "LIST" }],
    }),
    createWebhookAnalysis: builder.mutation<
      ApiResponse<WebhookAnalysisCreateResponse>,
      { question: string; data_source_id?: string }
    >({
      query: (body) => ({
        url: "/analysis/webhook",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Analysis", id: "LIST" }],
    }),
    searchAnalyses: builder.mutation<ApiResponse<Analysis[]>, { query: string }>({
      query: (body) => ({
        url: "/analysis/search",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetAnalysesQuery,
  useGetAnalysisQuery,
  useGetAnalysisStatusQuery,
  useGetWebhookSourcesQuery,
  useCreateAnalysisMutation,
  useCreateWebhookAnalysisMutation,
  useSearchAnalysesMutation,
} = analysisApi;

export default analysisApi;
