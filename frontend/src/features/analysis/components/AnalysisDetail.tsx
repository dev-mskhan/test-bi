import React, { useState } from "react";
import { Analysis } from "../../../types";
import ChartRenderer from "./ChartRenderer";
import Badge from "../../../components/ui/Badge";
import { formatDate } from "../../../utils/formatters";
import {
  Sparkles,
  Activity,
  Terminal,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
  Webhook,
  Database,
} from "lucide-react";
import { AnalysisSource } from "../../../utils/analysisUtils";

interface AnalysisDetailProps {
  analysis: Analysis;
  source?: AnalysisSource;
}

export const AnalysisDetail: React.FC<AnalysisDetailProps> = ({ analysis, source = "database" }) => {
  const [openTraceStep, setOpenTraceStep] = useState<number | null>(null);

  const toggleTraceStep = (idx: number) => {
    setOpenTraceStep(openTraceStep === idx ? null : idx);
  };

  // Convert raw report object/markdown text into structured paragraphs and listings
  const renderReportContent = () => {
    const reportObj = analysis.report;
    if (!reportObj) return <p className="text-[#888888] text-sm">No report generated yet.</p>;

    // Case 1: Report is a string (markdown format)
    if (typeof reportObj === "string" || typeof (reportObj as any) === "string") {
      const reportStr = reportObj as unknown as string;
      return (
        <div className="space-y-4">
          {reportStr.split("\n").map((line: string, idx: number) => {
            if (line.startsWith("# ")) {
              return (
                <h1 key={idx} className="text-xl font-bold text-[#ededed] mt-4 mb-2">
                  {line.replace("# ", "")}
                </h1>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <h2 key={idx} className="text-lg font-bold text-[#ededed] mt-4 mb-2">
                  {line.replace("## ", "")}
                </h2>
              );
            }
            if (line.startsWith("### ")) {
              return (
                <h3 key={idx} className="text-base font-semibold text-[#ededed] mt-3 mb-1">
                  {line.replace("### ", "")}
                </h3>
              );
            }
            if (line.startsWith("- ") || line.startsWith("* ")) {
              return (
                <li key={idx} className="text-sm text-[#ededed] ml-4 list-disc my-1">
                  {line.substring(2)}
                </li>
              );
            }
            if (line.trim() === "") {
              return <div key={idx} className="h-2" />;
            }
            return (
              <p key={idx} className="text-sm text-[#888888] leading-relaxed my-1.5">
                {line}
              </p>
            );
          })}
        </div>
      );
    }

    // Case 2: Report is a structured JSON object
    const {
      executive_summary,
      root_causes = [],
      key_findings = [],
      recommendations = [],
      next_actions = [],
    } = reportObj as any;

    return (
      <div className="space-y-6">
        {executive_summary && (
          <div>
            <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">
              Executive Summary
            </h4>
            <p className="text-sm text-[#888888] leading-relaxed whitespace-pre-line">
              {executive_summary}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#2a2a2a]/60">
          {key_findings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2.5">
                Key Findings
              </h4>
              <ul className="space-y-2">
                {key_findings.map((item: string, idx: number) => (
                  <li key={idx} className="text-sm text-[#ededed] flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {root_causes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2.5">
                Identified Root Causes
              </h4>
              <ul className="space-y-2">
                {root_causes.map((item: string, idx: number) => (
                  <li key={idx} className="text-sm text-[#ededed] flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {recommendations.length > 0 && (
          <div className="pt-4 border-t border-[#2a2a2a]/60">
            <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2.5">
              Strategic Recommendations
            </h4>
            <ul className="space-y-2">
              {recommendations.map((item: string, idx: number) => (
                <li key={idx} className="text-sm text-[#ededed] flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {next_actions.length > 0 && (
          <div className="pt-4 border-t border-[#2a2a2a]/60">
            <h4 className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-3">
              Action Plan Checklist
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#ededed]">
                <thead>
                  <tr className="border-b border-[#2a2a2a] text-xs uppercase text-[#888888]">
                    <th className="pb-2">Action</th>
                    <th className="pb-2">Owner</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2 text-right">Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]/40 text-xs">
                  {next_actions.map((act: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#2a2a2a]/20">
                      <td className="py-2.5 font-medium">{act.action}</td>
                      <td className="py-2.5 text-[#888888]">{act.owner}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            act.priority === "high"
                              ? "bg-red-500/10 text-[#ef4444]"
                              : act.priority === "medium"
                              ? "bg-amber-500/10 text-[#f59e0b]"
                              : "bg-indigo-500/10 text-indigo-400"
                          }`}
                        >
                          {act.priority}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-[#888888]">{act.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Build trace steps from saved analysis fields when agent_trace is not persisted
  const traces = (analysis as any).agent_trace?.length
    ? (analysis as any).agent_trace
    : [
        analysis.plan && { agent: source === "webhook" ? "webhook_planner" : "planner", status: "success", output: analysis.plan },
        analysis.raw_data && {
          agent: source === "webhook" ? "webhook_data_agent" : "data_agent",
          status: "success",
          output: analysis.raw_data,
        },
        analysis.findings && { agent: "investigator", status: "success", output: analysis.findings },
        analysis.charts?.length && { agent: "visualizer", status: "success", output: analysis.charts },
        analysis.report && { agent: "reporter", status: "success", output: analysis.report },
      ].filter(Boolean);

  return (
    <div className="space-y-8">
      {/* 1. Header Card */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 shadow-sm">
        <span className="text-xs text-[#888888] font-medium block mb-2">
          Submitted {formatDate(analysis.createdAt || (analysis as any).created_at)}
        </span>
        <h1 className="text-xl font-semibold text-[#ededed] mb-4 leading-relaxed">
          {analysis.question}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#888888] pt-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#ededed]">Source:</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                source === "webhook"
                  ? "bg-violet-500/10 text-violet-400"
                  : "bg-indigo-500/10 text-indigo-400"
              }`}
            >
              {source === "webhook" ? <Webhook className="w-3 h-3" /> : <Database className="w-3 h-3" />}
              {source === "webhook" ? "Webhook API" : "PostgreSQL"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#ededed]">Status:</span>
            <Badge status={analysis.status} />
          </div>
          {analysis.status === "failed" && (analysis as any).error && (
            <div className="flex items-center gap-1.5 text-[#ef4444]">
              <AlertTriangle className="w-4 h-4" />
              <span>{(analysis as any).error}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Pipeline Logs (Timeline of Agents) */}
      {traces.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold uppercase text-[#888888] tracking-wider">
              Agent Execution Pipeline ({traces.length} stages)
            </h3>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden divide-y divide-[#2a2a2a]">
            {traces.map((trace: any, idx: number) => {
              const isOpen = openTraceStep === idx;
              return (
                <div key={idx} className="w-full">
                  <button
                    onClick={() => toggleTraceStep(idx)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#2a2a2a]/20 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center font-bold text-xs text-[#ededed] font-mono">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-[#ededed] capitalize">
                          {trace.agent.replace(/_/g, " ")}
                        </span>
                        <span className="ml-3 text-xs text-[#888888]">
                          {trace.status === "success" ? "Executed successfully" : "Execution failed"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          trace.status === "success" ? "bg-[#22c55e]" : "bg-[#ef4444]"
                        }`}
                      />
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#888888]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#888888]" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs space-y-4 border-t border-[#2a2a2a]/40 bg-[#0f0f0f]/40">
                      {(trace.agent === "planner" || trace.agent === "webhook_planner") && trace.output && (
                        <div className="space-y-2">
                          <p className="text-[#888888]">
                            <strong className="text-[#ededed]">Goal:</strong> {trace.output.goal}
                          </p>
                          {trace.output.webhook_endpoint && (
                            <p className="text-[#888888]">
                              <strong className="text-[#ededed]">Webhook endpoint:</strong>{" "}
                              {trace.output.webhook_endpoint}
                            </p>
                          )}
                          <div>
                            <strong className="text-[#ededed]">Plan Steps:</strong>
                            <ol className="list-decimal list-inside text-[#888888] mt-1 space-y-1">
                              {trace.output.steps?.map((step: string, sidx: number) => (
                                <span key={sidx} className="block pl-1">
                                  {sidx + 1}. {step.replace(/_/g, " ")}
                                </span>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}

                      {trace.agent === "data_agent" && trace.output && (
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-1 text-indigo-400 mb-1.5 font-semibold">
                              <Terminal className="w-3.5 h-3.5" />
                              <span>Generated SQL Query</span>
                            </div>
                            <pre className="p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded font-mono text-[11px] text-[#ededed] overflow-x-auto leading-relaxed">
                              {trace.output.query}
                            </pre>
                          </div>
                          <p className="text-[#888888]">
                            Fetched{" "}
                            <strong className="text-[#ededed]">{trace.output.row_count} rows</strong>{" "}
                            across dimensions: [
                            <span className="font-mono text-[11px]">
                              {trace.output.columns?.join(", ")}
                            </span>
                            ]
                          </p>
                        </div>
                      )}

                      {trace.agent === "webhook_data_agent" && trace.output && (
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-1 text-violet-400 mb-1.5 font-semibold">
                              <Webhook className="w-3.5 h-3.5" />
                              <span>Live Webhook Fetch</span>
                            </div>
                            <pre className="p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded font-mono text-[11px] text-[#ededed] overflow-x-auto leading-relaxed break-all">
                              {trace.output.query}
                            </pre>
                          </div>
                          <p className="text-[#888888]">
                            Fetched{" "}
                            <strong className="text-[#ededed]">{trace.output.row_count} rows</strong>{" "}
                            at {trace.output.fetched_at ? new Date(trace.output.fetched_at).toLocaleString() : "request time"}
                          </p>
                          <p className="text-[#888888]">
                            Columns: [
                            <span className="font-mono text-[11px]">
                              {trace.output.columns?.join(", ")}
                            </span>
                            ]
                          </p>
                        </div>
                      )}

                      {trace.agent === "investigator" && trace.output && (
                        <div className="space-y-3">
                          <p className="text-[#888888]">
                            <strong className="text-[#ededed]">Investigation:</strong>{" "}
                            {trace.output.summary}
                          </p>
                          <div className="flex gap-4">
                            <p className="text-[#888888]">
                              Risk Level:{" "}
                              <span className="text-[#ededed] uppercase font-bold text-[10px]">
                                {trace.output.risk_level}
                              </span>
                            </p>
                            <p className="text-[#888888]">
                              Confidence:{" "}
                              <strong className="text-[#ededed]">
                                {Math.round(trace.output.confidence_score * 100)}%
                              </strong>
                            </p>
                          </div>
                        </div>
                      )}

                      {trace.agent === "visualizer" && trace.output && (
                        <div>
                          <p className="text-[#888888]">
                            Designed{" "}
                            <strong className="text-[#ededed]">{trace.output.length} charts</strong>:
                          </p>
                          <ul className="list-disc list-inside text-[#888888] mt-1 space-y-1">
                            {trace.output.map((c: any, cidx: number) => (
                              <span key={cidx} className="block pl-1 capitalize">
                                • {c.title} ({c.type})
                              </span>
                            ))}
                          </ul>
                        </div>
                      )}

                      {trace.agent === "reporter" && trace.output && (
                        <div>
                          <p className="text-[#888888]">
                            Compiled full report. Risks:{" "}
                            <strong className="text-[#ededed] uppercase">
                              {trace.output.risk_level}
                            </strong>
                            , Action items owner count:{" "}
                            <strong className="text-[#ededed]">
                              {trace.output.next_actions?.length || 0}
                            </strong>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Markdown Report Section */}
      {analysis.report && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold uppercase text-[#888888] tracking-wider">
              Executive Findings Report
            </h3>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 md:p-8 shadow-sm">
            {renderReportContent()}
          </div>
        </div>
      )}

      {/* 4. Charts Rendering Section */}
      {analysis.charts && analysis.charts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold uppercase text-[#888888] tracking-wider">
              Designed Data Visualizations
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.charts.map((chart, idx) => (
              <ChartRenderer key={idx} config={chart} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default AnalysisDetail;
