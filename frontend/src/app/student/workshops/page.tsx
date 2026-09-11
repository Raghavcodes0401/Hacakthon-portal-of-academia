"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { Calendar, Users, Video, CheckCircle2, Clock } from "lucide-react";

export default function StudentWorkshopsPage() {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkshops = async () => {
    try {
      const data = await api.get("/workshops");
      setWorkshops(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const handleRegister = async (workshopId: string) => {
    try {
      await api.post(`/workshops/${workshopId}/register`);
      fetchWorkshops();
    } catch (e: any) {
      alert(e.message || "Failed to register for workshop");
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading workshops...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Industry Workshops & Bootcamps</h1>
        <p className="text-xs text-slate-500">
          Live technical talks, hackathons, and masterclasses hosted by enterprise engineers and research labs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workshops.map((ws) => (
          <Card key={ws.id} className="hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="gov">{ws.category}</Badge>
                <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                  <Video className="h-3 w-3" /> {ws.mode}
                </span>
              </div>
              <CardTitle className="text-base leading-snug">{ws.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">{ws.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="text-xs text-slate-600 space-y-1">
                <p><strong>Speaker:</strong> {ws.speaker}</p>
                <p><strong>Host:</strong> {ws.organization_name}</p>
                <p className="text-[11px] text-slate-400">
                  {new Date(ws.date_time).toLocaleDateString()} at {new Date(ws.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ws.duration_hours} Hours
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  {ws.registered_count} / {ws.capacity} Registered
                </span>

                {ws.is_registered ? (
                  <Badge variant="verified">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Registered
                  </Badge>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => handleRegister(ws.id)}>
                    Register Free
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
