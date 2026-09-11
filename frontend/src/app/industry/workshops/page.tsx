"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Modal } from "@/components/ui";
import { Calendar, Plus, Users, Video } from "lucide-react";

export default function IndustryWorkshopsPage() {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [dateTime, setDateTime] = useState("2026-09-15T14:00");
  const [duration, setDuration] = useState(2.0);
  const [capacity, setCapacity] = useState(150);
  const [mode, setMode] = useState("ONLINE");
  const [meetingUrl, setMeetingUrl] = useState("https://meet.ecosystem.gov.in/industry-workshop");
  const [isPublishing, setIsPublishing] = useState(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    try {
      await api.post("/workshops", {
        title,
        description,
        speaker,
        date_time: new Date(dateTime).toISOString(),
        duration_hours: Number(duration),
        capacity: Number(capacity),
        mode,
        meeting_url: meetingUrl,
      });
      setShowCreate(false);
      fetchWorkshops();
    } catch (e: any) {
      alert(e.message || "Failed to create workshop");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading workshops...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Industry Workshops & Bootcamps</h1>
          <p className="text-xs text-slate-500">
            Host technical sessions, masterclasses, and recruit talent directly through interactive workshops
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Host New Workshop
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workshops.map((ws) => (
          <Card key={ws.id} className="hover:border-blue-300 transition">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="gov">{ws.category}</Badge>
                <span className="text-[11px] font-bold text-blue-600">{ws.mode}</span>
              </div>
              <CardTitle className="text-base leading-snug">{ws.title}</CardTitle>
              <CardDescription className="line-clamp-2 mt-1">{ws.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs text-slate-600">
              <p><strong>Speaker:</strong> {ws.speaker}</p>
              <p><strong>Hosted By:</strong> {ws.organization_name}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>{new Date(ws.date_time).toLocaleDateString()}</span>
                <span>{ws.registered_count} / {ws.capacity} Registered</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Host a Technical Workshop"
        description="Invite students and researchers across universities"
      >
        <form onSubmit={handleCreate} className="space-y-3 pt-2">
          <Input label="Workshop Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Speaker Name & Designation" value={speaker} onChange={(e) => setSpeaker(e.target.value)} required />
            <Input label="Date & Time" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (Hours)" type="number" step="0.5" value={duration} onChange={(e) => setDuration(Number(e.target.value))} required />
            <Input label="Capacity (Attendees)" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
          </div>
          <Input label="Meeting Link" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isPublishing}>
              Publish Workshop
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
