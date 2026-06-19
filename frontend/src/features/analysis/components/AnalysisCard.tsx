import React from "react";
import { Analysis } from "../../../types";
import { Link } from "react-router-dom";
import Badge from "../../../components/ui/Badge";
import { formatDate } from "../../../utils/formatters";
import { getAnalysisSource } from "../../../utils/analysisUtils";
import { ArrowUpRight, Database, Webhook } from "lucide-react";

interface AnalysisCardProps {
  analysis: Analysis;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis }) => {
  const source = getAnalysisSource(analysis);
  const isWebhook = source === "webhook";

  return (
    <Link
      to={`/analysis/${analysis.id}`}
      state={{ source }}
      className="block p-5 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] hover:border-[#6366f1]/40 hover:bg-[#1f1f1f]/80 transition-all group shadow-sm"
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <h4 className="text-[#ededed] font-medium text-sm line-clamp-2 leading-relaxed flex-1">
          {analysis.question}
        </h4>
        <div className="p-1.5 rounded-md bg-[#2a2a2a]/60 text-[#888888] group-hover:text-[#6366f1] group-hover:bg-[#6366f1]/10 transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-[#888888]">
        <div className="flex items-center gap-2">
          <span>{formatDate(analysis.createdAt || analysis.created_at)}</span>
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              isWebhook
                ? "bg-violet-500/10 text-violet-400"
                : "bg-indigo-500/10 text-indigo-400"
            }`}
          >
            {isWebhook ? (
              <Webhook className="w-3 h-3" />
            ) : (
              <Database className="w-3 h-3" />
            )}
            {isWebhook ? "Webhook" : "Database"}
          </span>
        </div>
        <Badge status={analysis.status} />
      </div>
    </Link>
  );
};

export default AnalysisCard;
