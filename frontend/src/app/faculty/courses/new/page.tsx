"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { BookOpen, Plus, Trash2, Video, FileText, CheckCircle2 } from "lucide-react";

interface ModuleResource {
  title: string;
  resource_type: "VIDEO" | "PDF" | "ARTICLE" | "ASSIGNMENT";
  url: string;
}

interface CourseModuleItem {
  title: string;
  description: string;
  resources: ModuleResource[];
}

export default function CreateCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("High-Performance Backend Engineering with Python");
  const [description, setDescription] = useState(
    "A deep-dive course covering async programming, SQLAlchemy query tuning, rate limiting, and microservice containerization."
  );
  const [category, setCategory] = useState("Computer Science");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [duration, setDuration] = useState(8);
  const [skillsStr, setSkillsStr] = useState("Python, FastAPI, SQL, Docker, Git");
  const [prerequisites, setPrerequisites] = useState("Basic Python and relational database understanding.");
  const [modules, setModules] = useState<CourseModuleItem[]>([
    {
      title: "Module 1: Async Concurrency & Event Loops",
      description: "Coroutines, asyncio task groups, and event loop internals",
      resources: [
        { title: "Event Loop Architecture Slides", resource_type: "PDF", url: "https://iitd.ac.in/resources/event-loop.pdf" },
      ],
    },
    {
      title: "Module 2: Database Query Tuning & Connection Pools",
      description: "SQLAlchemy 2.0 ORM optimization, bulk inserts, and transaction scopes",
      resources: [
        { title: "Query Benchmarking Video Lecture", resource_type: "VIDEO", url: "https://youtube.com/watch?v=demo_lecture" },
      ],
    },
  ]);
  const [isPublishing, setIsPublishing] = useState(false);

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      {
        title: `Module ${prev.length + 1}: New Curriculum Topic`,
        description: "Module overview and objectives",
        resources: [],
      },
    ]);
  };

  const removeModule = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  const addResourceToModule = (moduleIndex: number) => {
    setModules((prev) => {
      const copy = [...prev];
      copy[moduleIndex].resources.push({
        title: "Lecture Material",
        resource_type: "PDF",
        url: "https://iitd.ac.in/materials/sample.pdf",
      });
      return copy;
    });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      const skills = skillsStr.split(",").map((s) => s.trim()).filter(Boolean);

      const formattedModules = modules.map((m, idx) => ({
        module_order: idx + 1,
        title: m.title,
        description: m.description,
        resources: m.resources.map((r) => ({
          title: r.title,
          resource_type: r.resource_type,
          url: r.url,
        })),
      }));

      await api.post("/courses", {
        title,
        description,
        category,
        difficulty,
        duration_weeks: Number(duration),
        skills_json: skills,
        prerequisites,
        status: "PUBLISHED",
        modules: formattedModules,
      });

      router.push("/student/learning");
    } catch (e: any) {
      alert(e.message || "Failed to publish course");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create & Publish Course</h1>
        <p className="text-xs text-slate-500">
          Design accredited modules, attach resources, and publish to the student learning portal
        </p>
      </div>

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Core Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>Basic description and taxonomy classification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description & Syllabus Summary</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Academic Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="EASY">Beginner / Easy</option>
                  <option value="MEDIUM">Intermediate / Medium</option>
                  <option value="HARD">Advanced / Hard</option>
                </select>
              </div>
              <Input
                label="Duration (Weeks)"
                type="number"
                min="1"
                max="24"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Skills Taught (Comma separated)"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="Python, FastAPI, SQL, Docker"
                required
              />
              <Input
                label="Course Prerequisites"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modules & Resources Builder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Course Modules & Learning Resources</CardTitle>
              <CardDescription>Add sequential learning modules, videos, and reading materials</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addModule}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Module
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {modules.map((m, mIdx) => (
              <div key={mIdx} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Input
                      label={`Module ${mIdx + 1} Title`}
                      value={m.title}
                      onChange={(e) => {
                        const copy = [...modules];
                        copy[mIdx].title = e.target.value;
                        setModules(copy);
                      }}
                      required
                    />
                  </div>
                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModule(mIdx)}
                      className="text-slate-400 hover:text-red-600 transition pt-5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Input
                  placeholder="Module description / learning objectives"
                  value={m.description}
                  onChange={(e) => {
                    const copy = [...modules];
                    copy[mIdx].description = e.target.value;
                    setModules(copy);
                  }}
                />

                {/* Module Resources */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Resources ({m.resources.length})</span>
                    <button
                      type="button"
                      onClick={() => addResourceToModule(mIdx)}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Resource
                    </button>
                  </div>

                  {m.resources.map((r, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input
                        placeholder="Resource Title"
                        value={r.title}
                        onChange={(e) => {
                          const copy = [...modules];
                          copy[mIdx].resources[rIdx].title = e.target.value;
                          setModules(copy);
                        }}
                        className="text-xs border border-slate-200 rounded px-2 py-1"
                      />
                      <select
                        value={r.resource_type}
                        onChange={(e) => {
                          const copy = [...modules];
                          copy[mIdx].resources[rIdx].resource_type = e.target.value as any;
                          setModules(copy);
                        }}
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="PDF">PDF Document</option>
                        <option value="VIDEO">Video Lecture</option>
                        <option value="ASSIGNMENT">Assignment Lab</option>
                        <option value="ARTICLE">Reading Article</option>
                      </select>
                      <input
                        placeholder="URL link"
                        value={r.url}
                        onChange={(e) => {
                          const copy = [...modules];
                          copy[mIdx].resources[rIdx].url = e.target.value;
                          setModules(copy);
                        }}
                        className="text-xs border border-slate-200 rounded px-2 py-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="gov" isLoading={isPublishing}>
            Publish Course to Ecosystem
          </Button>
        </div>
      </form>
    </div>
  );
}
