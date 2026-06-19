import React, { useState } from "react";
import {
  useCreateAnalysisMutation,
  useCreateWebhookAnalysisMutation,
  useGetWebhookSourcesQuery,
} from "../analysisApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "../../../components/ui/Button";
import Spinner from "../../../components/ui/Spinner";
import { AnalysisSource } from "../../../utils/analysisUtils";
import { Sparkles, ArrowRight, Database, Webhook } from "lucide-react";

const DB_SAMPLES = [
  "Compare Q1 vs Q2 monthly revenue trend.",
  "Why did sales drop in the South region during Q2?",
  "Show average deal size by customer segment.",
];

const WEBHOOK_SAMPLES = [
  "Are API errors trending up this week?",
  "What are the most common user event types?",
  "Is pageview traffic going up or down over time?",
  "Which shopping carts have the highest discounted totals?",
];

export const AskQuestion: React.FC = () => {
  const [mode, setMode] = useState<AnalysisSource>("database");
  const [question, setQuestion] = useState("");
  const [dataSourceId, setDataSourceId] = useState("");

  const [createAnalysis, { isLoading: isDbLoading }] = useCreateAnalysisMutation();
  const [createWebhookAnalysis, { isLoading: isWebhookLoading }] = useCreateWebhookAnalysisMutation();

  const navigate = useNavigate();
  const isLoading = isDbLoading || isWebhookLoading;
  const sampleQuestions = mode === "webhook" ? WEBHOOK_SAMPLES : DB_SAMPLES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      if (mode === "webhook") {
        const payload = {
          question: question.trim(),
          data_source_id: dataSourceId || undefined,
        };
        console.log("Sending webhook analysis:", payload);
        const res = await createWebhookAnalysis(payload).unwrap();

        const analysisId = res.data?.analysis_id;

        if (analysisId) {
          toast.success("Webhook analysis started — fetching live data...");
          navigate(`/analysis/${analysisId}`, {
            state: { source: "webhook" },
          });
        } else {
          toast.error("Failed to start analysis: Missing analysis ID.");
        }
      } else {
        const res = await createAnalysis({ question: question.trim() }).unwrap();
        const analysisId = res.data?.analysis_id || (res as any).analysis_id;

        if (analysisId) {
          toast.success("Database analysis started!");
          navigate(`/analysis/${analysisId}`, { state: { source: "database" } });
        } else {
          toast.error("Failed to start analysis: Missing analysis ID.");
        }
      }
    } catch (err: any) {
      if (err?.status === 429 || err?.statusCode === 429) {
        toast.error("You're going too fast — wait a moment and try again.");
      } else {
        toast.error(err?.data?.message || "Failed to start analysis.");
      }
    }
  };

  return (
    <div className="w-full bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="text-[#ededed] font-medium text-base">Ask our AI agents a business question</h3>
        </div>

        <div className="flex rounded-lg border border-[#2a2a2a] p-0.5 bg-[#0f0f0f] self-start">
          <button
            type="button"
            onClick={() => setMode("database")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === "database"
                ? "bg-[#6366f1] text-white"
                : "text-[#888888] hover:text-[#ededed]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Database
          </button>
          <button
            type="button"
            onClick={() => setMode("webhook")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === "webhook"
                ? "bg-[#6366f1] text-white"
                : "text-[#888888] hover:text-[#ededed]"
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            Webhook API
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
          rows={3}
          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#ededed] px-4 py-3 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none placeholder-[#888888] pr-16"
          placeholder={
            mode === "webhook"
              ? "Ask about live API metrics, events, pageviews, or cart data..."
              : "Ask a plain English question about sales, churn, signups..."
          }
        />

        <div className="absolute right-3 bottom-3">
          <Button
            type="submit"
            disabled={!question.trim()}
            isLoading={isLoading}
            className="rounded-lg h-9 w-9 p-0 bg-[#6366f1] hover:bg-indigo-700 text-white"
          >
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[#888888]">Try asking:</span>
        {sampleQuestions.map((q) => (
          <button
            key={q}
            onClick={() => setQuestion(q)}
            type="button"
            className="px-2.5 py-1 rounded-md bg-[#2a2a2a]/30 hover:bg-[#2a2a2a]/80 text-[#888888] hover:text-[#ededed] border border-[#2a2a2a]/60 transition-colors text-left"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AskQuestion;
