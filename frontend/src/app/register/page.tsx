"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const [role, setRole] = useState("STUDENT");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role,
        organization_name: orgName || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check form fields.");
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#631024] via-[#801b33] to-[#430917] text-white font-black text-xl shadow-md border border-amber-400/40">
          SETU
        </div>
        <h1 className="text-2xl font-black text-[#4a0817] tracking-tight">Create SETU Account</h1>
        <p className="text-xs text-slate-600 font-medium">
          Structural Education Transformation Union • National Academic & Industry Portal
        </p>
      </div>

      <Card className="border-[#f8d2d9] shadow-sm">
        <CardHeader>
          <CardTitle>Registration Details</CardTitle>
          <CardDescription>Select your ecosystem role and provide verified credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide mb-1.5">
                Select Your Ecosystem Persona
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-[#801b33] focus:outline-none"
              >
                <option value="STUDENT">Student (Competency, Radar, Placement)</option>
                <option value="FACULTY">Faculty / Researcher (Courses, Papers, Grants)</option>
                <option value="INSTITUTION_ADMIN">Institution Administrator (Deans, Analytics)</option>
                <option value="INDUSTRY_USER">Industry Partner / Recruiter (Hiring, Workshops)</option>
              </select>
            </div>

            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Official / Institutional Email"
              type="email"
              placeholder="e.g. rahul@iitd.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password (min 6 chars)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label={
                role === "INDUSTRY_USER"
                  ? "Company / Organization Name"
                  : "College / University / Institution Name"
              }
              placeholder={role === "INDUSTRY_USER" ? "e.g. Tata Consultancy Services" : "e.g. IIT Delhi"}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />

            <Button type="submit" variant="gov" className="w-full mt-2 font-bold shadow-md" isLoading={isLoading}>
              Complete Registration on SETU
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#801b33] hover:underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
