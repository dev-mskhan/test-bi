import React, { useState } from "react";
import { baseApi } from "../services/baseApi";
import Spinner from "../components/ui/Spinner";
import ErrorMessage from "../components/ui/ErrorMessage";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { formatDate } from "../utils/formatters";
import { Users, Search, X, Save } from "lucide-react";
import toast from "react-hot-toast";

// Inject admin user endpoints into baseApi
const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<any, void>({
      query: () => "/admin/users",
      providesTags: ["User"],
    }),
    updateUser: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

const { useGetUsersQuery, useUpdateUserMutation } = usersApi;

const UsersPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useGetUsersQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Edit form state
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editActive, setEditActive] = useState(true);

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditActive(user.is_active);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      await updateUser({
        id: editingUser.id,
        body: { email: editEmail, role: editRole, is_active: editActive },
      }).unwrap();
      toast.success("User updated successfully");
      setEditingUser(null);
    } catch {
      toast.error("Failed to update user");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-10 h-10" />
      </div>
    );
  }

  if (isError) return <ErrorMessage message="Failed to load users" onRetry={refetch} />;

  const users = data?.data || [];
  const filteredUsers = users.filter(
    (u: any) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-[#6366f1]" />
          <h1 className="text-2xl font-semibold text-[#ededed]">User Management</h1>
        </div>
        <p className="text-sm text-[#888888]">
          Manage platform users, roles, and access permissions.
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#888888]" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#ededed] pl-10 pr-4 py-2 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      {/* Users table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#ededed]">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-xs uppercase tracking-wider text-[#888888] bg-[#0f0f0f]/40">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Joined</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]/40">
              {filteredUsers.map((user: any) => (
                <tr key={user.id} className="hover:bg-[#2a2a2a]/20 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase">
                        {user.name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-[#888888] text-xs">{user.email}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#2a2a2a] text-[#ededed] uppercase border border-[#2a2a2a]">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge status={user.is_active ? "success" : "failed"} />
                  </td>
                  <td className="px-6 py-3.5 text-xs text-[#888888]">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="px-3 py-1.5 text-xs font-medium text-[#6366f1] hover:bg-[#6366f1]/10 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#888888] text-xs">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit user modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-[#1a1a1a] border-l border-[#2a2a2a] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#2a2a2a] mb-6">
                <h3 className="text-base font-semibold text-[#ededed]">Edit User</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 rounded-md text-[#888888] hover:text-[#ededed] hover:bg-[#2a2a2a]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.name}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#888888] px-3.5 py-2 rounded-md text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#ededed] px-3.5 py-2 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-[#ededed] px-3.5 py-2 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">
                    Active Status
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditActive(!editActive)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        editActive ? "bg-[#22c55e]" : "bg-[#2a2a2a]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                          editActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-xs text-[#ededed]">{editActive ? "Active" : "Disabled"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#2a2a2a] mt-8 flex gap-3">
              <Button onClick={() => setEditingUser(null)} variant="secondary" className="w-full text-xs">
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={isUpdating} className="w-full text-xs">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
