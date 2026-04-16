"use client";
// src/app/(dashboard)/users/page.tsx
// User Management — Super Admin only

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Shield, Search, ChevronDown, Check } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  status: string;
  createdAt: string;
};

const ROLES = [
  { value: "super_admin", label: "Super Admin", color: "text-red-600 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-500/10" },
  { value: "admin",       label: "Admin",       color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
  { value: "organizer",   label: "Organizer",   color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-500/10" },
  { value: "volunteer",   label: "Volunteer",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { value: "attendee",    label: "Attendee",    color: "text-gray-600 dark:text-gray-400",   bg: "bg-gray-100 dark:bg-gray-500/10" },
];

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }

  async function changeRole(userId: string, newRole: string) {
    setUpdating(userId);
    setOpenDropdown(null);
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } else {
      const err = await res.json();
      alert(err.error || "Failed to change role");
    }
    setUpdating(null);
  }

  const isSuperAdmin = session?.user?.role === "super_admin";
  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Shield size={48} className="text-red-500/40" />
        <h2 className="text-lg font-bold mt-4 text-foreground">
          Access Restricted
        </h2>
        <p className="text-sm mt-1 text-muted-foreground">
          Only Super Admins can manage user roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <Shield size={17} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Assign roles to users across the platform
            </p>
          </div>
        </div>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-accent border border-border">
        {ROLES.map(({ value, label, color, bg }) => (
          <div key={value} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${bg} ${color}`}>
            <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 w-full"
          id="user-search"
        />
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin border-border border-t-primary" />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["User", "Email", "Role", "Status", "Joined"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const roleInfo = ROLES.find((r) => r.value === user.role) || ROLES[4];
                const isMe = user.id === session?.user?.id;

                return (
                  <tr
                    key={user.id}
                    className="transition-colors border-b border-border"
                    style={{
                      background: isMe ? "hsl(var(--primary) / 0.04)" : undefined,
                    }}
                  >
                    {/* Avatar + Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${roleInfo.bg} ${roleInfo.color}`}>
                            {user.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {user.name}
                            {isMe && (
                              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                You
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {user.email}
                    </td>

                    {/* Role dropdown */}
                    <td className="px-5 py-3.5">
                      <div className="relative">
                        <button
                          onClick={() =>
                            !isMe &&
                            setOpenDropdown(
                              openDropdown === user.id ? null : user.id
                            )
                          }
                          disabled={isMe || updating === user.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${roleInfo.bg} ${roleInfo.color} ${isMe ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {updating === user.id ? (
                            <div className="w-3 h-3 border rounded-full animate-spin border-transparent border-t-current" />
                          ) : (
                            <Shield size={11} />
                          )}
                          {roleInfo.label}
                          {!isMe && <ChevronDown size={11} />}
                        </button>

                        {/* Dropdown */}
                        {openDropdown === user.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            />
                            <div className="absolute z-20 top-full mt-1 left-0 w-44 rounded-xl py-1 shadow-lg animate-fade-up bg-card border border-border">
                              {ROLES.map((r) => (
                                <button
                                  key={r.value}
                                  onClick={() =>
                                    changeRole(user.id, r.value)
                                  }
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors hover:bg-accent ${r.color}`}
                                >
                                  <div className={`w-2 h-2 rounded-full ${r.color.replace('text-', 'bg-')}`} />
                                  {r.label}
                                  {user.role === r.value && (
                                    <Check size={12} className="ml-auto" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className={`badge badge-${user.status}`}>
                        {user.status}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
