"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import {
  BookOpen,
  FlaskConical,
  Users,
  Award,
  Plus,
  ArrowRight,
  FileText,
  Sparkles
} from "lucide-react";

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [papers, setPapers] = useState<any[]>([]);
  const [collabs, setCollabs] = useState<any>({ sent: [], received: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profData, papersData, collabData] = await Promise.all([
          api.get("/faculty/me"),
          api.get("/faculty/research-papers"),
          api.get("/faculty/collaborations"),
        ]);
        setProfile(profData);
        setPapers(papersData || []);
        setCollabs(collabData || { sent: [], received: [] });
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading faculty dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4a0817] via-[#631024] to-[#801b33] p-6 text-white shadow-md border border-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="gov">Faculty & Researcher Portal</Badge>
            <span className="text-xs text-slate-300 font-medium">
              {profile?.department} • {profile?.organization_name}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {profile?.full_name || user?.full_name}
          </h1>
          <p className="text-xs text-slate-300 max-w-xl line-clamp-1">
            Research Interests: {profile?.research_interests}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/faculty/courses/new">
            <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-0">
              <Plus className="h-4 w-4 mr-1" /> Create Course
            </Button>
          </Link>
          <Link href="/faculty/research">
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
              <FileText className="h-4 w-4 mr-1" /> Publish Paper
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Published Courses</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{profile?.courses_count || 1}</h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Accredited Curricula</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Research Papers</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{papers.length}</h3>
              <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Peer-reviewed</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <FlaskConical className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Collaborations</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {(collabs.received?.length || 0) + (collabs.sent?.length || 0)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Inter-institutional</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Available Grants</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">2</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">SERB & DST Schemes</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Research Papers Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm">Recent Publications</CardTitle>
              <p className="text-xs text-slate-400">Indexed research papers and DOI references</p>
            </div>
            <Link href="/faculty/research">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {papers.slice(0, 3).map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1">
                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{p.title}</h4>
                <p className="text-[11px] text-slate-500">{p.authors} • {p.journal || "Journal Archive"}</p>
                {p.doi && <p className="text-[10px] text-blue-600 font-mono">DOI: {p.doi}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Collaboration Recommendations Shortcut */}
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm flex items-center gap-1.5 text-purple-950">
                <Sparkles className="h-4 w-4 text-purple-600" /> AI Collaboration Matcher
              </CardTitle>
              <p className="text-xs text-purple-800">Synergistic faculty across national institutes</p>
            </div>
            <Link href="/faculty/collaborations">
              <Button variant="primary" size="sm" className="text-xs">
                Find Collaborators
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-xs text-slate-700 leading-relaxed">
              Based on your research focus in <strong>{profile?.research_interests}</strong>, our semantic engine has discovered high-synergy researchers at NITK and IIT Kharagpur with matching publication domains.
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-purple-200/60 pt-3 text-xs text-purple-900 font-bold">
              <span>Dr. Sunita Verma (NITK) — 87.5% Overlap</span>
              <Link href="/faculty/collaborations" className="text-blue-600 hover:underline">
                Send Request →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
