"use client";

import React, { useEffect, useState } from "react";
import { getAuditTrail } from "../lib/api";
import { AgentAuditLog } from "../types";
import {
  Brain,
  CheckCircle2,
  Copy,
  Cpu,
  Layers,
  ShieldCheck,
  X,
  Zap,
  MapPin,
  Clock,
  Building2,
  FileText,
  AlertTriangle,
  Eye,
  Code2,
  MessageSquare,
  Sparkles,
} from "lucide-react";

interface XAIInspectorModalProps {
  clusterId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const XAIInspectorModal: React.FC<XAIInspectorModalProps> = ({
  clusterId,
  isOpen,
  onClose,
}) => {
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"clean" | "raw">("clean");

  useEffect(() => {
    if (isOpen && clusterId) {
      setLoading(true);
      getAuditTrail(clusterId)
        .then((logs) => setAuditLogs(logs))
        .catch((err) => console.error("XAI Audit Trail Fetch Error", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, clusterId]);

  if (!isOpen || !clusterId) return null;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(auditLogs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderAgentCleanSummary = (agentName: string, inputObj: any, outputObj: any) => {
    const nameLower = agentName.toLowerCase();

    // ──► AGENT 1: INTAKE & NLP
    if (nameLower.includes("intake") || nameLower.includes("agent 1")) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input: Citizen Submission */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Citizen Grievance Submission</span>
            </span>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-800 italic leading-relaxed">
              "{inputObj.text || "Citizen grievance recorded."}"
            </div>
            {inputObj.filename && (
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="font-bold text-slate-500">Attached Proof:</span>
                <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-semibold">
                  📷 {inputObj.filename}
                </span>
              </div>
            )}
          </div>

          {/* Decision: NLP Classification */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Vernacular Classification Result</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block text-[10px] font-bold">Category</span>
                <span className="text-emerald-900 font-extrabold text-sm">
                  {outputObj.category || "Pothole"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                <span className="text-slate-500 block text-[10px] font-bold">Severity</span>
                <span className="text-rose-700 font-extrabold text-sm">
                  {outputObj.severity || "Critical"}
                </span>
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-bold">Calculated Hazard Weight:</span>
              <span className="font-mono font-black text-emerald-800 text-sm">
                {outputObj.hazard_weight !== undefined ? outputObj.hazard_weight : "0.95"} / 1.00
              </span>
            </div>
          </div>
        </div>
      );
    }

    // ──► AGENT 2: SPATIAL CLUSTERING
    if (nameLower.includes("cluster") || nameLower.includes("agent 2")) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Spatial Geo-Location Input</span>
            </span>
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
              <div className="font-mono font-black text-slate-900">
                Lat: {inputObj.lat || "13.0827"}, Lon: {inputObj.lon || "80.2707"}
              </div>
              <span className="text-[11px] text-slate-500">
                Category: <strong>{inputObj.category || "Civic Defect"}</strong>
              </span>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Spatial Clustering Decision</span>
            </span>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Cluster ID:</span>
                <span className="font-mono font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                  #{outputObj.cluster_id || clusterId}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-600 font-bold">Merged Reports:</span>
                <span className="font-mono font-black text-blue-700">
                  ⚡ {outputObj.report_count || 1} Citizens Grouped
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Deduplicated within 50m radius. Prevents duplicate contractor work orders.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // ──► AGENT 3: DYNAMIC RISK PRIORITY
    if (nameLower.includes("priority") || nameLower.includes("agent 3")) {
      const score = outputObj.priority_score !== undefined ? outputObj.priority_score : 0.85;
      const isCritical = score >= 0.75;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Risk Aggregation Factors</span>
            </span>
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Base Hazard Weight:</span>
                <span className="font-mono font-bold text-slate-900">
                  {inputObj.hazard_weight !== undefined ? inputObj.hazard_weight : "0.95"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Public Report Volume:</span>
                <span className="font-mono font-bold text-slate-900">
                  {inputObj.report_count !== undefined ? inputObj.report_count : "14"} reports
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-600 font-medium">Escalation Mechanism:</span>
                <span className="text-emerald-700 font-bold">Cumulative on previous priority</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dynamic AI Priority Score</span>
            </span>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold">Priority Index:</span>
                <span className="font-mono font-black text-rose-700 text-base">
                  {score.toFixed(2)} / 1.00
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isCritical ? "bg-rose-500" : "bg-amber-500"}`}
                  style={{ width: `${score * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 text-[11px]">Hazard Tier:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-black ${
                    isCritical
                      ? "bg-rose-100 text-rose-900 border border-rose-300"
                      : "bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                >
                  {isCritical ? "Tier 1 (Critical Emergency)" : "Tier 2 (Urgent)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ──► AGENT 4: AUTONOMOUS DISPATCH & SLA
    if (nameLower.includes("dispatch") || nameLower.includes("agent 4")) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Incoming Defect Profile</span>
            </span>
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Defect Classification:</span>
                <span className="font-bold text-slate-900">{inputObj.category || "Pothole"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Dynamic Priority Score:</span>
                <span className="font-mono font-bold text-rose-700">
                  {inputObj.priority_score !== undefined ? inputObj.priority_score : "0.94"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Target Jurisdiction & SLA Commitment</span>
            </span>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1.5 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-bold">Assigned Department</span>
                <span className="font-black text-slate-900 text-sm block">
                  {outputObj.assigned_dept || "Roads & Infrastructure Maintenance Wing"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-600 font-bold">Target Resolution SLA:</span>
                <span className="font-mono font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  ⏰ {outputObj.sla_hours || 24} Hours SLA
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ──► AGENT 5: VERIFICATION & AUDIT (Or any other log)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Inspection Evidence Inputs</span>
          </span>
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
            {Object.entries(inputObj).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-slate-500 font-medium capitalize">{k.replace(/_/g, " ")}:</span>
                <span className="font-mono font-bold text-slate-900 truncate max-w-[200px]">
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Inspection Audit Outcome</span>
          </span>
          <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1 text-xs">
            {Object.entries(outputObj).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-slate-500 font-medium capitalize">{k.replace(/_/g, " ")}:</span>
                <span className="font-mono font-bold text-emerald-950 truncate max-w-[200px]">
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-emerald-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-700 via-teal-700 to-green-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur shrink-0">
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-black tracking-tight">
                  Explainable AI (XAI) Mathematical Decision Audit
                </h3>
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white font-mono font-bold text-xs">
                  Cluster #{clusterId}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
                Transparent decision trace & confidence breakdown across all 5 autonomous agents
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* View Mode Toggle Strip */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="inline-flex rounded-xl bg-white border border-slate-300 p-1 text-xs font-bold shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("clean")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === "clean"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Executive Management View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === "raw"
                  ? "bg-slate-900 text-emerald-300 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw JSON Audit</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">
            Deterministic Decision Integrity Certified
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          {loading ? (
            <div className="text-center py-12 text-slate-500 animate-pulse font-semibold">
              Loading mathematical decision audit logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-semibold">
              No audit logs found for Cluster #{clusterId}.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Formula & Transparency Banner */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-200 shadow-sm space-y-2">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>XAI Priority Score Mathematical Formula</span>
                </h4>
                <div className="p-3 bg-slate-900 text-emerald-300 rounded-xl font-mono text-xs sm:text-sm font-bold shadow-inner overflow-x-auto">
                  Score = (0.4 × Hazard_Weight) + (0.3 × min(Report_Count × 0.15, 0.45)) + 0.25
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Guarantees deterministic, reproducible priority indexing clamped between 0.10 and 0.98.
                </p>
              </div>

              {/* Audit Logs List */}
              {auditLogs.map((log, index) => {
                let inputObj: any = {};
                let outputObj: any = {};
                try {
                  inputObj = JSON.parse(log.input_data);
                  outputObj = JSON.parse(log.decision_output);
                } catch {
                  inputObj = { raw: log.input_data };
                  outputObj = { raw: log.decision_output };
                }

                return (
                  <div
                    key={log.id || index}
                    className="bg-white rounded-2xl border-2 border-slate-200 p-4 sm:p-5 shadow-sm space-y-3.5 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black flex items-center justify-center font-mono">
                          #{index + 1}
                        </span>
                        <h5 className="text-sm sm:text-base font-extrabold text-slate-900">
                          {log.agent_name}
                        </h5>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                          Confidence: {(log.confidence_score * 100).toFixed(0)}%
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Content: Clean View vs Raw JSON */}
                    {viewMode === "clean" ? (
                      renderAgentCleanSummary(log.agent_name, inputObj, outputObj)
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-slate-200">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 font-sans">
                            📥 Input Feature Vector:
                          </span>
                          <pre className="whitespace-pre-wrap text-[11px] text-cyan-300 font-mono">
                            {JSON.stringify(inputObj, null, 2)}
                          </pre>
                        </div>

                        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-slate-200">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 font-sans">
                            📤 Decision Output & Score:
                          </span>
                          <pre className="whitespace-pre-wrap text-[11px] text-emerald-300 font-mono">
                            {JSON.stringify(outputObj, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between sm:px-6">
          <span className="text-xs text-slate-500 font-bold">
            🔒 CivicTwin XAI Transparency Engine • Deterministic Verification Audit
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied JSON!" : "Copy Full JSON Audit"}</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
