"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Modal } from "@/components/ui";
import { Briefcase, MapPin, DollarSign, CheckCircle2, ShieldCheck, Send } from "lucide-react";

export default function StudentJobsPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [selectedOpp, setSelectedOpp] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOpportunities = async () => {
    try {
      const url = typeFilter ? `/opportunities?type=${typeFilter}` : "/opportunities";
      const data = await api.get(url);
      setOpportunities(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [typeFilter]);

  const handleApply = async () => {
    if (!selectedOpp) return;
    setIsApplying(true);
    try {
      await api.post(`/opportunities/${selectedOpp.id}/apply`, {
        cover_letter: coverLetter,
      });
      setSelectedOpp(null);
      setCoverLetter("");
      fetchOpportunities();
    } catch (e: any) {
      alert(e.message || "Failed to submit application");
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading industry opportunities...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Jobs & Internships</h1>
          <p className="text-xs text-slate-500">
            Direct recruitment opportunities from verified enterprise & startup partners
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Opportunities</option>
            <option value="INTERNSHIP">Internships</option>
            <option value="JOB">Full-Time Jobs</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {opportunities.map((opp) => (
          <Card key={opp.id} className="hover:border-blue-300 hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={opp.type === "INTERNSHIP" ? "default" : "gov"}>{opp.type}</Badge>
                    <span className="font-bold text-xs text-slate-600 flex items-center gap-1">
                      {opp.organization_name}
                      {opp.organization_verified && (
                        <span title="Verified Organization">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 inline" />
                        </span>
                      )}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">{opp.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{opp.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> {opp.location} ({opp.work_mode})
                    </span>
                    {opp.salary_or_stipend && (
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <DollarSign className="h-3.5 w-3.5 text-slate-400" /> {opp.salary_or_stipend}
                      </span>
                    )}
                    <span>Min CGPA: <strong>{opp.min_cgpa.toFixed(1)}</strong></span>
                  </div>

                  {/* Required skills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-400">Required Skills:</span>
                    {(opp.required_skills_json || []).map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2 pt-2 md:pt-0">
                  {opp.has_applied ? (
                    <Badge variant="verified">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Applied
                    </Badge>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => setSelectedOpp(opp)}>
                      Apply Now
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Apply Modal */}
      {selectedOpp && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOpp(null)}
          title={`Apply for ${selectedOpp.title}`}
          description={`Submit your application to ${selectedOpp.organization_name}`}
        >
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 text-slate-600">
              <p><strong>Work Mode:</strong> {selectedOpp.work_mode} • <strong>Location:</strong> {selectedOpp.location}</p>
              <p><strong>Eligibility:</strong> Minimum {selectedOpp.min_cgpa} CGPA in {selectedOpp.eligible_branches}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cover Note / Message to Recruiter
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain your relevant project experience, verified assessment scores, and interest in this role..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedOpp(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleApply} isLoading={isApplying}>
                <Send className="h-3.5 w-3.5 mr-1.5" /> Submit Application
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
