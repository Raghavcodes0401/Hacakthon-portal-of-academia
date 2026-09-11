"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import {
  Building2,
  Users,
  BookOpen,
  FlaskConical,
  Award,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function InstitutionDashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await api.get("/institutions/analytics");
        setAnalytics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading institutional analytics...</div>;
  }

  const deptData = analytics?.department_distribution || [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4a0817] via-[#631024] to-[#801b33] p-6 text-white shadow-md border border-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Institution Governance & Dean Portal
            </span>
            <Badge variant="verified">Accredited Institute</Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {analytics?.institution_name || user?.organization_name || "Autonomous University"}
          </h1>
          <p className="text-xs text-slate-300">
            Institutional Competency Index: <strong className="text-white">{analytics?.average_student_competency}%</strong> across all academic cohorts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/institution/students">
            <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-0">
              <Users className="h-4 w-4 mr-1.5" /> View Student Roster
            </Button>
          </Link>
          <Link href="/faculty/courses/new">
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
              Publish Institutional Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Enrolled Students</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{analytics?.total_students}</h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Active Academic Cohort</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Faculty Researchers</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{analytics?.total_faculty}</h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Academic Staff</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Published Curricula</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{analytics?.total_courses}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Accredited Modules</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Research Publications</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{analytics?.total_research_papers}</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Peer Reviewed Papers</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FlaskConical className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Critical Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Departmental Competency Benchmark</CardTitle>
            <CardDescription>Average student assessment scores across academic branches</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="avg_competency" fill="#005a9c" radius={[6, 6, 0, 0]} name="Avg Competency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Macro Skill Strengths */}
        <Card>
          <CardHeader>
            <CardTitle>Institution-Wide Skill Averages</CardTitle>
            <CardDescription>Aggregated performance across all student assessments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-1">
            {Object.entries(analytics?.skill_averages || {}).map(([skill, score]: any) => (
              <div key={skill} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{skill}</span>
                  <span className={score >= 75 ? "text-emerald-600 font-bold" : score >= 60 ? "text-amber-600 font-bold" : "text-red-600 font-bold"}>
                    {score.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      score >= 75 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Critical Institutional Gaps Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Priority Curriculum Skill Deficits
          </CardTitle>
          <CardDescription>
            System-wide deficits impacting student industry recruitment conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {(analytics?.critical_gaps || []).map((g: any) => (
              <div key={g.skill} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900">{g.skill}</h4>
                    <Badge variant={g.severity === "CRITICAL" ? "destructive" : "warning"}>
                      {g.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{g.rec}</p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-xs text-slate-400 block">Affected Student Population</span>
                  <span className="text-base font-black text-red-600">{g.affected_students_pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
