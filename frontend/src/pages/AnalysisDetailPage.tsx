import React from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useGetAnalysisQuery, useGetAnalysisStatusQuery } from "../features/analysis/analysisApi";
import AnalysisDetail from "../features/analysis/components/AnalysisDetail";
import Spinner from "../components/ui/Spinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import { ArrowLeft } from "lucide-react";
import {
  getAnalysisSource,
  getPipelineLabel,
  isTerminalStatus,
  type AnalysisSource,
} from "../utils/analysisUtils";

type LocationState = {
  source?: AnalysisSource;
  dataSourceName?: string;
};

const AnalysisDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navState = (location.state as LocationState) ?? {};

  const { data: statusData } = useGetAnalysisStatusQuery(id!, {
    pollingInterval: 3000,
    skip: !id,
  });

  const status = statusData?.data?.status;
  const isDone = isTerminalStatus(status);

  const { data, isLoading, isError, refetch } = useGetAnalysisQuery(id!, {
    skip: !id || !isDone,
  });

  const analysis = data?.data;
  const isProcessing = !isDone;

  const source: AnalysisSource = analysis
    ? getAnalysisSource(analysis)
    : navState.source ?? "database";

  const displayAnalysis = analysis
    ? { ...analysis, status: status as any }
    : undefined;

  if (isLoading && isDone) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner className="w-10 h-10" />
        <p className="text-sm text-[#888888]">Loading analysis details...</p>
      </div>
    );
  }

  if (isError || (!isProcessing && !displayAnalysis)) {
    return (
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#ededed] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Analyses
        </Link>
        <ErrorMessage
          message="Could not load this analysis. It may have been deleted or the ID is invalid."
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#ededed] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Analyses
      </Link>

      {isProcessing && (
        <div className="flex items-center gap-3 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          <Spinner className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium text-[#ededed]">
              AI agents are processing your question...
            </p>
            <p className="text-xs text-[#888888] mt-0.5">
              Pipeline: {getPipelineLabel(source)}
            </p>
            {source === "webhook" && navState.dataSourceName && (
              <p className="text-xs text-indigo-400 mt-0.5">
                Fetching live data from {navState.dataSourceName}
              </p>
            )}
          </div>
        </div>
      )}

      {displayAnalysis && (
        <AnalysisDetail analysis={displayAnalysis} source={source} />
      )}
    </div>
  );
};

export default AnalysisDetailPage;
