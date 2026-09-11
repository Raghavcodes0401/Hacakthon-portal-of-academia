"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input } from "@/components/ui";
import {
  Database,
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  Search,
  Download,
  ShieldCheck,
  Server,
  Code2,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function AdminDatabasePage() {
  const [data, setData] = useState<{
    students: any[];
    faculty: any[];
    institutions: any[];
    companies: any[];
    users: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "faculty" | "institutions" | "companies" | "users" | "config">("students");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadDatabaseOverview() {
      try {
        setIsLoading(true);
        const res = await api.get("/admin/database/overview");
        setData(res);
      } catch (err: any) {
        console.error(err);
        setError("Failed to fetch database tables. Ensure you are logged in as Platform Admin.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDatabaseOverview();
  }, []);

  // Filter logic based on active tab and searchTerm
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter((s) =>
      `${s.full_name} ${s.email} ${s.institution} ${s.department} ${s.degree} ${s.target_career}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const filteredFaculty = useMemo(() => {
    if (!data?.faculty) return [];
    return data.faculty.filter((f) =>
      `${f.full_name} ${f.email} ${f.institution} ${f.department} ${f.designation}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const filteredInstitutions = useMemo(() => {
    if (!data?.institutions) return [];
    return data.institutions.filter((i) =>
      `${i.name} ${i.location} ${i.verification_status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const filteredCompanies = useMemo(() => {
    if (!data?.companies) return [];
    return data.companies.filter((c) =>
      `${c.name} ${c.location} ${c.verification_status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    return data.users.filter((u) =>
      `${u.full_name} ${u.email} ${u.role} ${u.organization_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const exportCurrentTableToCSV = () => {
    let exportData: any[] = [];
    let filename = `setu-${activeTab}-table.csv`;

    if (activeTab === "students") exportData = filteredStudents;
    else if (activeTab === "faculty") exportData = filteredFaculty;
    else if (activeTab === "institutions") exportData = filteredInstitutions;
    else if (activeTab === "companies") exportData = filteredCompanies;
    else if (activeTab === "users") exportData = filteredUsers;

    if (!exportData.length) return;

    const headers = Object.keys(exportData[0]).join(",");
    const rows = exportData.map((obj) =>
      Object.values(obj)
        .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4a0817] via-[#631024] to-[#801b33] p-6 text-white shadow-md border border-amber-300/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
              <Database className="h-3.5 w-3.5" /> Database Master Explorer
            </span>
            <span className="text-xs text-amber-200/80 font-medium">SQL / ORM Active Warehouse</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Ecosystem Relational Tables</h1>
          <p className="text-xs text-slate-200">
            Real-time inspection of all Students, Faculty, Higher-Ed Institutions, Corporate Partners, and User Logins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCurrentTableToCSV}
            disabled={activeTab === "config" || isLoading}
            className="text-white border-white/30 hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-1.5" /> Export {activeTab.toUpperCase()} CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab("students")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeTab === "students"
              ? "border-[#801b33] bg-[#fdf2f4] shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Students</p>
            <GraduationCap className={`h-4 w-4 ${activeTab === "students" ? "text-[#801b33]" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{data?.students?.length ?? "..."}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Assessed candidates</p>
        </div>

        <div
          onClick={() => setActiveTab("faculty")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeTab === "faculty"
              ? "border-[#801b33] bg-[#fdf2f4] shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Faculty</p>
            <Users className={`h-4 w-4 ${activeTab === "faculty" ? "text-[#801b33]" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{data?.faculty?.length ?? "..."}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Professors & Mentors</p>
        </div>

        <div
          onClick={() => setActiveTab("institutions")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeTab === "institutions"
              ? "border-[#801b33] bg-[#fdf2f4] shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Institutions</p>
            <Building2 className={`h-4 w-4 ${activeTab === "institutions" ? "text-[#801b33]" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{data?.institutions?.length ?? "..."}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Universities & IITs</p>
        </div>

        <div
          onClick={() => setActiveTab("companies")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeTab === "companies"
              ? "border-[#801b33] bg-[#fdf2f4] shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Companies</p>
            <Briefcase className={`h-4 w-4 ${activeTab === "companies" ? "text-[#801b33]" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{data?.companies?.length ?? "..."}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Industry Partners</p>
        </div>

        <div
          onClick={() => setActiveTab("users")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            activeTab === "users"
              ? "border-[#801b33] bg-[#fdf2f4] shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">All Logins</p>
            <ShieldCheck className={`h-4 w-4 ${activeTab === "users" ? "text-[#801b33]" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{data?.users?.length ?? "..."}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total User Accounts</p>
        </div>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("students")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "students"
                ? "bg-[#801b33] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Students Table ({data?.students?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("faculty")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "faculty"
                ? "bg-[#801b33] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Faculty Table ({data?.faculty?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("institutions")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "institutions"
                ? "bg-[#801b33] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Institutions ({data?.institutions?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "companies"
                ? "bg-[#801b33] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Companies ({data?.companies?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "users"
                ? "bg-[#801b33] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Logins ({data?.users?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "config"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Server className="h-3.5 w-3.5 text-amber-400" /> DB Config (PG / Mongo / MySQL)
          </button>
        </div>

        {activeTab !== "config" && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={`Search in ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Database className="h-8 w-8 text-[#801b33] animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Fetching database records...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-xs flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <div>{error}</div>
        </div>
      ) : (
        <>
          {/* 1. STUDENTS TABLE */}
          {activeTab === "students" && (
            <Card className="overflow-hidden border-slate-200 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#fdf2f4] text-[#4a0817] font-bold border-b border-[#f3d3da]">
                    <tr>
                      <th className="py-3 px-4">Student Name & Email</th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-4">Degree & Dept</th>
                      <th className="py-3 px-4">Sem / CGPA</th>
                      <th className="py-3 px-4">Target Career</th>
                      <th className="py-3 px-4 text-center">Assessed Score</th>
                      <th className="py-3 px-4">User ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No student records matched your search.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div>{s.full_name}</div>
                            <div className="text-[11px] font-normal text-slate-500">{s.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{s.institution}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800">{s.degree}</span>
                            <span className="block text-[11px] text-slate-500">{s.department}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="font-medium">Sem {s.semester}</span>
                            <span className="block text-[11px] font-bold text-emerald-700">CGPA: {s.cgpa}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="font-medium text-slate-700">
                              {s.target_career || "General Engineering"}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                s.average_competency >= 75
                                  ? "bg-emerald-100 text-emerald-800"
                                  : s.average_competency > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {s.average_competency > 0 ? `${s.average_competency}%` : "Pending Test"}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {s.assessed_competencies_count} metrics
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[11px] font-mono text-slate-400 truncate max-w-[120px]" title={s.user_id}>
                            {s.user_id}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 2. FACULTY TABLE */}
          {activeTab === "faculty" && (
            <Card className="overflow-hidden border-slate-200 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#fdf2f4] text-[#4a0817] font-bold border-b border-[#f3d3da]">
                    <tr>
                      <th className="py-3 px-4">Faculty Name & Email</th>
                      <th className="py-3 px-4">Institution</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Research Interests</th>
                      <th className="py-3 px-4">ORCID iD</th>
                      <th className="py-3 px-4">User ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredFaculty.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No faculty records matched your search.
                        </td>
                      </tr>
                    ) : (
                      filteredFaculty.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div>{f.full_name}</div>
                            <div className="text-[11px] font-normal text-slate-500">{f.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{f.institution}</td>
                          <td className="py-3.5 px-4 text-slate-700">{f.department}</td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="font-semibold text-slate-800">
                              {f.designation}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-[240px] truncate" title={f.research_interests}>
                            {f.research_interests || "Not specified"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-blue-600">
                            {f.orcid_id || "N/A"}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] font-mono text-slate-400 truncate max-w-[120px]" title={f.user_id}>
                            {f.user_id}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 3. INSTITUTIONS TABLE */}
          {activeTab === "institutions" && (
            <Card className="overflow-hidden border-slate-200 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#fdf2f4] text-[#4a0817] font-bold border-b border-[#f3d3da]">
                    <tr>
                      <th className="py-3 px-4">Institution Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Website</th>
                      <th className="py-3 px-4 text-center">Enrolled Students</th>
                      <th className="py-3 px-4 text-center">Faculty Count</th>
                      <th className="py-3 px-4">Institution ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredInstitutions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No institution records matched your search.
                        </td>
                      </tr>
                    ) : (
                      filteredInstitutions.map((i) => (
                        <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{i.name}</td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={i.verification_status === "VERIFIED" ? "success" : "warning"}
                              className="font-bold"
                            >
                              {i.verification_status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{i.location || "India"}</td>
                          <td className="py-3.5 px-4 text-blue-600 truncate max-w-[180px]">
                            {i.website ? (
                              <a href={i.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                {i.website} <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">{i.students_count}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">{i.faculty_count}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[120px]" title={i.id}>
                            {i.id}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 4. COMPANIES TABLE */}
          {activeTab === "companies" && (
            <Card className="overflow-hidden border-slate-200 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#fdf2f4] text-[#4a0817] font-bold border-b border-[#f3d3da]">
                    <tr>
                      <th className="py-3 px-4">Company Name</th>
                      <th className="py-3 px-4">Accreditation Status</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Website</th>
                      <th className="py-3 px-4 text-center">Jobs / Internships</th>
                      <th className="py-3 px-4 text-center">Recruiters</th>
                      <th className="py-3 px-4">Org ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No corporate partner records matched your search.
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={c.verification_status === "VERIFIED" ? "success" : "warning"}
                              className="font-bold"
                            >
                              {c.verification_status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{c.location || "India"}</td>
                          <td className="py-3.5 px-4 text-blue-600 truncate max-w-[180px]">
                            {c.website ? (
                              <a href={c.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                {c.website} <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                              {c.opportunities_posted} active
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">{c.recruiters_count}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[120px]" title={c.id}>
                            {c.id}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 5. ALL LOGINS & USER ACCOUNTS */}
          {activeTab === "users" && (
            <Card className="overflow-hidden border-slate-200 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#fdf2f4] text-[#4a0817] font-bold border-b border-[#f3d3da]">
                    <tr>
                      <th className="py-3 px-4">User Name & Email</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Login Status</th>
                      <th className="py-3 px-4">Last Audit Event</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4">System UUID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No login credentials matched your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div>{u.full_name}</div>
                            <div className="text-[11px] font-normal text-slate-500">{u.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">{u.organization_name}</td>
                          <td className="py-3.5 px-4">
                            <Badge variant={u.is_active ? "success" : "destructive"}>
                              {u.is_active ? "Active" : "Suspended"}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {u.last_action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {new Date(u.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[120px]" title={u.id}>
                            {u.id}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* 6. DATABASE CONNECTION CONFIG & EXPORT GUIDE */}
          {activeTab === "config" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PostgreSQL Config */}
              <Card className="border-slate-200 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <Server className="h-4 w-4 text-blue-600" /> PostgreSQL 16 (Recommended for Production)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    SETU uses SQLAlchemy ORM. Connect to PostgreSQL simply by updating your connection URI.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      1. Environment Variable (`backend/.env`):
                    </label>
                    <pre className="p-3 bg-slate-900 text-amber-300 rounded-lg text-[11px] font-mono overflow-x-auto">
DATABASE_URL=postgresql://postgres:password@localhost:5432/setu_db
                    </pre>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      2. Run Migration / Tables Creation:
                    </label>
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto">
cd backend
source .venv/bin/activate
pip install psycopg2-binary
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
python -m app.db.seed
                    </pre>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-900 text-[11px]">
                    <strong>Note:</strong> All SQLAlchemy models (`users`, `organizations`, `student_profiles`, `faculty_profiles`, etc.) automatically generate clean relational schema tables in PostgreSQL with foreign keys and indexes.
                  </div>
                </CardContent>
              </Card>

              {/* MySQL & MongoDB Setup */}
              <Card className="border-slate-200 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                    <Code2 className="h-4 w-4 text-emerald-600" /> MySQL / MariaDB & MongoDB Drivers
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Connecting SETU to MySQL or MongoDB Document Storage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">For MySQL 8.0+:</p>
                    <pre className="p-2.5 bg-slate-900 text-amber-300 rounded-lg text-[11px] font-mono overflow-x-auto">
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/setu_db
pip install pymysql cryptography
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">For MongoDB (Audit Log / Document Archival):</p>
                    <pre className="p-2.5 bg-slate-900 text-emerald-300 rounded-lg text-[11px] font-mono overflow-x-auto">
MONGODB_URI=mongodb://localhost:27017/setu_records
pip install motor pymongo
                    </pre>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                    A standalone terminal inspection utility has been created at <code className="text-[#801b33] font-bold">backend/inspect_db.py</code>. You can run <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">python backend/inspect_db.py</code> anytime in your terminal to see beautiful formatted ASCII tables of all user records!
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
