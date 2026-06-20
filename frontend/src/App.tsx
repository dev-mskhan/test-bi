import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AnalysisPage from "./pages/AnalysisPage";
import AnalysisDetailPage from "./pages/AnalysisDetailPage";
import UsersPage from "./pages/UsersPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1a1a1a",
            color: "#ededed",
            border: "1px solid #2a2a2a",
            fontSize: "13px",
            borderRadius: "8px",
          },
          success: {
            iconTheme: { primary: "#22c55e", secondary: "#1a1a1a" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#1a1a1a" },
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<AnalysisPage />} />
            <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
