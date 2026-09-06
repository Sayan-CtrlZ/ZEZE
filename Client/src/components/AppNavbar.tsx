"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  GraduationCap,
  User,
  LogOut,
  Sparkles,
} from "lucide-react";
import { signOutFirebaseUser } from "@/lib/firebase";

export interface RoleConfig {
  id: "clinician" | "trainee" | "patient";
  title: string;
  badge: string;
  badgeBg: string;
  badgeBorder: string;
  accentBg: string;
  icon: typeof Stethoscope;
}

export const ROLES: RoleConfig[] = [
  {
    id: "clinician",
    title: "Clinician / Doctor",
    badge: "Clinical DSS",
    badgeBg: "bg-blue-100/90 text-blue-900",
    badgeBorder: "border-blue-300/80",
    accentBg: "#2563eb",
    icon: Stethoscope,
  },
  {
    id: "trainee",
    title: "Healthcare Trainee / Student",
    badge: "Supervised Learning",
    badgeBg: "bg-purple-100/90 text-purple-900",
    badgeBorder: "border-purple-300/80",
    accentBg: "#7c3aed",
    icon: GraduationCap,
  },
  {
    id: "patient",
    title: "Patient / General User",
    badge: "Health Guidance",
    badgeBg: "bg-teal-100/90 text-teal-900",
    badgeBorder: "border-teal-300/80",
    accentBg: "#0d9488",
    icon: User,
  },
];

interface AppNavbarProps {
  currentRole?: string;
  currentMode?: "upload" | "manual";
  onRoleChange?: (role: string) => void;
  onModeChange?: (mode: "upload" | "manual") => void;
  pageType?: "assessment" | "result" | "profile";
  pageTitle?: string;
  isLocked?: boolean;
}

export default function AppNavbar({
  currentRole = "clinician",
  pageType,
  pageTitle,
  isLocked = false,
}: AppNavbarProps) {
  const router = useRouter();

  // Normalize role
  const normalizedRole =
    currentRole === "practitioner"
      ? "clinician"
      : (currentRole as "clinician" | "trainee" | "patient");

  const activeRoleConfig =
    ROLES.find((r) => r.id === normalizedRole) || ROLES[0];
  const ActiveIcon = activeRoleConfig.icon;

  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawUser = sessionStorage.getItem("zeze_user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed?.name) {
            setProfileName(parsed.name);
            return;
          }
        }
        const rawProfile = sessionStorage.getItem("zeze_profile");
        if (rawProfile) {
          const parsed = JSON.parse(rawProfile);
          if (parsed?.name) {
            setProfileName(parsed.name);
            return;
          }
        }
      } catch {
        // ignore
      }

      // Default fallback by role if no stored session name
      if (normalizedRole === "clinician") {
        setProfileName("Dr. Sarah Jenkins, MD");
      } else if (normalizedRole === "trainee") {
        setProfileName("Alex Rivera");
      } else {
        setProfileName("John Doe");
      }
    }
  }, [normalizedRole]);

  const handleSignOut = () => {
    signOutFirebaseUser().catch((err) => console.warn("[Auth] Firebase signOut error:", err));
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("zeze_user");
      sessionStorage.removeItem("zeze_profile");
      sessionStorage.removeItem("zeze_selected_role");
      sessionStorage.removeItem("zeze_form_data");
    }
    router.push("/");
  };

  // Determine dynamic page-aware title & subtitle
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    if (pageType === "result") {
      if (normalizedRole === "clinician") return "Clinical Results Dashboard";
      if (normalizedRole === "trainee") return "Supervised Learning Dashboard";
      return "Health Results Dashboard";
    }
    if (pageType === "profile") {
      return "Practitioner Profile & Credentials";
    }
    // Default / assessment
    if (normalizedRole === "clinician") return "Clinical Decision Support";
    if (normalizedRole === "trainee") return "Supervised Learning Workspace";
    return "Health Guidance Workspace";
  };

  const resolvedPageTitle = getPageTitle();

  return (
    <nav className={`w-full relative z-40 ${pageType === "profile" ? "mb-2 sm:mb-3" : "mb-5 sm:mb-6"}`}>
      {/* Floating Glass-Neumorphic Pill Bar (.neu-pill-nav) */}
      <div className="w-full neu-pill-nav py-3 px-4 sm:px-7 flex items-center justify-between gap-3 sm:gap-4 transition-all">
        {/* LEFT: Logo & Page-Aware Heading */}
        {isLocked ? (
          <div className="flex items-center gap-3 shrink-0 cursor-not-allowed opacity-90">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl neu-flat flex items-center justify-center p-2 bg-[#edf3f9] border border-white/80 shadow-sm shrink-0">
              <img src="/icon.webp" alt="ZEZE" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-[#0a192f] leading-tight">
                ZEZE MED AI
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-700 uppercase tracking-wider leading-none mt-0.5">
                Profile Setup Mode (Locked)
              </span>
            </div>
          </div>
        ) : (
          <Link
            href={`/assessment?role=${normalizedRole}`}
            className="flex items-center gap-3 group cursor-pointer shrink-0"
          >
            {/* Neumorphic 3D medallion */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl neu-flat flex items-center justify-center p-2 bg-[#edf3f9] border border-white/80 shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <img src="/icon.webp" alt="ZEZE" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-[#0a192f] leading-tight">
                ZEZE MED AI
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-blue-800 uppercase tracking-wider leading-none mt-0.5">
                {resolvedPageTitle}
              </span>
            </div>
          </Link>
        )}

        {/* RIGHT: Profile Icon (links to /profile) + Log Out */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Profile Icon Button -> links to /profile */}
          <Link
            href="/profile"
            title={`View Profile: ${profileName || activeRoleConfig.title}`}
            className="neu-button-secondary inline-flex items-center gap-2.5 px-3 sm:px-4 py-2 text-slate-800 transition-all active:scale-95 group"
          >
            {/* Avatar Icon Well with role accent */}
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0"
              style={{ backgroundColor: activeRoleConfig.accentBg }}
            >
              <ActiveIcon className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
            </div>

            {/* Profile Name & Badge */}
            <div className="hidden sm:flex flex-col text-left min-w-0 pr-0.5">
              <span className="text-xs font-black text-[#0a192f] truncate max-w-[140px] leading-tight">
                {profileName || "My Profile"}
              </span>
              <span className="text-[9px] font-extrabold text-blue-800 uppercase tracking-wider leading-tight mt-0.5">
                {activeRoleConfig.badge}
              </span>
            </div>
          </Link>

          {/* Log Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Log Out"
            className="neu-button-secondary inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-slate-700 hover:text-rose-700 text-xs sm:text-sm font-black transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-600 hover:text-rose-600 shrink-0" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
