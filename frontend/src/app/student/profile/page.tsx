"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Modal } from "@/components/ui";
import { Sparkles, Plus, CheckCircle, ShieldCheck, UserCheck } from "lucide-react";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState(6);
  const [cgpa, setCgpa] = useState(8.5);
  const [targetCareer, setTargetCareer] = useState("Backend Engineer");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Add skill modal
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] = useState("INTERMEDIATE");

  const fetchProfile = async () => {
    try {
      const data = await api.get("/students/me");
      setProfile(data);
      setDegree(data.degree || "B.Tech");
      setDepartment(data.department || "Computer Science and Engineering");
      setSemester(data.semester || 6);
      setCgpa(data.cgpa || 8.5);
      setTargetCareer(data.target_career || "Backend Engineer");
      setBio(data.bio || "");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");
    try {
      await api.patch("/students/me", {
        degree,
        department,
        semester: Number(semester),
        cgpa: Number(cgpa),
        target_career: targetCareer,
        bio,
      });
      setSaveMessage("Profile updated successfully!");
      fetchProfile();
    } catch (e: any) {
      setSaveMessage(e.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    try {
      await api.post("/students/skills", {
        skill_name: newSkillName.trim(),
        proficiency: newSkillProficiency,
      });
      setShowAddSkill(false);
      setNewSkillName("");
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  if (!profile) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading student profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-xs text-slate-500">Manage your academic credentials, verified skills, and target career pathway</p>
      </div>

      {/* Technical Skills Section with Explicit Source Attribution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Technical Competencies & Credentials</CardTitle>
            <CardDescription>
              Clearly differentiated by source: Self-Declared vs. AI-Assessed vs. Verified
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddSkill(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Self-Declared Skill
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(profile.skills || []).map((s: any) => (
              <div
                key={s.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex flex-col justify-between space-y-2 hover:border-blue-300 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{s.skill_name}</span>
                  {s.source === "VERIFIED" ? (
                    <Badge variant="verified">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : s.source === "AI_ASSESSED" ? (
                    <Badge variant="default">
                      <Sparkles className="h-3 w-3 mr-1" /> AI Assessed
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <UserCheck className="h-3 w-3 mr-1" /> Self Declared
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Proficiency: {s.proficiency}</span>
                  {s.score > 0 && (
                    <span className="font-bold text-blue-700">{s.score.toFixed(0)}% Score</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Academic Information Form */}
      <Card>
        <CardHeader>
          <CardTitle>Academic & Career Information</CardTitle>
          <CardDescription>Verified institutional metrics used for automated job eligibility filters</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            {saveMessage && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                {saveMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name (Official)"
                value={profile.full_name}
                disabled
                helperText="Locked to institutional registrar identity"
              />
              <Input
                label="Institution"
                value={profile.organization_name || "Autonomous Institute"}
                disabled
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Degree Program"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                required
              />
              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
              <Input
                label="Current Semester"
                type="number"
                min="1"
                max="8"
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cumulative GPA (CGPA on 10.0 scale)"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={cgpa}
                onChange={(e) => setCgpa(Number(e.target.value))}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                  Target Career Role (Used for Skill Gap Analysis)
                </label>
                <select
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Data Scientist">Data Scientist / AI Engineer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                Professional Bio & Project Experience
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs shadow-sm focus:border-blue-500 focus:outline-none"
                placeholder="Brief summary of your technical projects and achievements..."
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Add Skill Modal */}
      <Modal
        isOpen={showAddSkill}
        onClose={() => setShowAddSkill(false)}
        title="Add Technical Skill"
        description="Declare a self-evaluated competency. Take an assessment later to upgrade to AI-Assessed."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Skill Name"
            placeholder="e.g. Docker, Redis, Kubernetes, PostgreSQL"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
              Proficiency Level
            </label>
            <select
              value={newSkillProficiency}
              onChange={(e) => setNewSkillProficiency(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="BEGINNER">Beginner (Basic understanding)</option>
              <option value="INTERMEDIATE">Intermediate (Practical project experience)</option>
              <option value="ADVANCED">Advanced (Production deployment mastery)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddSkill(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddSkill}>
              Save Skill
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
