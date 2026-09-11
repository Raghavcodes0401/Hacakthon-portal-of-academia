"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  User,
  CheckSquare,
  BarChart3,
  BookOpen,
  Briefcase,
  Calendar,
  FileText,
  Building2,
  Users,
  Award,
  Sparkles,
  ShieldAlert,
  Database,
  Search,
  BookMarked,
  FlaskConical
} from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const roleNavItems = {
    STUDENT: [
      { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
      { label: "My Profile", href: "/student/profile", icon: User },
      { label: "Assessment", href: "/student/assessment", icon: CheckSquare },
      { label: "Competency & Gaps", href: "/student/competency", icon: BarChart3 },
      { label: "Learning & Courses", href: "/student/learning", icon: BookOpen },
      { label: "Jobs & Internships", href: "/student/jobs", icon: Briefcase },
      { label: "Research Papers", href: "/faculty/research", icon: FlaskConical },
      { label: "Workshops", href: "/student/workshops", icon: Calendar },
      { label: "My Applications", href: "/student/applications", icon: FileText },
    ],
    INDUSTRY_USER: [
      { label: "Dashboard", href: "/industry/dashboard", icon: LayoutDashboard },
      { label: "Create Opportunity", href: "/industry/opportunities/new", icon: Sparkles },
      { label: "AI Candidate Match", href: "/industry/candidates", icon: Users },
      { label: "Research Papers", href: "/faculty/research", icon: FlaskConical },
      { label: "Workshops", href: "/industry/workshops", icon: Calendar },
    ],
    FACULTY: [
      { label: "Dashboard", href: "/faculty/dashboard", icon: LayoutDashboard },
      { label: "Faculty Profile", href: "/faculty/profile", icon: User },
      { label: "Create Course", href: "/faculty/courses/new", icon: BookOpen },
      { label: "Research Papers", href: "/faculty/research", icon: FileText },
      { label: "AI Collaborations", href: "/faculty/collaborations", icon: Users },
      { label: "Research Grants", href: "/faculty/grants", icon: Award },
    ],
    INSTITUTION_ADMIN: [
      { label: "Dashboard", href: "/institution/dashboard", icon: LayoutDashboard },
      { label: "Student Roster", href: "/institution/students", icon: Users },
      { label: "Courses & Curricula", href: "/institution/courses", icon: BookOpen },
      { label: "Research Papers", href: "/faculty/research", icon: FlaskConical },
      { label: "Competency Analytics", href: "/institution/analytics", icon: BarChart3 },
    ],
    PLATFORM_ADMIN: [
      { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Database Explorer", href: "/admin/database", icon: Database },
      { label: "Research Papers", href: "/faculty/research", icon: FlaskConical },
      { label: "Org Verifications", href: "/admin/verifications", icon: Building2 },
      { label: "User Management", href: "/admin/users", icon: Users },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
    ],
  };

  const navItems = roleNavItems[user.role] || [];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-xs">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {user.role.replace("_", " ")} MENU
          </p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-[#631024] to-[#801b33] text-white shadow-sm"
                      : "text-slate-600 hover:bg-[#fdf2f4] hover:text-[#801b33]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-amber-300" : "text-slate-400 group-hover:text-[#801b33]"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Institutional Footer Badge */}
      <div className="rounded-xl border border-amber-200/80 bg-gradient-to-b from-[#fdf2f4] to-white p-3 text-center shadow-xs">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#631024]">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>SETU National Initiative</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">
          Structural Education Transformation Union • Govt. of India
        </p>
      </div>
    </aside>
  );
}
