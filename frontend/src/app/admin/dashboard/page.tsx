"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import {
  ShieldAlert,
  Building2,
  Users,
  Briefcase,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  Activity
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get("/admin/stats");
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading platform metrics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4a0817] via-[#631024] to-[#801b33] p-6 text-white shadow-md border border-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Platform Administration</Badge>
            <span className="text-xs text-slate-300 font-medium">National Digital Governance Command</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">System Infrastructure & Oversight</h1>
          <p className="text-xs text-slate-300">
            Real-time auditing, organization accreditation, and multi-tenant security monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/verifications">
            <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-0">
              <Building2 className="h-4 w-4 mr-1.5" /> Review Pending Orgs ({stats?.pending_verifications || 0})
            </Button>
          </Link>
          <Link href="/admin/audit-logs">
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
              <Activity className="h-4 w-4 mr-1.5" /> Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Registered Users</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stats?.total_users}</h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Across All 5 Roles</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Verifications</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{stats?.pending_verifications}</h3>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Requires Administrator Action</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Opportunities</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stats?.total_opportunities}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Published Jobs/Internships</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Courses Published</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stats?.total_courses}</h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Accredited Curricula</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:border-blue-300 transition">
          <CardHeader>
            <CardTitle>Organization Accreditation</CardTitle>
            <CardDescription>
              Review registration requests from higher educational institutes and industry recruiters
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Unverified entities cannot publish opportunities or recruit students.
            </p>
            <Link href="/admin/verifications">
              <Button variant="primary" size="sm">
                Open Queue <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-blue-300 transition">
          <CardHeader>
            <CardTitle>Security & Audit Stream</CardTitle>
            <CardDescription>
              Immutable record of all login events, content publications, and permission changes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Track suspicious events, authorization modifications, and entity lifecycles.
            </p>
            <Link href="/admin/audit-logs">
              <Button variant="outline" size="sm">
                View Logs <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
