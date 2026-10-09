"use client";

import React from "react";
import { Cpu, ShieldCheck, Smartphone } from "lucide-react";

interface NavbarProps {
  activeTab: "citizen" | "officer";
  setActiveTab: (tab: "citizen" | "officer") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-emerald-200 sticky top-0 z-50 px-4 sm:px-8 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Animated Green Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🏙️</span>
            <span className="bg-gradient-to-r from-emerald-700 via-teal-700 to-green-600 bg-clip-text text-transparent font-black tracking-tight text-2xl sm:text-3xl">
              DIGITAL TWIN
            </span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)] animate-pulse">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>5 AGENTS OPERATIONAL</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 border border-slate-300 p-1.5 rounded-2xl shadow-inner">
          <button
            onClick={() => setActiveTab("citizen")}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-sm sm:text-base font-bold rounded-xl transition-all duration-200 ${
              activeTab === "citizen"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-slate-700 hover:text-emerald-800 hover:bg-white"
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span>📱 Citizen Vernacular Portal</span>
          </button>

          <button
            onClick={() => setActiveTab("officer")}
            className={`flex items-center gap-2.5 px-5 py-2.5 text-sm sm:text-base font-bold rounded-xl transition-all duration-200 ${
              activeTab === "officer"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-slate-700 hover:text-emerald-800 hover:bg-white"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>🛡️ Municipal Command Center</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
