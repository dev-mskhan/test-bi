import React, { useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import {
  useLogoutMutation,
  useMeQuery,
  useGetBusinessProfileQuery,
} from "../../features/auth/authApi";
import {
  BarChart3,
  Users,
  LogOut,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Building2,
  MapPin,
  Phone,
  Globe,
  User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [logoutMut] = useLogoutMutation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [copiedWebhookId, setCopiedWebhookId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAnalysesActive = pathname === "/" || pathname === "/analysis";
  console.log("webhookUrl:", user?.webhook_url); // Debug log for webhook URL
  const { webhookUrl } = useMemo(() => {
    return {
      webhookUrl: user?.webhook_url!,
    };
  }, [user]);

  const { refetch: refetchMe } = useMeQuery();
  const {
    data: businessProfileRes,
    refetch: refetchBusinessProfile,
    isFetching: isBusinessProfileFetching,
  } = useGetBusinessProfileQuery(user?.id as string, { skip: !user?.id });

  const businessProfile = businessProfileRes?.data;

  const handleLogout = async () => {
    try {
      await logoutMut().unwrap();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const copyWebhookUrl = async () => {
    if (webhookUrl) {
      try {
        await navigator.clipboard.writeText(webhookUrl);
        setCopiedWebhookId(true);
        setTimeout(() => setCopiedWebhookId(false), 2000);
        toast.success("Webhook URL copied!");
      } catch {
        toast.error("Failed to copy URL");
      }
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([refetchMe(), refetchBusinessProfile()]);
      toast.success("Refreshed");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const navItems = [{ to: "/", label: "Analyses", icon: BarChart3, end: true }];

  return (
    <aside className="w-64 bg-[#1a1a1a] border-r border-[#2a2a2a] flex flex-col h-screen text-[#ededed]">
      <div className="h-16 flex items-center justify-between gap-2 px-6 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-lg tracking-tight">
            AI BI Platform
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh user & business profile"
          className="text-[#888888] hover:text-[#ededed] transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${
              isRefreshing || isBusinessProfileFetching ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={() =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isAnalysesActive
                  ? "bg-[#6366f1] text-white"
                  : "text-[#888888] hover:text-[#ededed] hover:bg-[#2a2a2a]/50"
              }`
            }
          >
            <item.icon className="w-4.5 h-4.5" />
            {item.label}
          </NavLink>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">
              Administration
            </div>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#6366f1] text-white"
                    : "text-[#888888] hover:text-[#ededed] hover:bg-[#2a2a2a]/50"
                }`
              }
            >
              <Users className="w-4.5 h-4.5" />
              Users
            </NavLink>
          </>
        )}

        {businessProfile && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">
              Business Profile
            </div>
            <div className="px-3 py-2.5 bg-[#1f1f1f] rounded-md mx-1 space-y-2.5">
              <div className="flex items-start gap-2">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-indigo-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate capitalize">
                    {businessProfile.business_name}
                  </p>
                  <p className="text-xs text-[#888888] capitalize">
                    {businessProfile.business_type}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <UserIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#888888]" />
                <p className="text-xs text-[#cccccc] capitalize truncate">
                  {businessProfile.owner_name}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#888888]" />
                <p className="text-xs text-[#cccccc] capitalize truncate">
                  {businessProfile.city}, {businessProfile.country}
                </p>
              </div>

              {businessProfile.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#888888]" />
                  <p className="text-xs text-[#cccccc] truncate">
                    {businessProfile.phone}
                  </p>
                </div>
              )}

              {businessProfile.website && (
                <div className="flex items-start gap-2">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#888888]" />
                  <a
                    href={businessProfile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 truncate"
                  >
                    {businessProfile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              {businessProfile.services &&
                businessProfile.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {businessProfile.services.map((service: string) => (
                      <span
                        key={service}
                        className="text-[10px] px-2 py-0.5 bg-[#2a2a2a] text-[#cccccc] rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </>
        )}

        {webhookUrl && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-[#888888] uppercase tracking-wider">
              Webhook
            </div>
            <div className="px-3 py-2.5">
              <div className="text-xs text-[#888888] mb-2">
                Verification URL:
              </div>
              <button
                onClick={copyWebhookUrl}
                className="w-full flex items-center gap-2 px-2 py-2 bg-[#2a2a2a] hover:bg-[#333333] rounded-md text-xs text-[#6366f1] font-mono break-all transition-colors text-left"
                title={webhookUrl}
              >
                <span className="flex-1 truncate">{webhookUrl}</span>
                {copiedWebhookId ? (
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                )}
              </button>
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-[#2a2a2a] bg-[#141414] flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white uppercase">
            {user?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-[#888888] truncate capitalize">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-2 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[#ef4444]/10 rounded-md transition-colors font-medium text-left"
        >
          <LogOut className="w-4.5 h-4.5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
