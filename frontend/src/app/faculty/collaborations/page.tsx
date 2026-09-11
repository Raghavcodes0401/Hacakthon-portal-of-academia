"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Modal } from "@/components/ui";
import { Users, Sparkles, Send, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export default function FacultyCollaborationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [collabs, setCollabs] = useState<{ sent: any[]; received: any[] }>({ sent: [], received: [] });
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [recs, list] = await Promise.all([
        api.get("/faculty/recommendations/collaborators"),
        api.get("/faculty/collaborations"),
      ]);
      setRecommendations(recs || []);
      setCollabs(list || { sent: [], received: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setIsSending(true);
    try {
      await api.post("/faculty/collaborations", {
        recipient_faculty_id: selectedFaculty.faculty_id,
        project_title: projectTitle,
        message,
      });
      setSelectedFaculty(null);
      setProjectTitle("");
      setMessage("");
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to send collaboration request");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (collabId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await api.patch(`/faculty/collaborations/${collabId}/status?status_str=${status}`);
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to update collaboration status");
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading research collaboration network...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Research Collaborator Discovery</h1>
          <Badge variant="verified">Semantic Synergy Engine</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Connecting researchers across institutes based on complementary methodologies and shared publication domains
        </p>
      </div>

      {/* AI Recommendations */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" /> Synergistic Researcher Recommendations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <Card key={rec.faculty_id} className="border-purple-200 bg-purple-50/20 hover:border-purple-300 transition flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="gov">{rec.institution}</Badge>
                  <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {rec.similarity_score}% Match
                  </span>
                </div>
                <CardTitle className="text-base">{rec.faculty_name}</CardTitle>
                <CardDescription className="text-xs text-slate-700 leading-relaxed pt-1">
                  {rec.reason}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-1">
                  {(rec.shared_domains || []).map((d: string) => (
                    <span key={d} className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-purple-800 border border-purple-200">
                      #{d}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-purple-100 flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setSelectedFaculty(rec);
                      setProjectTitle(`Joint Research Proposal with ${rec.faculty_name}`);
                    }}
                  >
                    <Send className="h-3.5 w-3.5 mr-1" /> Propose Collaboration
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Collaboration Requests Inbox / Outbox */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
        {/* Received Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Received Collaboration Requests ({collabs.received?.length || 0})</CardTitle>
            <CardDescription>Invitations sent to you by other faculty members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(collabs.received || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No pending invitations</p>
            ) : (
              collabs.received.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{c.sender_name}</span>
                    <Badge variant={c.status === "ACCEPTED" ? "success" : c.status === "REJECTED" ? "destructive" : "warning"}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-semibold text-blue-700">{c.project_title}</p>
                  <p className="text-xs text-slate-500">{c.message}</p>

                  {c.status === "PENDING" && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(c.id, "REJECTED")}>
                        Decline
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(c.id, "ACCEPTED")}>
                        Accept
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Sent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sent Collaboration Proposals ({collabs.sent?.length || 0})</CardTitle>
            <CardDescription>Proposals you initiated with external faculty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(collabs.sent || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No outgoing proposals</p>
            ) : (
              collabs.sent.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">To: {c.recipient_name}</span>
                    <Badge variant={c.status === "ACCEPTED" ? "success" : "outline"}>{c.status}</Badge>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700">{c.project_title}</p>
                  <p className="text-[11px] text-slate-400">{c.recipient_institution}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Propose Modal */}
      {selectedFaculty && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedFaculty(null)}
          title={`Invite ${selectedFaculty.faculty_name} to Collaborate`}
          description={`Affiliation: ${selectedFaculty.institution}`}
        >
          <form onSubmit={handleSendRequest} className="space-y-4 pt-2">
            <Input
              label="Collaborative Project Title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Proposal Outline & Message
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain the proposed joint research direction, lab resources, or grant targets..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={() => setSelectedFaculty(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSending}>
                Send Proposal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
