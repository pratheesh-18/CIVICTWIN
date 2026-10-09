"use client";

import React, { useEffect, useState } from "react";
import { Cluster } from "../types";
import { getActiveClusters } from "../lib/api";
import { ClusterMap } from "./ClusterMap";
import { VerifierModal } from "./VerifierModal";
import { XAIInspectorModal } from "./XAIInspectorModal";
import { NotificationBell } from "./NotificationBell";
import {
  Brain,
  Layers,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  MapPin,
  Clock,
  MessageSquare,
  Building2,
  AlertTriangle,
} from "lucide-react";

export const OfficerDashboard: React.FC = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const selectedClusterIdRef = React.useRef<number | null>(null);
  const [loading, setLoading] = useState(true);

  // XAI Modal state
  const [isXAIModalOpen, setIsXAIModalOpen] = useState(false);
  const [xaiClusterId, setXAIClusterId] = useState<number | null>(null);

  const handleSelectCluster = (cluster: Cluster) => {
    selectedClusterIdRef.current = cluster.id;
    setSelectedCluster(cluster);
  };

  const loadClusters = async () => {
    setLoading(true);
    try {
      const data = await getActiveClusters();
      setClusters(data);
      if (data.length > 0) {
        const targetId = selectedClusterIdRef.current;
        if (targetId !== null) {
          const match = data.find((c) => c.id === targetId);
          if (match) {
            setSelectedCluster(match);
          } else {
            selectedClusterIdRef.current = data[0].id;
            setSelectedCluster(data[0]);
          }
        } else {
          selectedClusterIdRef.current = data[0].id;
          setSelectedCluster(data[0]);
        }
      } else {
        selectedClusterIdRef.current = null;
        setSelectedCluster(null);
      }
    } catch (err) {
      console.error("Failed to load active clusters", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, []);

  const handleVerificationComplete = () => {
    loadClusters();
  };

  const handleOpenXAI = (clusterId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setXAIClusterId(clusterId);
    setIsXAIModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            <span>Municipal Command Center</span>
          </h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Spatial hazard cluster queue & Agent 5 ground-truth resolution audit
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedCluster && (
            <button
              onClick={() => handleOpenXAI(selectedCluster.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs sm:text-sm font-black shadow-md transition-all"
            >
              <Brain className="w-4 h-4 text-white" />
              <span>🔍 Open XAI Decision Audit</span>
            </button>
          )}

          <button
            onClick={loadClusters}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-xs sm:text-sm font-bold text-slate-800 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>

          <NotificationBell userRole="department" />
        </div>
      </div>

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Spatial Cluster Map + Active Queue List */}
        <div className="lg:col-span-6 space-y-6">
          {/* Spatial Cluster Map Container */}
          <div className="h-[400px] w-full shadow-md rounded-3xl overflow-hidden border-2 border-emerald-100">
            <ClusterMap
              clusters={clusters}
              selectedCluster={selectedCluster}
              onSelectCluster={handleSelectCluster}
            />
          </div>

          {/* Active Clusters Queue List */}
          <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Active Hazard Cluster Queue ({clusters.length})</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono font-bold">
                Sorted by Priority Score
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-sm text-slate-500 animate-pulse font-semibold">
                Fetching active hazard clusters...
              </div>
            ) : clusters.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500 font-semibold">
                No active hazard clusters found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                {clusters.map((cluster) => {
                  const isSelected = selectedCluster?.id === cluster.id;
                  const isCritical = cluster.priority_score >= 0.75;

                  return (
                    <div
                      key={cluster.id}
                      onClick={() => handleSelectCluster(cluster)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/90 border-emerald-500 shadow-md shadow-emerald-500/15"
                          : "bg-white border-slate-200 hover:border-emerald-300 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-black font-mono bg-slate-100 text-slate-800 border border-slate-300">
                              #{cluster.id}
                            </span>
                            <span className="text-xs font-black text-slate-900">
                              {cluster.category}
                            </span>
                            {/* Citizen Name Attribution */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              <UserCheck className="w-3 h-3 text-blue-600" />
                              <span>{cluster.citizen_name || "Citizen"}</span>
                            </span>
                          </div>

                          <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                            {cluster.title}
                          </h4>

                          {/* Citizen Complaint Description */}
                          {cluster.complaint_text && (
                            <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200 line-clamp-2">
                              "{cluster.complaint_text}"
                            </p>
                          )}
                        </div>

                        {/* Priority Score Badge */}
                        <div className="text-right shrink-0">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black font-mono block ${
                              isCritical
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            Priority: {cluster.priority_score.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                            SLA: {cluster.sla_hours}h
                          </span>
                        </div>
                      </div>

                      {/* Location Coordinates & Merged Count */}
                      <div className="mt-2.5 flex flex-wrap items-center justify-between text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-100 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>{cluster.latitude.toFixed(4)}, {cluster.longitude.toFixed(4)}</span>
                          </span>
                          <span className="font-bold text-emerald-800">
                            ⚡ {cluster.report_count} Reports Merged
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleOpenXAI(cluster.id, e)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-black border border-emerald-300 transition-colors flex items-center gap-1"
                        >
                          <Brain className="w-3 h-3 text-emerald-700" />
                          <span>Audit XAI</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Citizen Incident Summary + VerifierModal (Hero Agent 5) */}
        <div className="lg:col-span-6 space-y-6">
          {selectedCluster && (
            <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Assigned Incident File #{selectedCluster.id}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {selectedCluster.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block">Citizen Reporter</span>
                  <span className="text-slate-900 font-extrabold text-sm mt-0.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>{selectedCluster.citizen_name || "Citizen"}</span>
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block">Dynamic AI Priority</span>
                  <span className="text-slate-900 font-extrabold text-sm mt-0.5 font-mono text-rose-700">
                    {selectedCluster.priority_score.toFixed(2)} / 1.00 ({selectedCluster.priority_score >= 0.75 ? "CRITICAL HAZARD" : "HIGH"})
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block">Jurisdictional Admin Wing</span>
                  <span className="text-slate-900 font-bold mt-0.5 block">
                    {selectedCluster.assigned_dept || "Roads & Infrastructure Maintenance Wing"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold block">Incident GPS Location</span>
                  <span className="text-slate-900 font-bold mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedCluster.latitude.toFixed(4)}° N, {selectedCluster.longitude.toFixed(4)}° E</span>
                  </span>
                </div>
              </div>

              {selectedCluster.complaint_text && (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Citizen Complaint Statement
                  </span>
                  <p className="text-xs font-semibold text-slate-800 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 leading-relaxed">
                    "{selectedCluster.complaint_text}"
                  </p>
                </div>
              )}
            </div>
          )}

          <VerifierModal
            selectedCluster={selectedCluster}
            onVerificationComplete={handleVerificationComplete}
          />
        </div>
      </div>

      {/* Explainable AI Modal */}
      <XAIInspectorModal
        clusterId={xaiClusterId}
        isOpen={isXAIModalOpen}
        onClose={() => setIsXAIModalOpen(false)}
      />
    </div>
  );
};
