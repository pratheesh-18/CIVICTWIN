"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { Globe } from "lucide-react";

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { language, setLanguage, t } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ta" : "en");
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-white text-slate-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors shadow-sm ${className}`}
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5 text-emerald-600" />
      <span>{language === "en" ? "தமிழ்" : "English"}</span>
    </button>
  );
};
