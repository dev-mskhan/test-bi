import React from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data available",
  message,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-center my-6">
      <FolderOpen className="w-10 h-10 text-[#888888] mb-3 stroke-[1.5]" />
      <h3 className="text-[#ededed] font-medium text-base mb-1">{title}</h3>
      <p className="text-[#888888] text-sm max-w-sm mb-4">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
export default EmptyState;
