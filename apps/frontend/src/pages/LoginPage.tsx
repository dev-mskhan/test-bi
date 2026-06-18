import React from "react";
import LoginForm from "../features/auth/components/LoginForm";
import { Sparkles } from "lucide-react";

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 mb-4">
            <Sparkles className="w-7 h-7 text-[#6366f1]" />
          </div>
          <h1 className="text-xl font-semibold text-[#ededed]">AI BI Platform</h1>
          <p className="text-sm text-[#888888] mt-1">Sign in to your analytics dashboard</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 shadow-xl">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
