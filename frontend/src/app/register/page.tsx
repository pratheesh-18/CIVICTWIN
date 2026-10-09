"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { LanguageToggle } from "../../components/LanguageToggle";
import { OtpInput } from "../../components/OtpInput";
import { maskPhone } from "../../lib/api";
import { AlertCircle, ArrowRight, RotateCw, CheckCircle2 } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, t, register, loginAsCitizen } = useAuth();

  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const prefillPhone = searchParams.get("phone");
    if (prefillPhone) {
      setPhone(prefillPhone.replace(/\D/g, "").slice(0, 10));
    }
  }, [searchParams]);

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

  // Resend Countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg(t.errorInvalidName);
      return;
    }

    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) {
      setErrorMsg(t.errorInvalidPhone);
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), clean);
      setStep("otp");
      setResendTimer(30);
      setOtpCode("");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Registration failed. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpCode.length !== 6) {
      setErrorMsg(t.errorInvalidOtp);
      return;
    }

    setSubmitting(true);
    try {
      const clean = phone.replace(/\D/g, "");
      await loginAsCitizen(clean, otpCode);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Invalid verification code.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
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
          <Link href="/" className="text-2xl font-black text-emerald-800 tracking-tight hover:opacity-90">
            Digital Twin
          </Link>
          <LanguageToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.registerHeading}</h1>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{t.registerSubheading}</p>
          </div>

          {step === "details" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="regName" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  {t.fullNameLabel}
                </label>
                <input
                  id="regName"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label htmlFor="regPhone" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  {t.mobileLabel}
                </label>
                <div className="relative flex rounded-xl border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <span className="inline-flex items-center px-3.5 border-r border-slate-200 text-sm font-bold text-slate-600 bg-slate-50 rounded-l-xl">
                    +91
                  </span>
                  <input
                    id="regPhone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setErrorMsg(null);
                    }}
                    placeholder={t.mobilePlaceholder}
                    className="w-full px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none text-base rounded-r-xl"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{t.mobileHelp}</p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !name.trim() || phone.length !== 10}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>{t.sendingOtp}</span>
                ) : (
                  <>
                    <span>{t.registerAndSendOtp}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* OTP VERIFICATION */
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-800">
                    {t.otpLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("details");
                      setErrorMsg(null);
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Change ({maskPhone(phone)})
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-2">
                  {t.otpHelp} <strong className="text-slate-800">+91 {maskPhone(phone)}</strong>
                </p>

                <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <span>Demo Code: <strong className="font-mono font-bold text-sm tracking-wider">123456</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode("123456")}
                    className="px-2 py-0.5 bg-white border border-emerald-300 hover:bg-emerald-100 rounded text-xs font-bold text-emerald-800 transition-colors shadow-2xs"
                  >
                    Auto-Fill Code
                  </button>
                </div>

                <OtpInput value={otpCode} onChange={setOtpCode} disabled={submitting} />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || otpCode.length !== 6}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? <span>{t.verifying}</span> : <span>{t.verifyAndLogin}</span>}
              </button>

              <div className="text-center pt-2">
                {resendTimer > 0 ? (
                  <span className="text-xs text-slate-500">
                    {t.resendCooldown} <strong>{resendTimer}{t.seconds}</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={submitting}
                    className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{t.resendOtp}</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Link to Login */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center text-sm text-slate-600">
            <span>{t.registeredAlready} </span>
            <Link
              href="/"
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              {t.loginLink}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <span>CivicTwin Autonomous Collective • Built with FastAPI & Next.js 14</span>
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <RegisterContent />
    </React.Suspense>
  );
}

