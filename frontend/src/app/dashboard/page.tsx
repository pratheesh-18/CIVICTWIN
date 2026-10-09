"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { LanguageToggle } from "../../components/LanguageToggle";
import { NotificationBell } from "../../components/NotificationBell";
import { getMyTickets, maskPhone } from "../../lib/api";
import { CitizenTicketItem, DepartmentTile } from "../../types";
import { getDefectFallbackImage, normalizeDefectImageUrl } from "../../lib/defectImages";
import {
  LogOut,
  MapPin,
  Clock,
  Layers,
  Car,
  Droplets,
  Zap,
  Trash2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  PlusCircle,
} from "lucide-react";

export default function CitizenDashboard() {
  const router = useRouter();
  const { user, loading, logout, t, language } = useAuth();

  const [tickets, setTickets] = useState<CitizenTicketItem[]>([]);
  const [fetchingTickets, setFetchingTickets] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");

  // Route guard
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (user.role !== "citizen") {
        router.push("/officer");
      }
    }
  }, [user, loading, router]);

  // Fetch Tickets
  const loadTickets = async () => {
    setFetchingTickets(true);
    try {
      const data = await getMyTickets();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setFetchingTickets(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "citizen") {
      loadTickets();
    }
  }, [user]);

  // Department Tiles Definition
  const departmentTiles: DepartmentTile[] = [
    {
      slug: "pothole",
      name_en: "Roads & Infrastructure",
      name_ta: "சாலைகள் & உள்கட்டமைப்பு",
      example_en: "Potholes, broken roads, damaged pavements",
      example_ta: "குழிகள், உடைந்த தார் சாலைகள், சேதமடைந்த நடைபாதைகள்",
      icon: "car",
    },
    {
      slug: "water_leak",
      name_en: "Water & Drainage",
      name_ta: "குடிநீர் & கழிவுநீர் வடிகால்",
      example_en: "Pipe leaks, dirty water, open drains",
      example_ta: "குடிநீர் குழாய் உடைப்பு, அசுத்த நீர், கழிவுநீர் பெருக்கெடுத்தல்",
      icon: "droplets",
    },
    {
      slug: "streetlight",
      name_en: "Electrical & Streetlights",
      name_ta: "மின்சாரம் & தெருவிளக்குகள்",
      example_en: "Streetlights not working, dangling wires",
      example_ta: "தெருவிளக்கு எரியவில்லை, தொங்கும் மின்கம்பிகள்",
      icon: "zap",
    },
    {
      slug: "garbage",
      name_en: "Sanitation & Waste",
      name_ta: "தூய்மைப் பணி & கழிவு மேலாண்மை",
      example_en: "Garbage overflow, uncollected waste bins",
      example_ta: "குப்பைத் தொட்டி நிரம்பி வழிதல், அள்ளப்படாத கழிவுகள்",
      icon: "trash",
    },
    {
      slug: "other",
      name_en: "Other Municipal Services",
      name_ta: "இதர நகராட்சி சேவைகள்",
      example_en: "Public park issues, civic hazards, street damage",
      example_ta: "பூங்கா பராமரிப்பு, பொது தொல்லைகள், தெரு சேதங்கள்",
      icon: "alert",
    },
  ];

  const renderDepartmentIcon = (icon: string) => {
    switch (icon) {
      case "car":
        return <Car className="w-6 h-6 text-emerald-700" />;
      case "droplets":
        return <Droplets className="w-6 h-6 text-sky-700" />;
      case "zap":
        return <Zap className="w-6 h-6 text-amber-600" />;
      case "trash":
        return <Trash2 className="w-6 h-6 text-emerald-700" />;
      default:
        return <AlertCircle className="w-6 h-6 text-slate-700" />;
    }
  };

  const filteredTickets = tickets.filter((tk) => {
    if (filter === "OPEN") return tk.status === "OPEN" || tk.status === "SUBMITTED" || tk.status === "IN_PROGRESS";
    if (filter === "RESOLVED") return tk.status === "VERIFIED" || tk.status === "RESOLVED";
    return true;
  });

  const openCount = tickets.filter(
    (tk) => tk.status === "OPEN" || tk.status === "SUBMITTED" || tk.status === "IN_PROGRESS"
  ).length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Top Bar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">DigitalTwin</span>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Citizen Portal
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <NotificationBell userRole="citizen" />
            <LanguageToggle />
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900">{user.name}</span>
              <span className="text-[11px] text-slate-500 font-mono">+91 {maskPhone(user.phone)}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-700 text-xs font-semibold transition-colors shadow-sm"
              title={t.logout}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* 2. Greeting & Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t.greeting}, {user.name}
            </h1>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {openCount > 0
                ? t.openComplaintsSummary.replace("{count}", openCount.toString())
                : t.noOpenComplaints}
            </p>
          </div>

          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Issue</span>
          </Link>
        </div>

        {/* 3. My Complaints Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">{t.myComplaintsTitle}</h2>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.filterAll} ({tickets.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("OPEN")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === "OPEN" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.filterOpen} ({openCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("RESOLVED")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filter === "RESOLVED" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.filterResolved} ({tickets.length - openCount})
              </button>
            </div>
          </div>

          {/* Complaints List / Cards */}
          {fetchingTickets ? (
            /* Loading Skeleton */
            <div className="space-y-3">
              {[1, 2, 3].map((sk) => (
                <div key={sk} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse p-4"></div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-600">{t.emptyComplaints}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((tk) => {
                const isVerified = tk.status === "VERIFIED" || tk.status === "RESOLVED";
                const isClustered = tk.cluster_report_count > 1;

                return (
                  <Link
                    key={tk.ticket_id}
                    href={`/ticket/${tk.ticket_id}`}
                    className="block bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Left: Thumbnail + Ticket Info */}
                      <div className="flex items-start gap-4">
                        <img
                          src={normalizeDefectImageUrl(tk.image_url, tk.category)}
                          alt={tk.category}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-100"
                          onError={(e) => {
                            e.currentTarget.src = getDefectFallbackImage(tk.category);
                          }}
                        />

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500">
                              #{tk.ticket_id}
                            </span>
                            <span className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {tk.category}
                            </span>
                            {/* Status Chip */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isVerified
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {tk.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-1 max-w-lg">
                            {tk.raw_text}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{tk.latitude.toFixed(4)}, {tk.longitude.toFixed(4)}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{new Date(tk.created_at).toLocaleDateString()}</span>
                            </span>
                            <span>• {tk.assigned_dept}</span>
                          </div>

                          {/* Merged Cluster Note */}
                          {isClustered && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-[11px] font-semibold text-emerald-800 border border-emerald-200 mt-1">
                              <Layers className="w-3 h-3 text-emerald-600" />
                              <span>{t.mergedNotice.replace("{count}", tk.cluster_report_count.toString())}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Arrow / Action */}
                      <div className="self-end sm:self-center shrink-0 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. "Report a Problem" Department Tiles (BELOW Complaints) */}
        <section className="space-y-4 pt-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t.reportSectionTitle}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {t.reportSectionSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentTiles.map((tile) => {
              const tileName = language === "ta" ? tile.name_ta : tile.name_en;
              const tileDesc = language === "ta" ? tile.example_ta : tile.example_en;

              return (
                <Link
                  key={tile.slug}
                  href={`/report?category=${tile.slug}`}
                  className="bg-white border-2 border-slate-200 hover:border-emerald-600 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:bg-emerald-50 group-hover:border-emerald-300 transition-colors">
                      {renderDepartmentIcon(tile.icon)}
                    </div>
                    <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Report &rarr;
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {tileName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {tileDesc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 mt-12">
        <span>CivicTwin Autonomous Collective • Built with FastAPI & Next.js 14</span>
      </footer>
    </div>
  );
}
