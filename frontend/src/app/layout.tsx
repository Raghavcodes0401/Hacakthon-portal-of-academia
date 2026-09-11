import "./globals.css";
import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export const metadata = {
  title: "SETU — Structural Education Transformation Union | Govt. of India",
  description: "National AI-Powered Ecosystem connecting Students, Faculty, Higher Education Institutions, and Industry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
