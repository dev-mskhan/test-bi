import { useParams } from "react-router-dom";
import { useGetWebhookUserQuery } from "../features/webhook/webhookApi";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function WebhookVerificationPage() {
  const { webhookId } = useParams<{ webhookId: string }>();
  const [copied, setCopied] = useState(false);

  const { data, error, isLoading } = useGetWebhookUserQuery(webhookId ?? "", {
    skip: !webhookId,
  });

  const copyAll = () => {
    if (!data) return;
    const text = `Webhook ID: ${data.webhookId}\nName: ${data.name}\nEmail: ${data.email}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700">
              Webhook Verified
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">User Information</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border border-indigo-200 border-t-indigo-600"></div>
            </div>
          )}

          {!isLoading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">
                Webhook user not found.
              </p>
            </div>
          )}

          {!isLoading && data && (
            <div className="space-y-6">
              {/* User Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReadOnlyField label="Webhook ID" value={data.webhookId} />
                <ReadOnlyField label="Full Name" value={data.name} />
                <ReadOnlyField label="Email Address" value={data.email} />
              </div>

              {/* Single copy-all button */}
              <button
                onClick={copyAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Details
                  </>
                )}
              </button>

              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                  Created
                </p>
                <p className="text-sm text-gray-700">
                  {new Date(data.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          This information is securely stored in webhook-server-1
        </p>
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-600 font-semibold mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg text-sm font-mono focus:outline-none cursor-not-allowed"
      />
    </div>
  );
}