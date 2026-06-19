import React, { useState } from "react";
import { useGetAnalysesQuery, useSearchAnalysesMutation } from "../features/analysis/analysisApi";
import AnalysisCard from "../features/analysis/components/AnalysisCard";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import ErrorMessage from "../components/ui/ErrorMessage";
import AskQuestion from "../features/analysis/components/AskQuestion";
import { getAnalysisSource, normalizeStatus } from "../utils/analysisUtils";
import { Search, BarChart3 } from "lucide-react";

const AnalysisPage: React.FC = () => {
  const { data: analysesData, isLoading, isError, refetch } = useGetAnalysesQuery();
  const [searchAnalyses, { data: searchData, isLoading: isSearching }] = useSearchAnalysesMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      await searchAnalyses({ query: searchTerm.trim() }).unwrap();
    } catch {
      // fallback to local filter
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="Failed to load analyses" onRetry={refetch} />;
  }

  const allAnalyses = analysesData?.data?.analyses || [];
  const searchResults = searchData?.data;
  const displayAnalyses = searchResults || allAnalyses;

  const filteredAnalyses = displayAnalyses.filter((a) => {
    const matchesSearch = searchTerm
      ? a.question.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const normalized = normalizeStatus(a.status);
    const matchesStatus =
      statusFilter === "all" ||
      normalized === statusFilter ||
      (statusFilter === "completed" && normalized === "done");

    const source = getAnalysisSource(a);
    const matchesSource =
      sourceFilter === "all" ||
      source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-[#6366f1]" />
          <h1 className="text-2xl font-semibold text-[#ededed]">Analyses</h1>
        </div>
        <p className="text-sm text-[#888888]">
          Run AI investigations on PostgreSQL data or fetch live data from webhook APIs.
        </p>
      </div>

      <AskQuestion />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#888888]" />
          <input
            type="text"
            placeholder="Search analyses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] pl-10 pr-4 py-2 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] px-3 py-2 rounded-md text-sm outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Sources</option>
            <option value="database">Database</option>
            <option value="webhook">Webhook API</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] px-3 py-2 rounded-md text-sm outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {isSearching ? (
        <Spinner className="w-8 h-8 my-8 mx-auto" />
      ) : filteredAnalyses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnalyses.map((a) => (
            <AnalysisCard key={a.id} analysis={a} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No analyses found"
          message="Ask a business question above to create your first AI-driven report."
        />
      )}
    </div>
  );
};

export default AnalysisPage;
