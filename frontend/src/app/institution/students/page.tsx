"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { Users, Search, GraduationCap } from "lucide-react";

export default function InstitutionStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await api.get("/institutions/students");
        setStudents(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStudents();
  }, []);

  const filtered = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.target_career?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading student roster...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Student Roster</h1>
          <p className="text-xs text-slate-500">
            Student cohort directory with verified CGPA, department enrollment, and benchmarked competencies
          </p>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search students, departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs shadow-xs focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Department & Sem</th>
                  <th className="py-3.5 px-4">CGPA</th>
                  <th className="py-3.5 px-4">Avg. Competency</th>
                  <th className="py-3.5 px-4">Target Career</th>
                  <th className="py-3.5 px-4 text-right">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.full_name}</div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{s.department}</div>
                      <div className="text-[11px] text-slate-400">Semester {s.semester}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {s.cgpa?.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-blue-700">{s.average_competency}%</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline">{s.target_career}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                      {s.applications_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
