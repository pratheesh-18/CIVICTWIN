"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import {
  getMe,
  logoutUser,
  verifyOtp,
  loginDepartment,
  registerCitizen,
  loginCitizen,
  setAuthToken,
  clearAuthToken,
} from "../lib/api";
import { Language, translations } from "../lib/translations";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  loginAsCitizen: (phone: string, code?: string) => Promise<User>;
  loginAsDepartment: (username: string, password: string) => Promise<User>;
  register: (name: string, phone: string) => Promise<{ success: boolean; phone: string; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>("en");
  const router = useRouter();

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem("civictwin_lang") as Language;
    if (savedLang === "ta" || savedLang === "en") {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("civictwin_lang", lang);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginAsCitizen = async (phone: string, code?: string) => {
    let res;
    if (code) {
      res = await verifyOtp(phone, code);
    } else {
      res = await loginCitizen(phone);
    }
    if (res?.token) {
      setAuthToken(res.token);
    }
    setUser(res.user);
    return res.user;
  };

  const loginAsDepartment = async (username: string, password: string) => {
    const res = await loginDepartment(username, password);
    if (res?.token) {
      setAuthToken(res.token);
    }
    setUser(res.user);
    return res.user;
  };

  const register = async (name: string, phone: string) => {
    return await registerCitizen(name, phone);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      clearAuthToken();
      setUser(null);
      router.push("/");
    }
  };

  const t = translations[language];

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        language,
        setLanguage,
        t,
        loginAsCitizen,
        loginAsDepartment,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
