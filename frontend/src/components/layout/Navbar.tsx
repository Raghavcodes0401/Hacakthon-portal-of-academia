"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Badge, Button } from "@/components/ui";
import {
  Bell,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Building2,
  GraduationCap,
  Briefcase,
  Layers,
  Check
} from "lucide-react";

export function Navbar() {
  const { user, logout, switchRoleQuick } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.get("/notifications");
      setNotifications(data || []);
      const countRes = await api.get("/notifications/unread-count");
      setUnreadCount(countRes?.unread_count || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/mark-all-read");
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case "STUDENT":
        return <Badge variant="default">Student</Badge>;
      case "FACULTY":
        return <Badge variant="gov">Faculty / Researcher</Badge>;
      case "INSTITUTION_ADMIN":
        return <Badge variant="warning">Institution Admin</Badge>;
      case "INDUSTRY_USER":
        return <Badge variant="verified">Industry Partner</Badge>;
      case "PLATFORM_ADMIN":
        return <Badge variant="destructive">Platform Admin</Badge>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      {/* Top Gov Header Line */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-blue-800 to-emerald-600" />

      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Emblem */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#631024] via-[#801b33] to-[#430917] text-white font-black text-xl shadow-md border border-amber-400/40">
            <span className="tracking-tighter bg-gradient-to-r from-amber-200 to-white bg-clip-text text-transparent">SETU</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-[#631024] group-hover:text-[#801b33] transition">
                SETU<span className="text-amber-600">.GOV.IN</span>
              </span>
              <span className="hidden md:inline-flex items-center text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-[#fce7ea] text-[#801b33] border border-[#f8d2d9]">
                National Academic ↔ Industry Bridge
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-600 font-medium">
              Structural Education Transformation Union
            </p>
          </div>
        </Link>

        {/* Right Action Bar */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher for SIH / Demonstration */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden sm:inline">Role:</span>
                <span className="text-slate-900 font-bold">{user.role.replace("_", " ")}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase text-slate-400">
                    Switch Active Persona
                  </div>
                  {[
                    { role: "STUDENT", label: "Student (Rahul Sharma)" },
                    { role: "FACULTY", label: "Faculty (Dr. Sharma)" },
                    { role: "INSTITUTION_ADMIN", label: "Institution (IIT Delhi)" },
                    { role: "INDUSTRY_USER", label: "Industry (Tata Research)" },
                    { role: "PLATFORM_ADMIN", label: "Platform Administrator" },
                  ].map((item) => (
                    <button
                      key={item.role}
                      onClick={async () => {
                        setShowRoleSwitcher(false);
                        await switchRoleQuick(item.role as any);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs text-left font-medium transition ${
                        user.role === item.role
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item.label}
                      {user.role === item.role && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`py-2 px-1 text-xs ${!n.is_read ? "font-medium text-slate-900 bg-blue-50/50 rounded" : "text-slate-600"}`}
                        >
                          <p className="font-bold text-[11px]">{n.title}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">{user.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                  {user.organization_name || user.email}
                </p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
