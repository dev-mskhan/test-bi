import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = "An error occurred",
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-red-500/20 bg-red-500/5 text-center my-4">
      <AlertCircle className="w-8 h-8 text-[#ef4444] mb-3 stroke-[1.5]" />
      <h3 className="text-[#ededed] font-medium text-base mb-1">{title}</h3>
      <p className="text-[#888888] text-sm max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-[#ef4444] rounded-md text-xs font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
export default ErrorMessage;
