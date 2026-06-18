import React from "react";

interface BadgeProps {
  status: "running" | "success" | "completed" | "failed" | "pending" | "done" | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = "" }) => {
  const normalizedStatus = status.toLowerCase();

  let dotColor = "bg-[#888888]";
  let textColor = "text-[#888888]";
  let bgColor = "bg-[#1a1a1a]";
  let text = status;

  if (normalizedStatus === "running") {
    dotColor = "bg-[#f59e0b]";
    textColor = "text-[#f59e0b]";
    bgColor = "bg-[#f59e0b]/10";
    text = "Running";
  } else if (normalizedStatus === "success" || normalizedStatus === "completed" || normalizedStatus === "done") {
    dotColor = "bg-[#22c55e]";
    textColor = "text-[#22c55e]";
    bgColor = "bg-[#22c55e]/10";
    text = "Done";
  } else if (normalizedStatus === "failed") {
    dotColor = "bg-[#ef4444]";
    textColor = "text-[#ef4444]";
    bgColor = "bg-[#ef4444]/10";
    text = "Failed";
  } else if (normalizedStatus === "pending") {
    dotColor = "bg-[#888888]";
    textColor = "text-[#888888]";
    bgColor = "bg-[#2a2a2a]/40";
    text = "Waiting";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-[#2a2a2a] ${bgColor} ${textColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {text}
    </span>
  );
};
export default Badge;
