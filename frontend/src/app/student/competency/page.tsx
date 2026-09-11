"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from "recharts";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export default function StudentCompetencyPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get("/students/competency");
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading competency analytics...</div>;
  }

  // Format radar data
  const radarData = (data?.competencies || []).map((c: any) => ({
    skill: c.skill_name,
    score: c.score,
    fullMark: 100,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Competency & Skill Gap Report</h1>
            <Badge variant="verified">Grounded in Assessment Data</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time evaluation against industry benchmark for <strong>{data?.target_career || "Backend Engineer"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500">Overall Readiness</span>
            <p className="text-2xl font-black text-blue-700 leading-none mt-0.5">
              {data?.overall_readiness || 78}%
            </p>
          </div>
        </div>
      </div>

      {/* Radar Chart + Competency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Visual */}
        <Card>
          <CardHeader>
            <CardTitle>Competency Radar</CardTitle>
            <CardDescription>Multi-axis evaluation of assessed technical competencies</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] flex items-center justify-center pt-0">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#334155", fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <Radar
                    name="Student Competency"
                    dataKey="score"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.45}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">Take an assessment to generate your radar chart.</p>
            )}
          </CardContent>
        </Card>

        {/* Skill Scores List */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Breakdown vs Requirement</CardTitle>
            <CardDescription>Deterministic scores calculated per technical domain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {(data?.competencies || []).map((c: any) => (
              <div key={c.skill_name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{c.skill_name}</span>
                  <span className={c.score >= 75 ? "text-emerald-600 font-bold" : c.score >= 60 ? "text-amber-600 font-bold" : "text-red-600 font-bold"}>
                    {c.score.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      c.score >= 75 ? "bg-emerald-500" : c.score >= 60 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, c.score))}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detected Skill Gaps Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Detected Skill Gaps for {data?.target_career}
          </CardTitle>
          <CardDescription>
            Categorized by deficit severity with recommended institutional actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {(data?.skill_gaps || []).map((gap: any) => (
              <div key={gap.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{gap.skill_name}</span>
                    <Badge
                      variant={
                        gap.gap_severity === "CRITICAL"
                          ? "destructive"
                          : gap.gap_severity === "MODERATE"
                          ? "warning"
                          : gap.gap_severity === "MINOR"
                          ? "default"
                          : "success"
                      }
                    >
                      {gap.gap_severity} GAP
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{gap.recommended_action}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-slate-700">
                    Current: <span className="font-bold">{gap.current_score.toFixed(0)}%</span> / Req: <span className="text-blue-600">{gap.required_score.toFixed(0)}%</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SWOT Analysis Matrix */}
      {data?.swot && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">AI Grounded SWOT Matrix</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
              <span className="font-extrabold text-xs text-emerald-900 uppercase tracking-wider">Strengths</span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {(data.swot.strengths || []).map((s: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
              <span className="font-extrabold text-xs text-amber-900 uppercase tracking-wider">Weaknesses</span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {(data.swot.weaknesses || []).map((w: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
              <span className="font-extrabold text-xs text-blue-900 uppercase tracking-wider">Opportunities</span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {(data.swot.opportunities || []).map((o: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Market Factors</span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {(data.swot.threats || []).map((t: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Learning Resources */}
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Recommended Courses & National MOOC Resources</h3>
          <p className="text-xs text-slate-500">Curated specifically to close your detected skill gaps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data?.recommended_external_resources || []).map((ext: any) => (
            <div
              key={ext.id}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-blue-300 transition"
            >
              <div className="flex items-center justify-between">
                <Badge variant="gov">{ext.provider}</Badge>
                <span className="text-[10px] text-slate-400 font-semibold">{ext.skill}</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900">{ext.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2">{ext.description}</p>
              <a
                href={ext.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline pt-1"
              >
                Access on {ext.provider} <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
