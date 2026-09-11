"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import {
  GraduationCap,
  Building2,
  Briefcase,
  FlaskConical,
  Sparkles,
  ArrowRight,
  Shield,
  TrendingUp,
  Award,
  Quote,
  CheckCircle2,
  Compass
} from "lucide-react";

export default function HomePage() {
  const { user, switchRoleQuick } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const routes: Record<string, string> = {
        STUDENT: "/student/dashboard",
        FACULTY: "/faculty/dashboard",
        INSTITUTION_ADMIN: "/institution/dashboard",
        INDUSTRY_USER: "/industry/dashboard",
        PLATFORM_ADMIN: "/admin/dashboard",
      };
      router.push(routes[user.role] || "/student/dashboard");
    }
  }, [user, router]);

  return (
    <div className="space-y-12 py-4">
      {/* Prime Minister Dignitary & National Quote Banner (Govt Ministry Style) */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-amber-300/70 bg-gradient-to-r from-[#4a0817] via-[#631024] to-[#801b33] p-6 sm:p-8 text-white shadow-xl">
        {/* Subtle Decorative Background Circles */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-maroon-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 justify-between">
          {/* Left: Quote & National Vision */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold text-amber-200 border border-amber-300/30">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              GOVERNMENT OF INDIA • NATIONAL EDUCATION VISION
            </div>

            <div className="relative pl-6 border-l-4 border-amber-400">
              <Quote className="absolute -top-3 -left-3 h-6 w-6 text-amber-400/40" />
              <blockquote className="text-lg sm:text-2xl font-serif italic text-amber-50 leading-snug tracking-wide">
                &ldquo;Education makes life self-reliant. It inspires man to live with dignity in the society.&rdquo;
              </blockquote>
            </div>

            <div className="pt-1">
              <p className="text-sm font-extrabold text-amber-300 tracking-wide">
                Shri Narendra Modi
              </p>
              <p className="text-xs text-slate-300 font-medium">
                Hon&apos;ble Prime Minister of India
              </p>
            </div>
          </div>

          {/* Right: Official Prime Minister Portrait Frame */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="relative p-1.5 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 shadow-2xl">
              <div className="relative h-44 w-36 sm:h-52 sm:w-44 overflow-hidden rounded-xl bg-slate-900">
                <img
                  src="/images/pm-modi.jpg"
                  alt="Hon'ble Prime Minister Shri Narendra Modi"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#3d0816] px-3 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/60 shadow-md">
                Prime Minister of India
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Hero Section: SETU Platform */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-[#fdf2f4] border border-[#f8d2d9] p-8 sm:p-12 shadow-sm text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fce7ea] px-4 py-1.5 text-xs font-extrabold text-[#801b33] border border-[#f8d2d9]">
            <Sparkles className="h-4 w-4 text-amber-600" />
            NATIONAL DIGITAL KNOWLEDGE & SKILLS INFRASTRUCTURE
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#4a0817]">
              SETU
            </h1>
            <p className="text-lg sm:text-2xl font-extrabold text-[#801b33] tracking-wide">
              Structural Education Transformation Union
            </p>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-amber-700">
              Bridging Students ↔ Faculty ↔ Institutions ↔ Industry ↔ Research
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            A unified national platform empowering the next generation of Indian innovators. Grounded in deterministic competency assessment, real-time curriculum skill-gap analysis, explainable industry recruitment matching, and inter-institutional research synergy.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-[#631024] to-[#801b33] hover:from-[#520f20] hover:to-[#6b1a2e] text-white font-extrabold shadow-md px-6">
                Explore Demo Portals <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="border-[#801b33] text-[#801b33] hover:bg-[#fce7ea] font-bold">
                Register as Student / Institution / Industry
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Pillars of SETU */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <Badge variant="gov">The Four Pillars of SETU</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4a0817]">
            Interconnected National Ecosystem
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Every interaction validates real database credentials, evaluates AI models, and synchronizes cross-ecosystem pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Student */}
          <Card className="hover:border-[#801b33] hover:shadow-lg transition bg-white border-[#f8d2d9]">
            <CardContent className="pt-6 space-y-4">
              <div className="h-11 w-11 rounded-xl bg-[#fce7ea] text-[#801b33] flex items-center justify-center font-bold">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Students</h3>
                <p className="text-xs text-slate-500 font-medium">Competency & Placements</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take standardized skill assessments, generate multi-axis AI competency radar analytics, identify critical gaps, and apply to matched internships.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold border-[#801b33]/30 text-[#801b33] hover:bg-[#fdf2f4]"
                onClick={() => switchRoleQuick("STUDENT")}
              >
                Login as Student
              </Button>
            </CardContent>
          </Card>

          {/* Faculty */}
          <Card className="hover:border-[#801b33] hover:shadow-lg transition bg-white border-[#f8d2d9]">
            <CardContent className="pt-6 space-y-4">
              <div className="h-11 w-11 rounded-xl bg-[#fce7ea] text-[#801b33] flex items-center justify-center font-bold">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Faculty & Researchers</h3>
                <p className="text-xs text-slate-500 font-medium">Curricula & Discovery</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Publish accredited courses with modules, author research metadata, discover AI-recommended collaborators across IITs/NITs, and bookmark SERB/DST grants.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold border-[#801b33]/30 text-[#801b33] hover:bg-[#fdf2f4]"
                onClick={() => switchRoleQuick("FACULTY")}
              >
                Login as Faculty
              </Button>
            </CardContent>
          </Card>

          {/* Institution */}
          <Card className="hover:border-[#801b33] hover:shadow-lg transition bg-white border-[#f8d2d9]">
            <CardContent className="pt-6 space-y-4">
              <div className="h-11 w-11 rounded-xl bg-[#fce7ea] text-[#801b33] flex items-center justify-center font-bold">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Institutions & Deans</h3>
                <p className="text-xs text-slate-500 font-medium">Macro Analytics</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitor student competency analytics across departments, identify curriculum-wide skill deficits, and manage academic faculty rosters.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold border-[#801b33]/30 text-[#801b33] hover:bg-[#fdf2f4]"
                onClick={() => switchRoleQuick("INSTITUTION_ADMIN")}
              >
                Login as Institution
              </Button>
            </CardContent>
          </Card>

          {/* Industry */}
          <Card className="hover:border-[#801b33] hover:shadow-lg transition bg-white border-[#f8d2d9]">
            <CardContent className="pt-6 space-y-4">
              <div className="h-11 w-11 rounded-xl bg-[#fce7ea] text-[#801b33] flex items-center justify-center font-bold">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Industry Partners</h3>
                <p className="text-xs text-slate-500 font-medium">Talent & Workshops</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Post jobs using natural language with AI requirement extraction, explore weighted candidate matches, and review evidence explanations.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold border-[#801b33]/30 text-[#801b33] hover:bg-[#fdf2f4]"
                onClick={() => switchRoleQuick("INDUSTRY_USER")}
              >
                Login as Industry
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="rounded-3xl border border-[#f8d2d9] bg-gradient-to-b from-white to-[#fdf2f4] p-8 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#fce7ea] text-[#801b33] flex items-center justify-center font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900">Verified Organizations</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multi-tier verification workflow prevents fraudulent hiring drives and unaccredited entities. Only vetted organizations can interact with student cohorts.
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900">Deterministic Scoring</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scores are never hallucinated by LLMs. Real assessment answers are evaluated against deterministic scoring keys with transparent mathematical weights.
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Award className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900">Explainable AI Matching</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recruiters see exact candidate match percentage breakdowns: verified technical competency, CGPA cutoff, project relevance, and identified skill gaps.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
