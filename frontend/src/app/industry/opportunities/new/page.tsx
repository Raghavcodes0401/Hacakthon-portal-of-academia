"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { Sparkles, ArrowRight, Check, Briefcase } from "lucide-react";

export default function CreateOpportunityPage() {
  const router = useRouter();

  // Natural language extraction state
  const [rawText, setRawText] = useState(
    "We are looking for a backend development intern who knows Python, FastAPI, PostgreSQL and Git. Docker experience is preferred. Candidates must have a minimum CGPA of 7.5."
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedNotice, setExtractedNotice] = useState("");

  // Form Fields
  const [oppType, setOppType] = useState<"INTERNSHIP" | "JOB">("INTERNSHIP");
  const [title, setTitle] = useState("Backend Development Intern");
  const [description, setDescription] = useState(
    "Join our high-concurrency systems team to build asynchronous microservices, manage PostgreSQL queries, and containerize applications."
  );
  const [location, setLocation] = useState("Bengaluru, Karnataka (Hybrid)");
  const [workMode, setWorkMode] = useState<"HYBRID" | "REMOTE" | "ON_SITE">("HYBRID");
  const [salary, setSalary] = useState("₹35,000 / Month");
  const [minCgpa, setMinCgpa] = useState(7.5);
  const [branches, setBranches] = useState("Computer Science, IT, Electronics");
  const [requiredSkillsStr, setRequiredSkillsStr] = useState("Python, FastAPI, SQL, Git");
  const [preferredSkillsStr, setPreferredSkillsStr] = useState("Docker, System Design");
  const [experience, setExperience] = useState("Fresher / 0-1 Year");
  const [isPublishing, setIsPublishing] = useState(false);

  const handleAnalyzeWithAI = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    setExtractedNotice("");
    try {
      const res = await api.post("/opportunities/analyze-requirements", {
        raw_job_description: rawText,
      });
      if (res.title) setTitle(res.title);
      if (res.type) setOppType(res.type);
      if (res.work_mode) setWorkMode(res.work_mode);
      if (res.min_cgpa) setMinCgpa(res.min_cgpa);
      if (res.eligible_branches) setBranches(res.eligible_branches);
      if (res.required_skills?.length) setRequiredSkillsStr(res.required_skills.join(", "));
      if (res.preferred_skills?.length) setPreferredSkillsStr(res.preferred_skills.join(", "));
      if (res.experience_required) setExperience(res.experience_required);

      setExtractedNotice(res.summary || "AI successfully extracted requirements. Review and modify before publishing.");
    } catch (e: any) {
      alert(e.message || "Failed to analyze requirements");
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      const reqSkills = requiredSkillsStr.split(",").map((s) => s.trim()).filter(Boolean);
      const prefSkills = preferredSkillsStr.split(",").map((s) => s.trim()).filter(Boolean);

      const res = await api.post("/opportunities", {
        type: oppType,
        title,
        description,
        raw_job_description: rawText,
        location,
        work_mode: workMode,
        salary_or_stipend: salary,
        min_cgpa: Number(minCgpa),
        eligible_branches: branches,
        required_skills_json: reqSkills,
        preferred_skills_json: prefSkills,
        experience_required: experience,
      });

      router.push(`/industry/candidates?oppId=${res.opportunity_id}`);
    } catch (e: any) {
      alert(e.message || "Failed to publish opportunity");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Recruitment Opportunity</h1>
        <p className="text-xs text-slate-500">
          Publish internships and jobs to verified universities with AI requirement extraction
        </p>
      </div>

      {/* AI Extraction Banner */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-blue-900">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Natural Language Job Description Analyzer
          </CardTitle>
          <CardDescription>
            Paste your raw unformatted job description. AI extracts required competencies, eligibility, and criteria for human review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            rows={3}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs shadow-xs focus:border-blue-500 focus:outline-none"
            placeholder="Paste raw job description here..."
          />

          <div className="flex items-center justify-between">
            {extractedNotice ? (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="h-4 w-4" /> {extractedNotice}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                AI extraction never silently alters criteria; you can freely review and fine-tune below.
              </span>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAnalyzeWithAI}
              isLoading={isExtracting}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Analyze Requirements with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Structured Opportunity Form */}
      <Card>
        <CardHeader>
          <CardTitle>Opportunity Parameters & Criteria</CardTitle>
          <CardDescription>Review and verify fields before final publication</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublish} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Opportunity Type</label>
                <select
                  value={oppType}
                  onChange={(e) => setOppType(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="INTERNSHIP">Internship</option>
                  <option value="JOB">Full-Time Job</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Role Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role Description & Responsibilities</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs shadow-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Mode</label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="HYBRID">Hybrid</option>
                  <option value="REMOTE">Remote</option>
                  <option value="ON_SITE">On-Site</option>
                </select>
              </div>
              <Input
                label="Stipend / Salary"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. ₹35,000 / Month"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Minimum CGPA Cutoff"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(Number(e.target.value))}
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="Eligible Branches"
                  value={branches}
                  onChange={(e) => setBranches(e.target.value)}
                  placeholder="Computer Science, IT, Electronics"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Required Skills (Comma separated)"
                value={requiredSkillsStr}
                onChange={(e) => setRequiredSkillsStr(e.target.value)}
                placeholder="Python, FastAPI, SQL, Git"
                helperText="Primary skills factored at 35% in candidate matching"
                required
              />
              <Input
                label="Preferred Skills (Comma separated)"
                value={preferredSkillsStr}
                onChange={(e) => setPreferredSkillsStr(e.target.value)}
                placeholder="Docker, Kubernetes, Redis"
                helperText="Bonus points in candidate match ranking"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isPublishing}>
                Publish Opportunity & Calculate Matches
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
