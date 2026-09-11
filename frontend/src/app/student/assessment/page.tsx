"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Modal } from "@/components/ui";
import {
  CheckSquare,
  Clock,
  Award,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Code,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Brain,
  TrendingUp,
  BookOpen
} from "lucide-react";

export default function AssessmentPageWrapper() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading assessment engine...</div>}>
      <AssessmentPage />
    </Suspense>
  );
}

function AssessmentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoStart = searchParams.get("auto") === "true" || searchParams.get("onboarding") === "true";

  const [assessments, setAssessments] = useState<any[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected_option_ids: string[]; code_submission?: string }>>({});
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins for 5 questions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAssessments() {
      try {
        const data = await api.get("/assessments");
        setAssessments(data || []);

        // Auto-start if redirected from registration or dashboard prompt
        if (autoStart && data && data.length > 0) {
          handleStartAttempt(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAssessments();
  }, [autoStart]);

  // Timer countdown
  useEffect(() => {
    if (!activeAttempt || result) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeAttempt, result]);

  const handleStartAttempt = async (assessmentId: string) => {
    try {
      const data = await api.post(`/assessments/${assessmentId}/attempts`);
      setActiveAttempt(data);
      setCurrentQIndex(0);
      setAnswers({});
      setTimeLeft(15 * 60); // 15 minutes for 5 questions
      setResult(null);
    } catch (err: any) {
      alert(err.message || "Failed to start assessment");
    }
  };

  const handleOptionToggle = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      return {
        ...prev,
        [questionId]: {
          selected_option_ids: [optionId], // Single select MCQ
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!activeAttempt || isSubmitting) return;
    setIsSubmitting(true);
    setIsAnalyzingAI(true);

    try {
      const formattedResponses = (activeAttempt.questions || []).map((q: any) => {
        const ans = answers[q.id] || { selected_option_ids: [] };
        return {
          question_id: q.id,
          selected_option_ids: ans.selected_option_ids || [],
          code_submission: ans.code_submission || null,
          time_taken_seconds: 30,
        };
      });

      // Artificial small delay to visually convey AI model evaluation steps
      await new Promise((res) => setTimeout(res, 1200));

      const res = await api.post(`/assessments/attempts/${activeAttempt.attempt_id}/submit`, {
        responses: formattedResponses,
      });
      setResult(res);
      setActiveAttempt(null);
    } catch (err: any) {
      alert(err.message || "Failed to submit assessment");
    } finally {
      setIsSubmitting(false);
      setIsAnalyzingAI(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading SETU assessment system...</div>;
  }

  // --- AI ANALYZING SPINNER VIEW ---
  if (isAnalyzingAI) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6 animate-in fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#631024] to-[#801b33] text-amber-300 shadow-xl border border-amber-300/40 animate-pulse">
          <Brain className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#4a0817]">SETU Grounded AI Engine Analyzing Responses...</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Evaluating syntax, deterministic correctness, technical competencies, and mapping scores to industry benchmarks.
          </p>
        </div>
        <div className="flex justify-center items-center gap-2 text-xs font-bold text-[#801b33]">
          <span className="h-2 w-2 rounded-full bg-[#801b33] animate-ping" />
          Generating Competency Radar & Career Diagnosis...
        </div>
      </div>
    );
  }

  // --- RESULT VIEW: AI EVALUATION & COMPETENCY REPORT ---
  if (result) {
    const passed = result.score_percentage >= 60;
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-4 animate-in fade-in">
        {/* Top Score Banner */}
        <div className="rounded-3xl border-2 border-amber-300/60 bg-gradient-to-r from-[#4a0817] via-[#631024] to-[#801b33] p-6 sm:p-8 text-white shadow-xl text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#801b33] shadow-md border-2 border-amber-400">
            <Award className="h-9 w-9 text-amber-600" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-extrabold text-amber-200 border border-amber-400/40">
              <Sparkles className="h-3 w-3 text-amber-300" /> AI Competency Assessment Complete
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Diagnostic Evaluation Score: {result.score_percentage}%
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto">
              Your answers have been analyzed by the deterministic scoring model. Your technical profile, competency radar, and verified skill badges are now updated.
            </p>
          </div>

          <div className="inline-flex items-center gap-6 py-2.5 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
            <div>
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-300">Total Points</p>
              <p className="text-2xl font-black text-white">
                {result.total_score} / {result.max_possible_score}
              </p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-300">Readiness Score</p>
              <p className="text-2xl font-black text-amber-300">
                {result.score_percentage}%
              </p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-300">Status</p>
              <p className="text-sm font-extrabold text-white mt-1">
                {passed ? "QUALIFIED" : "NEEDS UPSKILLING"}
              </p>
            </div>
          </div>
        </div>

        {/* 5-Skill Competency Breakdown */}
        <Card className="border-[#f8d2d9] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-[#4a0817]">Technical Competencies Evaluated (5 Core Domains)</CardTitle>
            <CardDescription>Individual skill readiness scores calculated by the assessment engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-0">
            {Object.entries(result.skill_breakdown || {}).map(([skill, score]: any) => (
              <div key={skill} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{skill}</span>
                  <span className={score >= 70 ? "text-emerald-700 font-extrabold" : "text-amber-700 font-extrabold"}>
                    {score.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      score >= 70 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-gradient-to-r from-amber-500 to-amber-600"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Grounded Career & Competency Diagnosis */}
        {result.ai_feedback && (
          <Card className="border-[#f8d2d9] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[#4a0817]">
                <Brain className="h-5 w-5 text-[#801b33]" /> AI Grounded Competency Diagnosis
              </CardTitle>
              <CardDescription>
                Automated career alignment and strengths-weaknesses synthesis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed pt-0">
              <div className="rounded-xl bg-[#fdf2f4] border border-[#f8d2d9] p-4 text-slate-800 font-medium">
                <span className="font-extrabold text-[#801b33] block mb-1">Career Alignment Summary:</span>
                {result.ai_feedback.career_summary}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-1.5">
                  <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Demonstrated Strengths
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {(result.ai_feedback.strengths || ["Core Programming"]).map((s: string, idx: number) => (
                      <li key={idx}><strong className="text-slate-900">{s}</strong></li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-1.5">
                  <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Focus Areas for Upskilling
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {(result.ai_feedback.weaknesses && result.ai_feedback.weaknesses.length > 0
                      ? result.ai_feedback.weaknesses
                      : ["Containerization & Microservice Scalability"]
                    ).map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button variant="outline" onClick={() => setResult(null)} className="w-full sm:w-auto">
            View Assessment Catalog
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/student/competency" className="w-full sm:w-auto">
              <Button variant="gov" className="w-full sm:w-auto font-bold shadow-md">
                <TrendingUp className="h-4 w-4 mr-1.5" /> View My Competency Radar
              </Button>
            </Link>
            <Link href="/student/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto font-bold shadow-md">
                Go to Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE 5-QUESTION QUIZ RUNNER ---
  if (activeAttempt) {
    const questions = activeAttempt.questions || [];
    const currentQ = questions[currentQIndex];
    const currentAns = answers[currentQ?.id] || { selected_option_ids: [] };
    const isLastQuestion = currentQIndex === questions.length - 1;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
        {/* Test Header */}
        <div className="rounded-2xl border border-[#f8d2d9] bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="gov">SETU Skill Assessment</Badge>
              <span className="text-xs font-bold text-slate-700">
                Question {currentQIndex + 1} of {questions.length}
              </span>
            </div>
            <h2 className="font-extrabold text-sm text-slate-900 mt-1">
              {activeAttempt.assessment.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-[#4a0817] px-3.5 py-1.5 text-white text-xs font-mono font-bold shadow-inner">
            <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <Card className="border-[#f8d2d9] shadow-sm">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-amber-400/60 bg-amber-50 text-amber-900 font-bold">
                    Domain: {currentQ.skill_name || "Technical Competency"}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500">Points: {currentQ.points || 10}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-relaxed">
                  {currentQ.question_text}
                </h3>

                {currentQ.code_snippet && (
                  <pre className="rounded-xl bg-slate-950 p-4 text-xs font-mono text-emerald-400 overflow-x-auto shadow-inner">
                    <code>{currentQ.code_snippet}</code>
                  </pre>
                )}
              </div>

              {/* Multiple Choice Options */}
              {currentQ.options && currentQ.options.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt: any) => {
                    const isSelected = currentAns.selected_option_ids?.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleOptionToggle(currentQ.id, opt.id)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-xs font-medium transition ${
                          isSelected
                            ? "border-[#801b33] bg-[#fdf2f4] text-[#801b33] ring-1 ring-[#801b33] font-bold"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            isSelected ? "border-[#801b33] bg-[#801b33] text-white" : "border-slate-400"
                          }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="leading-relaxed">{opt.option_text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                >
                  Previous Question
                </Button>

                <div className="flex items-center gap-2">
                  {!isLastQuestion ? (
                    <Button
                      variant="gov"
                      size="sm"
                      onClick={() => setCurrentQIndex((i) => Math.min(questions.length - 1, i + 1))}
                    >
                      Next Question <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md"
                      onClick={handleSubmit}
                      isLoading={isSubmitting}
                    >
                      <Brain className="h-4 w-4 mr-1.5" /> Submit for AI Competency Analysis
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5-Question Stepper Palette */}
        <div className="flex justify-center gap-2">
          {questions.map((q: any, idx: number) => {
            const hasAns = (answers[q.id]?.selected_option_ids?.length || 0) > 0;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQIndex(idx)}
                className={`h-9 w-9 rounded-xl text-xs font-black transition ${
                  currentQIndex === idx
                    ? "bg-[#801b33] text-white ring-2 ring-amber-400 shadow-sm"
                    : hasAns
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- CATALOG LIST VIEW (If no attempt active) ---
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-[#4a0817] tracking-tight">SETU Skill Assessments</h1>
        <p className="text-xs text-slate-500">
          Standardized competency benchmarks evaluated by deterministic AI scoring algorithms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((a: any) => (
          <Card key={a.id} className="hover:border-[#801b33] hover:shadow-md transition border-[#f8d2d9]">
            <CardContent className="pt-6 space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-2">
                <Badge variant="gov">{a.category}</Badge>
                <h3 className="font-extrabold text-base text-slate-900 leading-snug">{a.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> {a.duration_minutes} Mins
                  </span>
                  <span><strong>{a.total_questions || 5} Questions</strong></span>
                  <span className="font-bold text-emerald-700">{a.passing_percentage}% Passing</span>
                </div>

                <Button
                  variant="gov"
                  className="w-full font-bold shadow-sm"
                  onClick={() => handleStartAttempt(a.id)}
                >
                  <CheckSquare className="h-4 w-4 mr-1.5" /> Start 5-Question Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
