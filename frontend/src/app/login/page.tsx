"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { GraduationCap, FlaskConical, Building2, Briefcase, ShieldAlert, Sparkles, Quote } from "lucide-react";

export default function LoginPage() {
  const { login, switchRoleQuick, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      {/* Top Brand Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#631024] via-[#801b33] to-[#430917] text-white font-black text-xl shadow-md border border-amber-400/40">
          SETU
        </div>
        <h1 className="text-2xl font-black text-[#4a0817] tracking-tight">SETU Portal Login</h1>
        <p className="text-xs text-slate-600 font-medium">Structural Education Transformation Union</p>
      </div>

      {/* PM Quote Pill */}
      <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-[#fdf2f4] via-white to-[#fdf2f4] p-3 shadow-xs text-center">
        <p className="text-xs italic font-serif text-[#631024] leading-relaxed">
          &ldquo;Education makes life self-reliant. It inspires man to live with dignity in the society.&rdquo;
        </p>
        <p className="text-[10px] font-bold text-amber-700 mt-1">
          — Shri Narendra Modi, Hon&apos;ble Prime Minister
        </p>
      </div>

      {/* Quick One-Click Demo Logins */}
      <div className="rounded-2xl border border-[#f8d2d9] bg-[#fdf2f4] p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#801b33]">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span>One-Click Demo Profiles (Preloaded Data)</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-normal font-medium">
          Click any role below to immediately log in with full pre-seeded assessments, courses, and opportunities:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="text-[11px] bg-white border-[#f8d2d9] text-[#801b33] hover:bg-[#fce7ea] justify-start font-bold"
            onClick={() => switchRoleQuick("STUDENT")}
          >
            <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-[#801b33]" /> Student
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[11px] bg-white border-[#f8d2d9] text-[#801b33] hover:bg-[#fce7ea] justify-start font-bold"
            onClick={() => switchRoleQuick("FACULTY")}
          >
            <FlaskConical className="h-3.5 w-3.5 mr-1.5 text-[#801b33]" /> Faculty
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[11px] bg-white border-[#f8d2d9] text-[#801b33] hover:bg-[#fce7ea] justify-start font-bold"
            onClick={() => switchRoleQuick("INDUSTRY_USER")}
          >
            <Briefcase className="h-3.5 w-3.5 mr-1.5 text-amber-600" /> Industry
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[11px] bg-white border-[#f8d2d9] text-[#801b33] hover:bg-[#fce7ea] justify-start font-bold"
            onClick={() => switchRoleQuick("INSTITUTION_ADMIN")}
          >
            <Building2 className="h-3.5 w-3.5 mr-1.5 text-emerald-700" /> Institution
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[11px] bg-white border-[#f8d2d9] text-[#801b33] hover:bg-[#fce7ea] justify-start font-bold"
            onClick={() => switchRoleQuick("PLATFORM_ADMIN")}
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1.5 text-red-600" /> Admin
          </Button>
        </div>
      </div>

      <Card className="border-[#f8d2d9] shadow-sm">
        <CardHeader>
          <CardTitle>Sign In with Credentials</CardTitle>
          <CardDescription>Enter registered email address and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {error}
              </div>
            )}
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. rahul.sharma@student.iitd.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="gov" className="w-full font-bold shadow-md" isLoading={isLoading}>
              Sign In to SETU Platform
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-[#801b33] hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
