"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { CitizenPortal } from "../../components/CitizenPortal";
import { LanguageToggle } from "../../components/LanguageToggle";
import { ArrowLeft, LogOut } from "lucide-react";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout, t } = useAuth();
  const categoryParam = searchParams.get("category") || undefined;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (user.role !== "citizen") {
        router.push("/officer");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xl font-black text-emerald-800 tracking-tight">CivicTwin</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {user?.name && (
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400 font-medium">Citizen:</span>
                <span className="font-bold text-slate-900">{user.name}</span>
              </div>
            )}
            <LanguageToggle />
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-700 text-sm font-semibold transition-colors shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Report Flow - Full 1440px Canvas */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CitizenPortal initialCategory={categoryParam} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-sm text-slate-500">
        <span>CivicTwin Autonomous Collective • Built with FastAPI & Next.js 14</span>
      </footer>
    </div>
  );
}

export default function ReportPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ReportContent />
    </React.Suspense>
  );
}

