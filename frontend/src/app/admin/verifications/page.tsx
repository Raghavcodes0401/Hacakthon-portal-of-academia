"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Modal } from "@/components/ui";
import { Building2, ShieldCheck, XCircle, AlertTriangle, Check, Search } from "lucide-react";

export default function AdminVerificationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [actionReason, setActionReason] = useState("");
  const [pendingAction, setPendingAction] = useState<"VERIFIED" | "REJECTED" | "SUSPENDED">("VERIFIED");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrgs = async () => {
    try {
      const url = statusFilter ? `/admin/verifications?status_filter=${statusFilter}` : "/admin/verifications";
      const data = await api.get(url);
      setOrganizations(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [statusFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedOrg) return;
    setIsProcessing(true);
    try {
      await api.patch(`/admin/verifications/${selectedOrg.id}`, {
        verification_status: pendingAction,
        reason: actionReason || undefined,
      });
      setSelectedOrg(null);
      setActionReason("");
      fetchOrgs();
    } catch (e: any) {
      alert(e.message || "Failed to update organization verification status");
    } finally {
      setIsProcessing(false);
    }
  };

  const openActionModal = (org: any, action: "VERIFIED" | "REJECTED" | "SUSPENDED") => {
    setSelectedOrg(org);
    setPendingAction(action);
    setActionReason(
      action === "VERIFIED"
        ? "Accreditation approved based on verified enterprise registration."
        : action === "REJECTED"
        ? "Insufficient corporate credential validation."
        : "Temporarily suspended pending administrative review."
    );
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading organization verification queue...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organization Verification Queue</h1>
          <p className="text-xs text-slate-500">
            Enforce trust and regulatory compliance. Only verified entities can interact with student cohorts.
          </p>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Verification States</option>
            <option value="PENDING">Pending Approval</option>
            <option value="VERIFIED">Verified</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Organization Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Associated Users</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">{org.name}</div>
                      {org.website && (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          {org.website}
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="gov">{org.type}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{org.location || "National"}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          org.verification_status === "VERIFIED"
                            ? "verified"
                            : org.verification_status === "PENDING"
                            ? "warning"
                            : org.verification_status === "SUSPENDED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {org.verification_status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {org.associated_users_count} Users
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {org.verification_status !== "VERIFIED" && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-[11px] bg-emerald-600 hover:bg-emerald-700 h-7 px-2.5"
                          onClick={() => openActionModal(org, "VERIFIED")}
                        >
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      )}
                      {org.verification_status !== "REJECTED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-7 px-2"
                          onClick={() => openActionModal(org, "REJECTED")}
                        >
                          Reject
                        </Button>
                      )}
                      {org.verification_status === "VERIFIED" && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="text-[11px] h-7 px-2"
                          onClick={() => openActionModal(org, "SUSPENDED")}
                        >
                          Suspend
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      {selectedOrg && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrg(null)}
          title={`Confirm Action: ${pendingAction}`}
          description={`Target Organization: ${selectedOrg.name}`}
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to mark <strong>{selectedOrg.name}</strong> as{" "}
              <strong>{pendingAction}</strong>? This decision will be logged in the immutable audit trail and will immediately update permissions for affiliated users.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Audit Justification
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrg(null)}>
                Cancel
              </Button>
              <Button
                variant={pendingAction === "VERIFIED" ? "primary" : "danger"}
                size="sm"
                onClick={handleUpdateStatus}
                isLoading={isProcessing}
              >
                Confirm {pendingAction}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
