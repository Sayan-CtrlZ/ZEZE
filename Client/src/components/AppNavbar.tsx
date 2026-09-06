"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  GraduationCap,
  User,
} from "lucide-react";

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
  pageType?: "assessment" | "result" | "profile" | "drugs";
  pageTitle?: string;
  isLocked?: boolean;
}

export default function AppNavbar({
  currentRole = "clinician",
  onRoleChange,
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

  // Determine dynamic page-aware title & subtitle
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    if (pageType === "drugs") {
      return "Authoritative Drug Intelligence";
    }
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



        {/* RIGHT: Current Active Role Badge & Change Role Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl neu-inset bg-white/70 shadow-inner">
            <div
              className="w-6 h-6 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: activeRoleConfig.accentBg }}
            >
              <ActiveIcon className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] sm:text-xs font-black text-[#0a192f] leading-tight">
                {activeRoleConfig.title.split("/")[0].trim()}
              </span>
              <span className="text-[9px] font-extrabold text-blue-800 uppercase tracking-wider leading-none">
                {activeRoleConfig.badge}
              </span>
            </div>
          </div>

          <Link
            href="/select-role"
            title="Switch Workspace Role"
            className="neu-button-secondary px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-black text-slate-700 hover:text-blue-700 transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1.5"
          >
            <span>Change Role</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
