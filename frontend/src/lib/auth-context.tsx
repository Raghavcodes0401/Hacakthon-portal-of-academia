"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "./api-client";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "STUDENT" | "FACULTY" | "INSTITUTION_ADMIN" | "INDUSTRY_USER" | "PLATFORM_ADMIN";
  organization_id?: string;
  organization_name?: string;
  organization_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (role: "STUDENT" | "FACULTY" | "INSTITUTION_ADMIN" | "INDUSTRY_USER" | "PLATFORM_ADMIN") => Promise<void>;
}

const DEMO_ACCOUNTS: Record<string, { email: string; pass: string }> = {
  STUDENT: { email: "rahul.sharma@student.iitd.ac.in", pass: "Password123!" },
  FACULTY: { email: "dr.sharma@iitd.ac.in", pass: "Password123!" },
  INSTITUTION_ADMIN: { email: "admin@iitd.ac.in", pass: "Password123!" },
  INDUSTRY_USER: { email: "recruiter@tata-research.com", pass: "Password123!" },
  PLATFORM_ADMIN: { email: "admin@ecosystem.gov.in", pass: "Password123!" },
};

const ROLE_ROUTES: Record<string, string> = {
  STUDENT: "/student/dashboard",
  FACULTY: "/faculty/dashboard",
  INSTITUTION_ADMIN: "/institution/dashboard",
  INDUSTRY_USER: "/industry/dashboard",
  PLATFORM_ADMIN: "/admin/dashboard",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string = "Password123!") => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);

      const targetRoute = ROLE_ROUTES[res.user.role] || "/";
      router.push(targetRoute);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/register", data);
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);

      if (res.user.role === "STUDENT") {
        router.push("/student/assessment?onboarding=true");
      } else {
        const targetRoute = ROLE_ROUTES[res.user.role] || "/";
        router.push(targetRoute);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const switchRoleQuick = async (role: keyof typeof DEMO_ACCOUNTS) => {
    const creds = DEMO_ACCOUNTS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchRoleQuick,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
