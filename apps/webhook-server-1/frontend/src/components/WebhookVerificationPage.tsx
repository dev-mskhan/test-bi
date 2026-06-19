import { useParams } from "react-router-dom";
import { useGetWebhookUserQuery } from "../features/webhook/webhookApi";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function WebhookVerificationPage() {
  const { webhookId } = useParams<{ webhookId: string }>();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data, error, isLoading } = useGetWebhookUserQuery(webhookId ?? "", {
    skip: !webhookId,
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
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
          <p className="text-gray-500 mt-2">
            Webhook ID: <span className="font-mono text-sm">{webhookId}</span>
          </p>
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
                <FormField
                  label="Full Name"
                  value={data.name}
                  onCopy={() => copyToClipboard(data.name, "name")}
                  isCopied={copiedField === "name"}
                />
                <FormField
                  label="Email Address"
                  value={data.email}
                  onCopy={() => copyToClipboard(data.email, "email")}
                  isCopied={copiedField === "email"}
                />
              </div>

              {/* Account Details Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
                  Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Role"
                    value={data.role}
                    onCopy={() => copyToClipboard(data.role, "role")}
                    isCopied={copiedField === "role"}
                  />
                  <FormField
                    label="Created At"
                    value={new Date(data.createdAt).toLocaleString()}
                    onCopy={() =>
                      copyToClipboard(
                        new Date(data.createdAt).toLocaleString(),
                        "createdAt",
                      )
                    }
                    isCopied={copiedField === "createdAt"}
                  />
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                  Last Updated
                </p>
                <p className="text-sm text-gray-700">
                  {new Date(data.updatedAt).toLocaleString()}
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

function FormField({
  label,
  value,
  onCopy,
  isCopied,
  isSecret = false,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  isSecret?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-600 font-semibold mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={isSecret ? "password" : "text"}
          value={value}
          readOnly
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg text-sm font-mono focus:outline-none cursor-not-allowed"
        />
        <button
          onClick={onCopy}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          title={isCopied ? "Copied!" : "Copy to clipboard"}
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
