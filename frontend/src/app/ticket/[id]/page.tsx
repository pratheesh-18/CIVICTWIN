"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { LanguageToggle } from "../../../components/LanguageToggle";
import { getMyTickets, getAuditTrail } from "../../../lib/api";
import { CitizenTicketItem, AgentAuditLog } from "../../../types";
import { getDefectFallbackImage, normalizeDefectImageUrl } from "../../../lib/defectImages";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Brain,
  Building2,
} from "lucide-react";

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = parseInt(params.id as string, 10);
  const { user, loading, t } = useAuth();

  const [ticket, setTicket] = useState<CitizenTicketItem | null>(null);
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchTicketData = async () => {
      setFetching(true);
      try {
        const myData = await getMyTickets();
        const found = myData.tickets.find((t) => t.ticket_id === ticketId);
        if (found) {
          setTicket(found);
          if (found.master_cluster_id) {
            const logs = await getAuditTrail(found.master_cluster_id);
            setAuditLogs(logs);
          }
        }
      } catch (err) {
        console.error("Failed to load ticket details", err);
      } finally {
        setFetching(false);
      }
    };

    if (ticketId) {
      fetchTicketData();
    }
  }, [ticketId]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Ticket Not Found</h2>
          <p className="text-xs text-slate-500">The requested ticket could not be found or you do not have permission to view it.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = ticket.status === "VERIFIED" || ticket.status === "RESOLVED";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <LanguageToggle />
        </div>
      </header>

      {/* Main Ticket Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Ticket Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                Ticket #{ticket.ticket_id}
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-0.5">
                {ticket.category}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  isVerified
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {ticket.status}
              </span>
            </div>
          </div>

          {/* Description & Photo */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <img
              src={normalizeDefectImageUrl(ticket.image_url, ticket.category)}
              alt={ticket.category}
              className="w-full md:w-56 h-48 object-cover rounded-xl border border-slate-200 shadow-sm bg-slate-100 shrink-0"
              onError={(e) => {
                e.currentTarget.src = getDefectFallbackImage(ticket.category);
              }}
            />

            <div className="space-y-3 flex-1">
              <div>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Reported Issue Description
                </h2>
                <p className="text-sm font-medium text-slate-800 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  "{ticket.raw_text}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-semibold block">Jurisdictional Wing</span>
                  <span className="text-slate-900 font-bold mt-0.5 block">{ticket.assigned_dept}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-semibold block">Resolution SLA</span>
                  <span className="text-slate-900 font-bold mt-0.5 block">{ticket.sla_hours} Hours Target</span>
                </div>
              </div>

              {ticket.cluster_report_count > 1 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-semibold">
                  <Layers className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Deduplicated with {ticket.cluster_report_count} citizen reports in Master Cluster #{ticket.master_cluster_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Trail Stepper */}
        {auditLogs.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-600" />
              <span>Autonomous AI Decision Trail</span>
            </h2>

            <div className="space-y-3">
              {auditLogs.map((log, idx) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{log.agent_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Confidence: {(log.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200 break-all text-[11px]">
                      {log.decision_output}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <span>CivicTwin Autonomous Collective • Built with FastAPI & Next.js 14</span>
      </footer>
    </div>
  );
}
