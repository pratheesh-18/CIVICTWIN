"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import { getDepartmentStats, getDepartmentProblems } from "../../../../lib/api";
import {
  DepartmentStatCards as StatCardsType,
  DepartmentProblemItem,
} from "../../../../types";
import { DepartmentStatCardsRow } from "../../../../components/DepartmentStatCards";
import { DepartmentProblemTable } from "../../../../components/DepartmentProblemTable";
import { ClusterMap } from "../../../../components/ClusterMap";
import { VerifierModal } from "../../../../components/VerifierModal";
import { XAIInspectorModal } from "../../../../components/XAIInspectorModal";
import { LanguageToggle } from "../../../../components/LanguageToggle";
import { NotificationBell } from "../../../../components/NotificationBell";
import { DEPARTMENTS, getTierBadge } from "../../../../lib/definitions";
import { normalizeDefectImageUrl } from "../../../../lib/defectImages";
import {
  ArrowLeft,
  RefreshCw,
  LogOut,
  Building2,
  Clock,
  ShieldCheck,
  MapPin,
  UserCheck,
  Brain,
  AlertTriangle,
  Layers,
  X,
} from "lucide-react";

export default function DepartmentDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params.slug as string)?.toLowerCase();
  const { user, loading: authLoading, logout, language } = useAuth();
  const isTa = language === "ta";

  const [stats, setStats] = useState<StatCardsType | null>(null);
  const [problems, setProblems] = useState<DepartmentProblemItem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<DepartmentProblemItem | null>(null);
  const selectedProblemIdRef = useRef<number | null>(null);

  const handleSelectProblem = (problem: DepartmentProblemItem) => {
    selectedProblemIdRef.current = problem.id;
    setSelectedProblem(problem);
  };

  const [statusFilter, setStatusFilter] = useState("pending");
  const [tierFilter, setTierFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // XAI Modal State
  const [isXAIModalOpen, setIsXAIModalOpen] = useState(false);

  const deptInfo = DEPARTMENTS[slug] || {
    slug,
    name_en: `${slug.toUpperCase()} Department`,
    name_ta: `${slug} துறை`,
    incharge_username: `${slug}_officer`,
    category: "Civic Defect",
  };

  // RBAC Access Check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/");
      } else if (user.role === "citizen") {
        router.push("/dashboard");
      } else if (user.role === "department") {
        // Enforce that department officer cannot open another department!
        const userSlug =
          user.department?.toLowerCase().includes("road")
            ? "roads"
            : user.department?.toLowerCase().includes("water")
            ? "water"
            : user.department?.toLowerCase().includes("light") || user.department?.toLowerCase().includes("electr")
            ? "electrical"
            : "sanitation";
        if (userSlug !== slug) {
          router.push(`/officer/department/${userSlug}`);
        }
      }
    }
  }, [user, authLoading, slug, router]);

  const loadData = async () => {
    if (!slug) return;
    setIsRefreshing(true);
    try {
      const [statsData, problemsData] = await Promise.all([
        getDepartmentStats(slug),
        getDepartmentProblems(slug, {
          status: statusFilter,
          tier: tierFilter,
          sort: "priority",
        }),
      ]);
      setStats(statsData);
      setProblems(problemsData.problems || []);

      // Retain the officer's currently selected problem (even if low priority work)
      if (problemsData.problems.length > 0) {
        const targetId = selectedProblemIdRef.current;
        if (targetId !== null) {
          const match = problemsData.problems.find((p) => p.id === targetId);
          if (match) {
            setSelectedProblem(match);
          } else {
            // Selected problem is no longer in current filtered view
            selectedProblemIdRef.current = problemsData.problems[0].id;
            setSelectedProblem(problemsData.problems[0]);
          }
        } else {
          selectedProblemIdRef.current = problemsData.problems[0].id;
          setSelectedProblem(problemsData.problems[0]);
        }
      } else {
        selectedProblemIdRef.current = null;
        setSelectedProblem(null);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load department dashboard data", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "department" || user.role === "commissioner")) {
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [slug, statusFilter, tierFilter, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Format selectedProblem to Cluster format expected by VerifierModal
  const clusterForVerifier: any = selectedProblem
    ? {
        id: selectedProblem.id,
        title: selectedProblem.title,
        category: selectedProblem.category,
        latitude: selectedProblem.latitude,
        longitude: selectedProblem.longitude,
        priority_score: selectedProblem.priority_score,
        status: selectedProblem.status,
        assigned_dept: selectedProblem.assigned_dept,
        sla_hours: selectedProblem.sla_hours,
        report_count: selectedProblem.report_count,
        before_image: normalizeDefectImageUrl(selectedProblem.before_image, selectedProblem.category),
        created_at: selectedProblem.created_at,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans w-full">
      {/* 1. Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm w-full">
        <div className="max-w-[1440px] w-[calc(100%-40px)] mx-auto px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user.role === "commissioner" && (
              <Link
                href="/officer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Departments</span>
              </Link>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">CivicTwin</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {isTa ? deptInfo.name_ta : deptInfo.name_en}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
            </button>

            <NotificationBell userRole="department" />

            <LanguageToggle />

            <div className="text-right pl-2 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-900 block">{user.name}</span>
              <span className="text-[11px] text-slate-500 font-mono block">@{user.username}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Dashboard Container */}
      <main className="flex-1 max-w-[1440px] w-[calc(100%-40px)] mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards Row */}
        {stats && <DepartmentStatCardsRow stats={stats} loading={loading && !stats} />}

        {/* Top Two-Column Grid: Left Grievance Queue (58-60%), Right Map (40-42%) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)] gap-6 items-start w-full">
          {/* LEFT COLUMN: Department User Grievances & Problems Queue */}
          <div className="w-full min-w-0">
            <DepartmentProblemTable
              problems={problems}
              selectedProblem={selectedProblem}
              onSelectProblem={handleSelectProblem}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              tierFilter={tierFilter}
              setTierFilter={setTierFilter}
              loading={loading && problems.length === 0}
            />
          </div>

          {/* RIGHT COLUMN: Map at the TOP of the right area */}
          <div className="w-full min-w-0">
            <div className="h-[410px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-white relative box-border">
              <ClusterMap
                clusters={problems}
                selectedCluster={selectedProblem}
                onSelectCluster={handleSelectProblem}
              />
            </div>
          </div>
        </div>

        {/* Directly below the map: ONE row (Proof of Work on LEFT, Ticket Detail on RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-6 items-stretch w-full">
          {/* LEFT cell (DOM 1st): Proof of Work Card (VerifierModal) */}
          <div className="w-full h-full order-2 lg:order-1 flex flex-col">
            <VerifierModal
              selectedCluster={clusterForVerifier}
              onVerificationComplete={loadData}
            />
          </div>

          {/* RIGHT cell (DOM 2nd): Ticket Detail Card */}
          <div className="w-full h-full order-1 lg:order-2 flex flex-col">
            {selectedProblem ? (
              <div className="bg-white border border-[#E2DDD3] rounded-[12px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-5 w-full h-full box-border flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Category & Status Chips */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-300">
                        #{selectedProblem.id}
                      </span>
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        {selectedProblem.category}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                        selectedProblem.status.toUpperCase() === "VERIFIED" ||
                        selectedProblem.status.toUpperCase() === "CLOSED"
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                          : "bg-amber-50 text-amber-900 border-amber-300"
                      }`}
                    >
                      {selectedProblem.status}
                    </span>
                  </div>

                  {/* Problem Title (20px) */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-snug break-words">
                      {selectedProblem.title}
                    </h3>
                  </div>

                  <hr className="border-slate-200" />

                  {/* 2-Column Metadata Grid (labels >=14px, values 16px) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-semibold text-sm block">
                        {isTa ? "புகார்தாரர்" : "Citizen Reporter"}
                      </span>
                      <span className="text-slate-900 font-bold text-base mt-0.5 flex items-center gap-1.5 truncate">
                        <UserCheck className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="truncate">{selectedProblem.citizen_name}</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-semibold text-sm block">
                        {isTa ? "முன்னுரிமை" : "Priority"}
                      </span>
                      <span className="text-rose-700 font-bold text-base font-mono mt-0.5 block truncate">
                        {selectedProblem.priority_score.toFixed(2)} ({selectedProblem.tier})
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-semibold text-sm block">
                        {isTa ? "இடம்" : "Location"}
                      </span>
                      <span className="text-slate-900 font-bold font-mono text-sm mt-0.5 flex items-center gap-1.5 truncate">
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{selectedProblem.latitude.toFixed(4)}, {selectedProblem.longitude.toFixed(4)}</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-semibold text-sm block">
                        {isTa ? "சரிசெய்ய மீதமுள்ள நேரம்" : "Time left to fix"}
                      </span>
                      <span className="text-slate-900 font-bold text-sm mt-0.5 flex items-center gap-1.5 truncate">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>{selectedProblem.sla_hours}h SLA ({selectedProblem.is_overdue ? "Overdue" : `${selectedProblem.sla_remaining_hours}h left`})</span>
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* What the citizen said */}
                  <div className="space-y-1.5">
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider block">
                      {isTa ? "பொதுமக்கள் கூறியது" : "What the citizen said"}
                    </span>
                    <p className="text-base font-medium text-slate-800 leading-relaxed italic bg-slate-50 p-3.5 rounded-xl border border-slate-200 break-words">
                      "{selectedProblem.complaint_text}"
                    </p>
                    <div className="text-sm font-semibold text-emerald-800 pt-0.5 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{selectedProblem.report_count} nearby citizen reports merged into this master problem</span>
                    </div>
                  </div>
                </div>

                {/* Why this priority Button */}
                <div className="pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsXAIModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Brain className="w-4 h-4 text-emerald-700" />
                    <span>{isTa ? "முன்னுரிமைக்கான காரணம்" : "Why this priority"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E2DDD3] rounded-[12px] p-6 text-center flex flex-col items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] h-full w-full box-border min-h-[300px]">
                <Layers className="w-8 h-8 text-slate-400 mb-2" />
                <h3 className="text-lg font-bold text-slate-900">
                  {isTa ? "பிரச்சனை விவரங்கள்" : "Problem Details"}
                </h3>
                <p className="text-base text-slate-500 mt-1 max-w-sm">
                  {isTa ? "விவரங்களை ஆய்வு செய்ய வரிசை அல்லது வரைபடத்தில் இருந்து ஒரு பிரச்சனையைத் தேர்ந்தெடுக்கவும்." : "Select a problem from the queue or map to inspect details."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* XAI Decision Inspector Modal */}
      {selectedProblem && (
        <XAIInspectorModal
          clusterId={selectedProblem.id}
          isOpen={isXAIModalOpen}
          onClose={() => setIsXAIModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 w-full">
        <div className="max-w-[1440px] w-[calc(100%-40px)] mx-auto px-6 text-center text-xs text-slate-500">
          <span>CivicTwin Autonomous Collective • Built with FastAPI & Next.js 14</span>
        </div>
      </footer>
    </div>
  );
}
