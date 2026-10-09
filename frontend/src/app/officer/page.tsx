"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { getOverviewStats } from "../../lib/api";
import { OverviewStatsResponse, DepartmentStatCards } from "../../types";
import { LanguageToggle } from "../../components/LanguageToggle";
import { NotificationBell } from "../../components/NotificationBell";
import { DEPARTMENTS } from "../../lib/definitions";
import {
  ShieldCheck,
  LogOut,
  Building2,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from "lucide-react";

export default function CommissionerOverviewPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, language } = useAuth();
  const isTa = language === "ta";

  const [stats, setStats] = useState<OverviewStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Role Guard & Redirection
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/");
      } else if (user.role === "citizen") {
        router.push("/dashboard");
      } else if (user.role === "department") {
        // Automatically redirect department officer to their department dashboard!
        const deptSlug =
          user.department?.toLowerCase().includes("road")
            ? "roads"
            : user.department?.toLowerCase().includes("water")
            ? "water"
            : user.department?.toLowerCase().includes("light") || user.department?.toLowerCase().includes("electr")
            ? "electrical"
            : "sanitation";
        router.push(`/officer/department/${deptSlug}`);
      }
    }
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const data = await getOverviewStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load overview stats", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "commissioner") {
      fetchStats();
      // Auto-refresh polling every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (authLoading || (user && user.role === "department")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const city = stats?.city_totals;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm w-full">
        <div className="max-w-[1440px] w-[calc(100%-40px)] mx-auto px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">CivicTwin</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>City Commissioner Command Center</span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>

            <button
              type="button"
              onClick={fetchStats}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
            </button>

            <NotificationBell userRole="commissioner" />

            <LanguageToggle />

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-700 text-xs font-semibold transition-colors shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1440px] w-[calc(100%-40px)] mx-auto px-6 py-6 space-y-6">
        {/* City-Wide Totals Strip */}
        {city && (
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isTa ? "மாநகர அளவிலான மொத்த புள்ளிவிவரங்கள்" : "City-Wide Municipal Overview"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-sm">
                <span className="text-sm font-bold text-slate-600 uppercase">Overall Registered</span>
                <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-mono my-1">
                  {city.overall_registered}
                </div>
                <span className="text-xs text-slate-500 font-semibold">from {city.total_reports} citizen reports</span>
              </div>

              <div className="bg-white border-2 border-emerald-300 rounded-2xl p-5 shadow-sm">
                <span className="text-sm font-bold text-emerald-800 uppercase">Total Solved</span>
                <div className="text-4xl sm:text-5xl font-extrabold text-emerald-700 font-mono my-1">
                  {city.total_solved}
                </div>
                <span className="text-xs text-slate-500 font-semibold">{city.resolution_rate_pct}% resolution rate</span>
              </div>

              <div className="bg-white border-2 border-blue-300 rounded-2xl p-5 shadow-sm">
                <span className="text-sm font-bold text-blue-800 uppercase">Received Today</span>
                <div className="text-4xl sm:text-5xl font-extrabold text-blue-700 font-mono my-1">
                  {city.today_received}
                </div>
                <span className="text-xs text-slate-500 font-semibold">Asia/Kolkata 00:00 - 23:59</span>
              </div>

              <div className="bg-white border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
                <span className="text-sm font-bold text-amber-800 uppercase">Currently Pending</span>
                <div className="text-4xl sm:text-5xl font-extrabold text-amber-700 font-mono my-1">
                  {city.pending}
                </div>
                <span className="text-xs text-slate-500 font-semibold">in active municipal workflow</span>
              </div>

              <div className="bg-white border-2 border-red-300 rounded-2xl p-5 shadow-sm">
                <span className="text-sm font-bold text-red-800 uppercase">SLA Overdue</span>
                <div className="text-4xl sm:text-5xl font-extrabold text-red-700 font-mono my-1">
                  {city.overdue}
                </div>
                <span className="text-xs text-slate-500 font-semibold">past resolution deadline</span>
              </div>
            </div>
          </div>
        )}

        {/* 4 Department Cards Grid */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isTa ? "நகராட்சி துறைகள் மற்றும் பொறுப்பாளர்கள்" : "Municipal Departments & Jurisdictions"}
              </h2>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">
                {isTa
                  ? "துறையின் விரிவான புகார்கள் மற்றும் வரைபடத்தைக் காண 'Open' பொத்தானை அழுத்தவும்"
                  : "Click 'Open' to inspect department-specific grievances, map locations, and work orders"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats?.departments.map((dept) => {
              const info = DEPARTMENTS[dept.slug];
              const title = isTa && info ? info.name_ta : dept.department_name;

              return (
                <div
                  key={dept.slug}
                  className="bg-white border-2 border-slate-200 hover:border-emerald-600 rounded-3xl p-6 sm:p-7 shadow-sm transition-all flex flex-col justify-between space-y-6"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        JURISDICTION: {dept.slug.toUpperCase()}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                        {title}
                      </h3>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1.5 inline-block">
                        Officer Incharge: @{info?.incharge_username || dept.slug}
                      </span>
                    </div>

                    <Link
                      href={`/officer/department/${dept.slug}`}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <span>Open Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* 4 Numbers Grid inside the card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 uppercase block">Registered</span>
                      <span className="text-2xl font-extrabold text-slate-900 font-mono block mt-1">
                        {dept.overall_registered}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">from {dept.total_reports} reports</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-emerald-700 uppercase block">Solved</span>
                      <span className="text-2xl font-extrabold text-emerald-700 font-mono block mt-1">
                        {dept.total_solved}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{dept.resolution_rate_pct}% rate</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-blue-700 uppercase block">Today</span>
                      <span className="text-2xl font-extrabold text-blue-700 font-mono block mt-1">
                        {dept.today_received}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">IST day</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-amber-700 uppercase block">Pending</span>
                      <span className="text-2xl font-extrabold text-amber-700 font-mono block mt-1">
                        {dept.pending}
                      </span>
                      <span className="text-[11px] text-red-500 font-bold block mt-0.5">
                        {dept.overdue > 0 ? `${dept.overdue} overdue` : "0 overdue"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 mt-12">
        <span>CivicTwin Autonomous Collective • Built with FastAPI & Next.js 14</span>
      </footer>
    </div>
  );
}
