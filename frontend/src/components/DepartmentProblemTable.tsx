"use client";

import React, { useEffect, useRef } from "react";
import { DepartmentProblemItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { getTierBadge } from "../lib/definitions";
import {
  MapPin,
  Clock,
  UserCheck,
  Layers,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";

interface Props {
  problems: DepartmentProblemItem[];
  selectedProblem: DepartmentProblemItem | null;
  onSelectProblem: (problem: DepartmentProblemItem) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  tierFilter: string;
  setTierFilter: (t: string) => void;
  loading?: boolean;
}

export const DepartmentProblemTable: React.FC<Props> = ({
  problems,
  selectedProblem,
  onSelectProblem,
  statusFilter,
  setStatusFilter,
  tierFilter,
  setTierFilter,
  loading,
}) => {
  const { language } = useAuth();
  const isTa = language === "ta";
  const tableRef = useRef<HTMLTableElement>(null);

  // Keyboard navigation: ArrowUp, ArrowDown, Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!problems.length) return;

      const currentIndex = selectedProblem
        ? problems.findIndex((p) => p.id === selectedProblem.id)
        : -1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex < problems.length - 1 ? currentIndex + 1 : 0;
        onSelectProblem(problems[nextIndex]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : problems.length - 1;
        onSelectProblem(problems[prevIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [problems, selectedProblem, onSelectProblem]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full box-border">
      {/* Table Controls & Filter Strip */}
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col gap-3 box-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {isTa ? "துறை பயனர் புகார்கள் பட்டியல்" : "Department User Grievances & Problems Queue"}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
              {problems.length} {isTa ? "புகார்கள்" : "Problems"}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {isTa
              ? "முன்னுரிமை: அடுக்கு 1 • அதிக மதிப்பீடு • குறைந்த SLA"
              : "Sorted by: Tier 1 first • High score • SLA due soonest"}
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Status Filter */}
          <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 text-xs font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "pending"
                  ? "bg-amber-100 text-amber-900 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isTa ? "நிலுவையில்" : "Pending"}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("resolved")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "resolved"
                  ? "bg-emerald-100 text-emerald-900 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isTa ? "தீர்க்கப்பட்டவை" : "Resolved"}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-slate-200 text-slate-900 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isTa ? "அனைத்தும்" : "All"}
            </button>
          </div>

          {/* Tier Filter */}
          <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 text-xs font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => setTierFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                tierFilter === "all" ? "bg-slate-200 text-slate-900 font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Tiers
            </button>
            <button
              type="button"
              onClick={() => setTierFilter("1")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                tierFilter === "1" ? "bg-red-100 text-red-900 font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tier 1
            </button>
            <button
              type="button"
              onClick={() => setTierFilter("2")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                tierFilter === "2" ? "bg-amber-100 text-amber-900 font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tier 2
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto w-full max-h-[640px] overflow-y-auto">
        <table ref={tableRef} className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-xs font-extrabold uppercase tracking-wider sticky top-0 z-20">
              <th className="py-3 px-3 w-14 text-center">Rank</th>
              <th className="py-3 px-3 min-w-[220px]">Problem & Citizen Statement</th>
              <th className="py-3 px-3 w-24 text-center">Hazard Tier</th>
              <th className="py-3 px-3 w-20 text-center">Priority</th>
              <th className="py-3 px-3 w-28">Location</th>
              <th className="py-3 px-3 w-28">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm font-medium">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-semibold animate-pulse">
                  Loading department priority queue...
                </td>
              </tr>
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-semibold">
                  No problems found matching this filter in this department today.
                </td>
              </tr>
            ) : (
              problems.map((p) => {
                const isSelected = selectedProblem?.id === p.id;
                const tier = getTierBadge(p.priority_score);
                const isSolved =
                  p.status.toUpperCase() === "VERIFIED" ||
                  p.status.toUpperCase() === "CLOSED" ||
                  p.status.toUpperCase() === "RESOLVED";

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProblem(p)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSelectProblem(p);
                    }}
                    className={`min-h-[56px] transition-all cursor-pointer outline-none ${
                      isSelected
                        ? "bg-emerald-50 font-semibold text-slate-950 border-l-4 border-l-emerald-600"
                        : "hover:bg-slate-50/80 text-slate-800 border-l-4 border-l-transparent"
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-600 text-xs">
                      #{p.rank}
                    </td>

                    {/* Problem & Citizen Statement */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1 max-w-[260px] sm:max-w-[340px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-sm leading-snug break-words">
                            {p.title}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                            <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate max-w-[80px]">{p.citizen_name}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 italic break-words line-clamp-2">
                          "{p.complaint_text}"
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-bold text-emerald-800">
                            ⚡ {p.report_count} reports merged
                          </span>
                          <span>• {p.age_text}</span>
                        </div>
                      </div>
                    </td>

                    {/* Hazard Tier */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${tier.badgeClass}`}>
                        {tier.tier}
                      </span>
                    </td>

                    {/* Priority Score */}
                    <td className="py-3.5 px-3 text-center font-mono font-extrabold text-sm text-slate-900">
                      {p.priority_score.toFixed(2)}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="leading-tight">
                          {p.latitude.toFixed(4)},<br />{p.longitude.toFixed(4)}
                        </span>
                      </div>
                    </td>

                    {/* SLA */}
                    <td className="py-3.5 px-3 text-xs">
                      {p.is_overdue ? (
                        <span className="font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Overdue</span>
                        </span>
                      ) : isSolved ? (
                        <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-block">
                          Solved
                        </span>
                      ) : (
                        <span className="font-bold text-slate-800 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{p.sla_remaining_hours}h left</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
