"use client";

import React, { useEffect, useState } from "react";
import { getAnalyticsStats } from "../lib/api";
import { AnalyticsStats } from "../types";
import { AlertOctagon, CheckCircle2, Layers, MessageSquare } from "lucide-react";

export const StatsOverview: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats>({
    total_complaints: 0,
    active_clusters: 0,
    verified_closures: 0,
    fraud_prevented_count: 0,
    duplicate_reduction_pct: 0.0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await getAnalyticsStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load analytics stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Tile 1: Total Complaints */}
        <div className="bg-white border-2 border-emerald-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">
              Total Complaints Registered
            </span>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {loading ? "..." : stats.total_complaints}
            </span>
            <span className="text-sm text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              Submissions
            </span>
          </div>
        </div>

        {/* Tile 2: Duplicate Reduction */}
        <div className="bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/50 border-2 border-emerald-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
              Duplicate Backlog Eliminated
            </span>
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl sm:text-5xl font-black text-emerald-700 tracking-tight">
              {loading ? "..." : `${stats.duplicate_reduction_pct}%`}
            </span>
            <p className="text-xs sm:text-sm text-emerald-900 font-bold mt-1">
              ⚡ Redundant Load Saved via Spatial Clustering
            </p>
          </div>
        </div>

        {/* Tile 3: Fraud Prevented (Rose Warning Badge) */}
        <div className="bg-white border-2 border-rose-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-rose-900 uppercase tracking-wider">
              Ghost Closures Intercepted
            </span>
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-600 animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl sm:text-5xl font-black text-rose-600 tracking-tight">
              {loading ? "..." : stats.fraud_prevented_count}
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-xs font-black">
              AGENT 5 INTERCEPTED
            </span>
          </div>
        </div>

        {/* Tile 4: Verified Closures (Emerald Badge) */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-100 uppercase tracking-wider">
              Verified Physical Resolutions
            </span>
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {loading ? "..." : stats.verified_closures}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/25 text-white text-xs font-black backdrop-blur">
              100% GROUND TRUTH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
