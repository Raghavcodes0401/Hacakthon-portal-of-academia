"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [researchInterests, setResearchInterests] = useState("");
  const [orcid, setOrcid] = useState("");
  const [scholarUrl, setScholarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const fetchProfile = async () => {
    try {
      const data = await api.get("/faculty/me");
      setProfile(data);
      setDepartment(data.department || "");
      setDesignation(data.designation || "Professor");
      setResearchInterests(data.research_interests || "");
      setOrcid(data.orcid_id || "");
      setScholarUrl(data.scholar_url || "");
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
      await api.patch("/faculty/me", {
        department,
        designation,
        research_interests: researchInterests,
        orcid_id: orcid,
        scholar_url: scholarUrl,
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

  if (!profile) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading faculty profile...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty & Researcher Profile</h1>
        <p className="text-xs text-slate-500">
          Your research domains drive our AI collaborator matching and national grant alerts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic & Research Information</CardTitle>
          <CardDescription>Verified academic appointment details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            {saveMessage && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                {saveMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={profile.full_name} disabled />
              <Input label="Institution" value={profile.organization_name} disabled />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
              <Input
                label="Designation / Title"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Research Interests & Specialized Domains (Comma separated)
              </label>
              <textarea
                rows={2}
                value={researchInterests}
                onChange={(e) => setResearchInterests(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Distributed Systems, High-Performance Microservices, Cloud Security, Edge AI"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ORCID iD"
                value={orcid}
                onChange={(e) => setOrcid(e.target.value)}
                placeholder="0000-0002-1825-0097"
              />
              <Input
                label="Google Scholar URL"
                value={scholarUrl}
                onChange={(e) => setScholarUrl(e.target.value)}
                placeholder="https://scholar.google.com/citations?user=..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Biography & Academic Background
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-blue-500 focus:outline-none"
                placeholder="Brief summary of academic appointments, publications, and laboratory groups..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
