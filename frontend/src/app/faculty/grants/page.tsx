"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { Award, Bookmark, ExternalLink, Calendar, DollarSign, Clock } from "lucide-react";

export default function FacultyGrantsPage() {
  const [grants, setGrants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGrants = async () => {
    try {
      const data = await api.get("/faculty/grants");
      setGrants(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleBookmark = async (grantId: string) => {
    try {
      await api.post(`/faculty/grants/${grantId}/bookmark`);
      fetchGrants();
    } catch (e: any) {
      alert(e.message || "Failed to update bookmark");
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading research grants...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">National Research Grants</h1>
        <p className="text-xs text-slate-500">
          Funded schemes from SERB, DST, CSIR, and national laboratories for academic research teams
        </p>
      </div>

      <div className="space-y-4">
        {grants.map((g) => (
          <Card key={g.id} className="hover:border-blue-300 transition">
            <CardContent className="p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="gov">{g.funding_agency}</Badge>
                    <span className="text-xs font-semibold text-slate-500">{g.domain}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{g.title}</h3>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    variant={g.is_bookmarked ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleBookmark(g.id)}
                  >
                    <Bookmark className={`h-3.5 w-3.5 mr-1 ${g.is_bookmarked ? "fill-white" : ""}`} />
                    {g.is_bookmarked ? "Bookmarked" : "Bookmark Grant"}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">{g.description}</p>

              {g.eligibility && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-0.5">
                  <strong className="text-slate-800">Eligibility:</strong> {g.eligibility}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-emerald-700 text-sm">
                    Funding: {g.funding_amount}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Deadline: {new Date(g.deadline).toLocaleDateString()}
                  </span>
                </div>

                {g.application_url && (
                  <a
                    href={g.application_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center font-bold text-blue-600 hover:underline"
                  >
                    Official Portal Application <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
