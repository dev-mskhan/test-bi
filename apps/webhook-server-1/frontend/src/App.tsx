import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WebhookVerificationPage from "./components/WebhookVerificationPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/webhook/:webhookId" element={<WebhookVerificationPage />} />
        <Route path="*" element={<Navigate to="/webhook/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
