import React from "react";
import { useAppSelector } from "../../app/hooks";
import { Shield } from "lucide-react";

export const Topbar: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header className="h-16 border-b border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-between px-8 text-[#ededed]">
      <div>
        <h2 className="text-sm font-medium text-[#888888]">Autonomous AI Agent BI Engine</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* System Health */}
        <div className="flex items-center gap-2 text-xs text-[#888888]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          System Online
        </div>

        {/* User Context */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#2a2a2a]/40 rounded-md border border-[#2a2a2a]">
          <Shield className="w-3.5 h-3.5 text-[#6366f1]" />
          <span className="text-xs text-[#ededed] capitalize">{user?.role} Mode</span>
        </div>
      </div>
    </header>
  );
};
export default Topbar;
