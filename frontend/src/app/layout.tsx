import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicTwin - Autonomous Civic Issue Verification Platform",
  description: "Multi-Agent Collective for Autonomous Civic Grievance Verification",
};

import { AuthProvider } from "../context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
