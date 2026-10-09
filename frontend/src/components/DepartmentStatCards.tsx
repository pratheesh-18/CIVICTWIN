"use client";

import React from "react";
import { DepartmentStatCards as StatCardsType } from "../types";
import { useAuth } from "../context/AuthContext";
import { FileText, CheckCircle2, Calendar, Clock, AlertTriangle } from "lucide-react";

interface Props {
  stats: StatCardsType;
  loading?: boolean;
}

export const DepartmentStatCardsRow: React.FC<Props> = ({ stats, loading }) => {
  const { language } = useAuth();
  const isTa = language === "ta";

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 w-full">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-[148px] bg-white border border-slate-200 rounded-2xl animate-pulse p-5 sm:p-6 box-border"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: "overall",
      number: stats.overall_registered,
      label_en: "Overall Registered",
      label_ta: "மொத்தப் புகார்கள்",
      sub_en: `from ${stats.total_reports} citizen reports`,
      sub_ta: `${stats.total_reports} மக்கள் மனுக்களிலிருந்து`,
      border: "border-slate-200",
      numColor: "text-slate-900",
      icon: <FileText className="w-5 h-5 text-slate-600" />,
    },
    {
      id: "solved",
      number: stats.total_solved,
      label_en: "Total Solved",
      label_ta: "தீர்க்கப்பட்டவை",
      sub_en: `${stats.resolution_rate_pct}% resolution rate`,
      sub_ta: `${stats.resolution_rate_pct}% தீர்வு விகிதம்`,
      border: "border-slate-200",
      numColor: "text-emerald-700",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: "today",
      number: stats.today_received,
      label_en: "Received Today",
      label_ta: "இன்று வந்தவை",
      sub_en: "IST calendar (00:00 - 23:59)",
      sub_ta: "இன்றைய பதிவு (00:00 - 23:59)",
      border: "border-slate-200",
      numColor: "text-blue-700",
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
    },
    {
      id: "pending",
      number: stats.pending,
      label_en: "Currently Pending",
      label_ta: "நிலுவையில் உள்ளவை",
      sub_en: "in progress / active queue",
      sub_ta: "நடவடிக்கையில் உள்ளவை",
      border: "border-slate-200",
      numColor: "text-amber-700",
      icon: <Clock className="w-5 h-5 text-amber-600" />,
    },
    {
      id: "overdue",
      number: stats.overdue,
      label_en: "SLA Overdue",
      label_ta: "காலக்கெடு கடந்தவை",
      sub_en: "past jurisdictional SLA target",
      sub_ta: "இலக்கு காலக்கெடுவை தாண்டியவை",
      border: stats.overdue > 0 ? "border-red-300 bg-red-50/30" : "border-slate-200",
      numColor: stats.overdue > 0 ? "text-red-700" : "text-slate-700",
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 w-full">
      {cards.map((c) => (
        <div
          key={c.id}
          className={`bg-white border ${c.border} rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[148px] h-full box-border transition-all`}
        >
          {/* Top row: Label + Icon */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm sm:text-base font-bold text-slate-700 truncate leading-snug">
              {isTa ? c.label_ta : c.label_en}
            </span>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
              {c.icon}
            </div>
          </div>

          {/* Big Number: 40-48px (text-4xl is 36px, text-[42px] is 42px) */}
          <div className="my-2">
            <span className={`text-[42px] font-extrabold tracking-tight font-mono leading-none ${c.numColor}`}>
              {c.number}
            </span>
          </div>

          {/* Supporting line */}
          <div className="pt-2 border-t border-slate-100 mt-auto">
            <span className="text-xs sm:text-sm font-medium text-slate-500 truncate block">
              {isTa ? c.sub_ta : c.sub_en}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
