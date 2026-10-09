"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { LanguageToggle } from "../components/LanguageToggle";
import { ShieldCheck, Phone, AlertCircle, ArrowRight, UserCheck, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, t, loginAsCitizen, loginAsDepartment } = useAuth();

  // Tab State: "citizen" | "department"
  const [activeTab, setActiveTab] = useState<"citizen" | "department">("citizen");

  // Citizen Login State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [citizenLoading, setCitizenLoading] = useState(false);
  const [citizenError, setCitizenError] = useState<string | null>(null);
  const [isNotRegistered, setIsNotRegistered] = useState(false);

  // Department Login State
  const [deptUsername, setDeptUsername] = useState("");
  const [deptPassword, setDeptPassword] = useState("");
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "citizen") {
        router.push("/dashboard");
      } else {
        router.push("/officer");
      }
    }
  }, [user, loading, router]);

  // Handle Direct Citizen Login (No OTP required)
  const handleCitizenLogin = async (e?: React.FormEvent, overridePhone?: string) => {
    if (e) e.preventDefault();
    setCitizenError(null);
    setIsNotRegistered(false);

    const targetPhone = overridePhone || phoneNumber;
    const clean = targetPhone.replace(/\D/g, "");
    if (clean.length !== 10) {
      setCitizenError(t.errorInvalidPhone);
      return;
    }

    setCitizenLoading(true);
    try {
      await loginAsCitizen(clean);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "";
      if (err.response?.status === 404 || msg.toLowerCase().includes("not registered")) {
        setIsNotRegistered(true);
        setCitizenError(t.errorUnregistered);
      } else {
        setCitizenError(msg || "Failed to sign in. Please try again.");
      }
    } finally {
      setCitizenLoading(false);
    }
  };

  // Handle Department Login
  const handleDepartmentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError(null);

    if (!deptUsername.trim() || !deptPassword.trim()) {
      setDeptError("Please enter both departmental username and password.");
      return;
    }

    setDeptLoading(true);
    try {
      await loginAsDepartment(deptUsername, deptPassword);
      router.push("/officer");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Invalid departmental credentials.";
      setDeptError(msg);
    } finally {
      setDeptLoading(false);
    }
  };

  // Demo shortcut for citizens
  const fillDemoCitizen = (phone: string) => {
    setPhoneNumber(phone);
    setCitizenError(null);
    setIsNotRegistered(false);
    handleCitizenLogin(undefined, phone);
  };

  // Demo shortcut for officers
  const fillDemoOfficer = (username: string) => {
    setDeptUsername(username);
    setDeptPassword("CivicAdmin@2026");
    setDeptError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">Digital Twin</span>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {t.operationalBadge}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.loginHeading}</h1>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{t.loginSubheading}</p>
          </div>

          {/* Role Tabs */}
          <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-100 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("citizen");
                setCitizenError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === "citizen"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.citizenTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("department");
                setDeptError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === "department"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.departmentTab}
            </button>
          </div>

          {/* CITIZEN TAB - DIRECT LOGIN (NO OTP) */}
          {activeTab === "citizen" && (
            <div>
              <form onSubmit={handleCitizenLogin} className="space-y-4">
                <div>
                  <label htmlFor="mobileInput" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    {t.mobileLabel}
                  </label>
                  <div className="relative flex rounded-xl border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <span className="inline-flex items-center px-3.5 border-r border-slate-200 text-sm font-bold text-slate-600 bg-slate-50 rounded-l-xl">
                      +91
                    </span>
                    <input
                      id="mobileInput"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      required
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setCitizenError(null);
                        setIsNotRegistered(false);
                      }}
                      placeholder={t.mobilePlaceholder}
                      className="w-full px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none text-base rounded-r-xl"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Direct sign-in using your registered 10-digit mobile number.
                  </p>
                </div>

                {citizenError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <span>{citizenError}</span>
                      {isNotRegistered && (
                        <div className="mt-1.5">
                          <Link
                            href={`/register?phone=${phoneNumber}`}
                            className="font-bold underline text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1"
                          >
                            <span>{t.registerLink}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={citizenLoading || phoneNumber.length !== 10}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                >
                  {citizenLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>{t.signInCitizen || "Sign In as Citizen"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Citizen Quick-Fill */}
              

              {/* Link to Register */}
              <div className="mt-5 pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
                <span>{t.newHere} </span>
                <Link
                  href="/register"
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  {t.registerLink}
                </Link>
              </div>
            </div>
          )}

          {/* DEPARTMENT TAB */}
          {activeTab === "department" && (
            <form onSubmit={handleDepartmentLogin} className="space-y-4">
              <div>
                <label htmlFor="deptUser" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  {t.usernameLabel}
                </label>
                <input
                  id="deptUser"
                  type="text"
                  required
                  value={deptUsername}
                  onChange={(e) => {
                    setDeptUsername(e.target.value);
                    setDeptError(null);
                  }}
                  placeholder={t.usernamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label htmlFor="deptPass" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  {t.passwordLabel}
                </label>
                <input
                  id="deptPass"
                  type="password"
                  required
                  value={deptPassword}
                  onChange={(e) => {
                    setDeptPassword(e.target.value);
                    setDeptError(null);
                  }}
                  placeholder={t.passwordPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm transition-all"
                />
              </div>

              {deptError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <span>{deptError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={deptLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-700 hover:bg-emerald-800 text-white transition-colors focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-300 shadow-sm flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{deptLoading ? "Signing in..." : t.departmentLoginBtn}</span>
              </button>

              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-700">Quick Fill Demo Officers:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillDemoOfficer("roads_officer")}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 rounded font-mono"
                  >
                    roads_officer
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoOfficer("commissioner")}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 rounded font-mono"
                  >
                    commissioner
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoOfficer("water_officer")}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 rounded font-mono"
                  >
                    water_officer
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Password: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">CivicAdmin@2026</code>
                </p>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <span>CivicTwin Autonomous Collective • Built with FastAPI & Next.js 14</span>
      </footer>
    </div>
  );
}
