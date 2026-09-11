"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Modal } from "@/components/ui";
import { BookOpen, Clock, Award, ExternalLink, CheckCircle, PlayCircle, FileText, Check } from "lucide-react";

export default function StudentLearningPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [externalResources, setExternalResources] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "external">("courses");
  const [isLoading, setIsLoading] = useState(true);

  const loadCourses = async () => {
    try {
      const [coursesData, enrollmentsData, extData] = await Promise.all([
        api.get("/courses"),
        api.get("/courses/my/enrollments"),
        api.get("/courses/external/resources"),
      ]);
      setCourses(coursesData || []);
      setMyEnrollments(enrollmentsData || []);
      setExternalResources(extData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      loadCourses();
      if (selectedCourse && selectedCourse.id === courseId) {
        // Refresh open modal
        const details = await api.get(`/courses/${courseId}`);
        setSelectedCourse(details);
      }
    } catch (e: any) {
      alert(e.message || "Failed to enroll");
    }
  };

  const handleViewCourse = async (courseId: string) => {
    try {
      const details = await api.get(`/courses/${courseId}`);
      setSelectedCourse(details);
    } catch (e) {
      console.error(e);
    }
  };

  const enrolledCourseIds = new Set(myEnrollments.map((e) => e.course_id));

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading learning modules...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Learning & Course Catalog</h1>
          <p className="text-xs text-slate-500">Accredited institutional coursework and government certified MOOCs</p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1">
          <button
            onClick={() => setActiveTab("courses")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "courses" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Institution Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab("external")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "external" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            NPTEL / SWAYAM ({externalResources.length})
          </button>
        </div>
      </div>

      {/* Courses Tab */}
      {activeTab === "courses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => {
            const isEnrolled = enrolledCourseIds.has(c.id);
            return (
              <Card key={c.id} className="hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="gov">{c.category}</Badge>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {c.duration_weeks} Weeks • {c.difficulty}
                    </span>
                  </div>
                  <CardTitle className="text-base leading-snug">{c.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">{c.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="flex flex-wrap gap-1">
                    {(c.skills_json || []).map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400">
                      Offered by: <strong className="text-slate-700">{c.organization_name}</strong>
                    </p>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewCourse(c.id)}>
                        Curriculum
                      </Button>
                      {isEnrolled ? (
                        <Badge variant="verified">
                          <Check className="h-3 w-3 mr-1" /> Enrolled
                        </Badge>
                      ) : (
                        <Button variant="primary" size="sm" onClick={() => handleEnroll(c.id)}>
                          Enroll
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* External Resources Tab */}
      {activeTab === "external" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {externalResources.map((res) => (
            <Card key={res.id} className="hover:border-blue-300 transition">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="gov">{res.provider}</Badge>
                  <span className="text-xs font-semibold text-slate-500">{res.skill}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{res.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{res.description}</p>
                <div className="pt-2">
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open on {res.provider} Portal <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Course Modules Modal */}
      {selectedCourse && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCourse(null)}
          title={selectedCourse.title}
          description={`Offered by ${selectedCourse.organization_name} • Instructor: ${selectedCourse.faculty_name}`}
          maxWidth="xl"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-700 leading-relaxed">{selectedCourse.description}</p>

            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Course Syllabus & Modules ({selectedCourse.modules?.length || 0})
              </h4>

              {(selectedCourse.modules || []).map((m: any) => (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                      {m.module_order}
                    </span>
                    <h5 className="font-bold text-xs text-slate-900">{m.title}</h5>
                  </div>
                  {m.description && <p className="text-xs text-slate-500 pl-7">{m.description}</p>}

                  {/* Resources */}
                  {(m.resources || []).length > 0 && (
                    <div className="pl-7 space-y-1.5 pt-1">
                      {m.resources.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                          <span className="flex items-center gap-2">
                            {r.resource_type === "VIDEO" ? (
                              <PlayCircle className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 text-emerald-500" />
                            )}
                            <span className="font-medium text-slate-800">{r.title}</span>
                          </span>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            Access Resource →
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              {enrolledCourseIds.has(selectedCourse.id) ? (
                <Badge variant="verified">Enrolled</Badge>
              ) : (
                <Button variant="primary" size="sm" onClick={() => handleEnroll(selectedCourse.id)}>
                  Enroll in Course
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
