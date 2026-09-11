"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Modal } from "@/components/ui";
import {
  Users,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  TrendingUp,
  FileCheck
} from "lucide-react";

export default function IndustryCandidatesPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading candidate matches...</div>}>
      <IndustryCandidatesContent />
    </Suspense>
  );
}

function IndustryCandidatesContent() {
  const searchParams = useSearchParams();
  const initialOppId = searchParams.get("oppId");

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [selectedOppId, setSelectedOppId] = useState<string>(initialOppId || "");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadOpportunities() {
      try {
        const data = await api.get("/opportunities");
        setOpportunities(data || []);
        if (!selectedOppId && data?.length > 0) {
          setSelectedOppId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadOpportunities();
  }, []);

  const loadMatches = async (oppId: string) => {
    if (!oppId) return;
    setIsLoading(true);
    try {
      const data = await api.get(`/opportunities/${oppId}/matches`);
      setCandidates(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOppId) {
      loadMatches(selectedOppId);
    }
  }, [selectedOppId]);

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/opportunities/applications/${appId}/status`, { status: newStatus });
      loadMatches(selectedOppId);
      if (selectedCandidate) {
        setSelectedCandidate((prev: any) => ({ ...prev, application_status: newStatus }));
      }
    } catch (e: any) {
      alert(e.message || "Failed to update application status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Candidate Matching & Ranking</h1>
            <Badge variant="verified">Human-in-the-Loop</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Weighted candidate matching grounded in verified assessment competency, eligibility, and academic records
          </p>
        </div>

        {/* Opportunity Selector */}
        <div className="w-full sm:w-72">
          <select
            value={selectedOppId}
            onChange={(e) => setSelectedOppId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.title} ({opp.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Ranking List */}
      <Card>
        <CardHeader>
          <CardTitle>Ranked Candidates for Selected Posting</CardTitle>
          <CardDescription>
            Candidates are ordered by transparent weighted matching (Skills 35%, Eligibility 20%, Assessment 20%, CGPA 15%, Experience 10%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching candidates found for this posting.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {candidates.map((cand, idx) => (
                <div
                  key={cand.student_id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 p-2 rounded-xl transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-extrabold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{cand.student_name}</h4>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-600">
                          {cand.degree} in {cand.department} (CGPA: {cand.cgpa?.toFixed(2)})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {cand.evidence_explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Match Score</span>
                      <span className="text-base font-black text-blue-700">
                        {cand.match_percentage.toFixed(0)}%
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCandidate(cand)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" /> Inspect Match
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explainable Candidate Match Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCandidate(null)}
          title={`Candidate Match: ${selectedCandidate.student_name}`}
          description={`${selectedCandidate.degree} • ${selectedCandidate.department} • CGPA: ${selectedCandidate.cgpa?.toFixed(2)}`}
          maxWidth="xl"
        >
          <div className="space-y-5 pt-2">
            {/* Top Score Summary */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase font-bold text-blue-900">Overall Recommendation Match</p>
                <h3 className="text-3xl font-black text-blue-700 mt-0.5">
                  {selectedCandidate.match_percentage.toFixed(0)}%
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs text-right">
                <div>
                  <span className="text-[10px] text-slate-400 block">Skill Score</span>
                  <span className="font-bold text-slate-800">{selectedCandidate.skill_score}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Eligibility</span>
                  <span className="font-bold text-slate-800">{selectedCandidate.eligibility_score}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Assessments</span>
                  <span className="font-bold text-slate-800">{selectedCandidate.assessment_score}%</span>
                </div>
              </div>
            </div>

            {/* Evidence Rationale */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Why is this candidate recommended?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedCandidate.evidence_explanation}
              </p>
            </div>

            {/* Strong Matches & Gaps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
                <span className="text-xs font-bold text-emerald-900">Verified Strong Matches</span>
                <div className="space-y-1">
                  {(selectedCandidate.strong_matches || []).map((m: any) => (
                    <div key={m.skill} className="flex items-center justify-between text-xs">
                      <span className="text-slate-800">{m.skill}</span>
                      <span className="font-bold text-emerald-700">{m.score}% verified</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 space-y-2">
                <span className="text-xs font-bold text-amber-900">Missing / Unverified Skills</span>
                <div className="space-y-1">
                  {(selectedCandidate.skill_gaps || []).length > 0 ? (
                    selectedCandidate.skill_gaps.map((g: string) => (
                      <div key={g} className="text-xs text-slate-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" /> {g}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No critical deficiencies detected.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Human-in-the-Loop Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Application Status:{" "}
                  <Badge variant="outline">
                    {selectedCandidate.application_status || "NOT APPLIED YET"}
                  </Badge>
                </span>

                {selectedCandidate.application_id ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedCandidate.application_id, "REJECTED")}
                      isLoading={isUpdatingStatus}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedCandidate.application_id, "SHORTLISTED")}
                      isLoading={isUpdatingStatus}
                    >
                      Shortlist
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedCandidate.application_id, "INTERVIEW")}
                      isLoading={isUpdatingStatus}
                    >
                      Move to Interview
                    </Button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Candidate has not applied directly yet; recommendations are calculated for talent discovery.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
