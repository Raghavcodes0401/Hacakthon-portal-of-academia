"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import {
  GraduationCap,
  Briefcase,
  CheckSquare,
  Award,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [competency, setCompetency] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profData, compData, appsData, coursesData] = await Promise.all([
          api.get("/students/me"),
          api.get("/students/competency"),
          api.get("/students/applications"),
          api.get("/courses"),
        ]);
        setProfile(profData);
        setCompetency(compData);
        setApplications(appsData || []);
        setCourses((coursesData || []).slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading student ecosystem data...</div>;
  }

  const readiness = competency?.overall_readiness || 78;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4a0817] via-[#631024] to-[#801b33] p-6 text-white shadow-md border border-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Student Career & Competency Hub
            </span>
            <Badge variant="verified">Enrolled Student</Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Welcome back, {profile?.full_name || "Student"}!
          </h1>
          <p className="text-xs text-slate-200">
            {profile?.degree} in {profile?.department} • {profile?.organization_name || "Institution"} • CGPA: {profile?.cgpa?.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/student/assessment">
            <Button variant="primary" size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-0">
              <CheckSquare className="h-4 w-4 mr-1.5" /> Take Skill Assessment
            </Button>
          </Link>
          <Link href="/student/jobs">
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">
              Explore Internships
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Required Prompt for New Students */}
      {(!competency?.competencies || competency.competencies.length === 0) && (
        <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-[#4a0817] via-[#631024] to-[#801b33] p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-black text-amber-300 border border-amber-400/40">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" /> MANDATORY ONBOARDING STEP
            </div>
            <h3 className="text-xl font-black tracking-tight text-white">Complete Your 5-Question Diagnostic Assessment</h3>
            <p className="text-xs text-slate-200 max-w-xl leading-relaxed font-medium">
              To unlock your personalized AI Competency Radar, detect skill gaps, and activate direct recruiter matching, take our short 5-question technical quiz.
            </p>
          </div>
          <Link href="/student/assessment?auto=true" className="shrink-0 w-full md:w-auto">
            <Button variant="primary" className="w-full md:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg text-xs py-2.5 px-5">
              Take 5-Question Quiz Now →
            </Button>
          </Link>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Career Readiness</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{readiness}%</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> Target: {profile?.target_career || "Backend Engineer"}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Active Applications</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{applications.length}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Industry Postings</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Verified Competencies</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{profile?.skills?.length || 5}</h3>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">AI Benchmarked</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <GraduationCap className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Detected Skill Gaps</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{competency?.skill_gaps?.length || 2}</h3>
              <p className="text-[11px] text-red-600 font-medium mt-0.5">Upskilling Required</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Competency Preview + Active Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competency Snapshot */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm">Skill Competency Snapshot</CardTitle>
              <p className="text-xs text-slate-400">Deterministic scoring per domain</p>
            </div>
            <Link href="/student/competency">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                View Radar <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {(competency?.competencies || []).slice(0, 5).map((comp: any) => (
              <div key={comp.skill_name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{comp.skill_name}</span>
                  <span className={comp.score >= 75 ? "text-emerald-600" : comp.score >= 60 ? "text-amber-600" : "text-red-600"}>
                    {comp.score.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      comp.score >= 75 ? "bg-emerald-500" : comp.score >= 60 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, comp.score))}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 mt-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>AI Recommendation</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Closing your moderate gap in <strong>Docker</strong> will boost your backend job match ranking from 88% to 95%.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications Pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm">My Internship & Job Applications</CardTitle>
              <p className="text-xs text-slate-400">Live recruitment statuses from verified industry partners</p>
            </div>
            <Link href="/student/applications">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                All Applications <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {applications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active applications. Discover internships on the job board!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 4).map((app: any) => (
                  <div key={app.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{app.opportunity_title}</h4>
                      <p className="text-[11px] text-slate-500">
                        {app.organization_name} • {app.location}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge
                        variant={
                          app.status === "SELECTED"
                            ? "success"
                            : app.status === "SHORTLISTED"
                            ? "verified"
                            : app.status === "REJECTED"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {app.status.replace("_", " ")}
                      </Badge>
                      <p className="text-[10px] text-slate-400">
                        Match: <span className="font-bold text-blue-600">{app.match_percentage?.toFixed(0)}%</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recommended Courses to Close Skill Gaps</h3>
            <p className="text-xs text-slate-500">Courses published by top university faculty and institutes</p>
          </div>
          <Link href="/student/learning">
            <Button variant="outline" size="sm" className="text-xs">
              Explore Course Catalog
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <Card key={course.id} className="hover:shadow-md transition">
              <CardContent className="pt-5 space-y-3">
                <Badge variant="gov">{course.category}</Badge>
                <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                  {course.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
                <div className="text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>{course.duration_weeks} Weeks • {course.difficulty}</span>
                  <Link href="/student/learning" className="text-blue-600 font-bold hover:underline">
                    View & Enroll →
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
