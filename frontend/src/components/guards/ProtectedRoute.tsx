import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { useMeQuery } from "../../features/auth/authApi";
import { Spinner } from "../ui/Spinner";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // GET /auth/me triggers automatically and updates authSlice via onQueryStarted
  const { isLoading: queryLoading } = useMeQuery(undefined, {
    skip: isAuthenticated,
  });

  if (isLoading || queryLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
export default ProtectedRoute;
