"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { Users, Search, ShieldCheck, UserX, Check } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const url = roleFilter ? `/admin/users?role=${roleFilter}` : "/admin/users";
      const data = await api.get(url);
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/status?is_active=${!currentStatus}`);
      fetchUsers();
    } catch (e: any) {
      alert(e.message || "Failed to update user status");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading user directory...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management Directory</h1>
          <p className="text-xs text-slate-500">
            Platform-wide roster across Students, Faculty, Institutions, and Industry users
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
            <option value="INSTITUTION_ADMIN">Institution Admin</option>
            <option value="INDUSTRY_USER">Industry User</option>
            <option value="PLATFORM_ADMIN">Platform Admin</option>
          </select>
          <input
            type="text"
            placeholder="Search name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs shadow-xs focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Name & Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Affiliated Organization</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="gov">{u.role.replace("_", " ")}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {u.organization_name || "Independent"}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== "PLATFORM_ADMIN" && (
                        <Button
                          variant={u.is_active ? "danger" : "primary"}
                          size="sm"
                          className="text-[11px] h-7 px-2.5"
                          onClick={() => handleToggleStatus(u.id, u.is_active)}
                        >
                          {u.is_active ? "Suspend" : "Activate"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
