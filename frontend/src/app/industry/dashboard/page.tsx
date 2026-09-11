"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import {
  Briefcase,
  Users,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  Building2,
  Calendar
} from "lucide-react";

export default function IndustryDashboardPage() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.get("/opportunities");
        setOpportunities(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading industry dashboard...</div>;
  }

  const isVerified = user?.organization_verified !== false;

  return (
    <div className="space-y-8">
      {/* Verification Status Banner */}
      {isVerified ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-emerald-950">
                  {user?.organization_name || "Enterprise Partner"}
                </h2>
                <Badge variant="verified">Verified Organization</Badge>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Authorized to post internship and recruitment opportunities directly to university students.
              </p>
            </div>
          </div>

          <Link href="/industry/opportunities/new">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Post New Opportunity
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-amber-950">
                  {user?.organization_name || "Enterprise Partner"}
                </h2>
                <Badge variant="warning">Pending Verification</Badge>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Your organization is awaiting verification by the platform administrator. Opportunity posting will be activated upon approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Opportunities</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{opportunities.length}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Open for applications</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Matched Candidates</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">12</h3>
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">AI Ranked Candidates</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Recruitment Pipeline</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">8</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Under Review / Shortlisted</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Postings & Candidate Match Shortcut */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Active Recruitment Postings</h3>
            <p className="text-xs text-slate-500">Manage candidate ranking, review applications, and shortlist</p>
          </div>
          <Link href="/industry/candidates">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1.5" /> Open Candidate Matcher
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="hover:border-blue-300 transition">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant={opp.type === "INTERNSHIP" ? "default" : "gov"}>{opp.type}</Badge>
                    <h4 className="font-extrabold text-sm text-slate-900">{opp.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    {opp.location} ({opp.work_mode}) • Min CGPA: {opp.min_cgpa.toFixed(1)} • {opp.salary_or_stipend || "Competitive"}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(opp.required_skills_json || []).map((skill: string) => (
                      <span key={skill} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/industry/candidates?oppId=${opp.id}`}>
                    <Button variant="primary" size="sm">
                      <Sparkles className="h-3.5 w-3.5 mr-1" /> View AI Ranked Candidates
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
