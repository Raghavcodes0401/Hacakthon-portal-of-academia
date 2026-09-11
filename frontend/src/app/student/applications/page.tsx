"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { FileText, ArrowRight, CheckCircle2, Clock, Briefcase } from "lucide-react";

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      try {
        const data = await api.get("/students/applications");
        setApplications(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadApplications();
  }, []);

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading your applications...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SELECTED":
        return <Badge variant="success">Selected / Offer Extended</Badge>;
      case "SHORTLISTED":
        return <Badge variant="verified">Shortlisted by Recruiter</Badge>;
      case "INTERVIEW":
        return <Badge variant="default">Interview Scheduled</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="warning">Under Review</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Not Selected</Badge>;
      default:
        return <Badge variant="outline">Applied</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Applications</h1>
          <p className="text-xs text-slate-500">Track real-time candidate pipeline stages and recruiter decisions</p>
        </div>
        <Link href="/student/jobs">
          <Button variant="outline" size="sm">
            Browse Opportunities <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {applications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">No applications submitted yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once you apply for verified industry internships and jobs, your real-time application status will appear here.
            </p>
            <Link href="/student/jobs">
              <Button variant="primary" size="sm">
                Explore Job Board
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id} className="hover:border-blue-300 transition">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{app.opportunity_title}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600">{app.organization_name}</span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {app.type} • {app.location} {app.salary_or_stipend && `• ${app.salary_or_stipend}`}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>Applied on: {new Date(app.applied_at).toLocaleDateString()}</span>
                    <span>
                      AI Match Score:{" "}
                      <strong className="text-blue-600 font-bold">{app.match_percentage?.toFixed(0)}%</strong>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {getStatusBadge(app.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
