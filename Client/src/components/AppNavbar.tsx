"use client";

import React from "react";
import Link from "next/link";
import {
  Stethoscope,
  GraduationCap,
  User,
  Activity,
  Pill,
  Sparkles,
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
  pageType?: "landing" | "assessment" | "result" | "profile" | "drugs";
  pageTitle?: string;
  isLocked?: boolean;
}

export default function AppNavbar({
  currentRole = "clinician",
  pageType = "assessment",
  isLocked = false,
}: AppNavbarProps) {
  // Normalize role
  const normalizedRole =
    currentRole === "practitioner"
      ? "clinician"
      : (currentRole as "clinician" | "trainee" | "patient");

  const activeRoleConfig =
    ROLES.find((r) => r.id === normalizedRole) || ROLES[0];
  const ActiveIcon = activeRoleConfig.icon;

  const isLanding = pageType === "landing";

  const [hasActiveResult, setHasActiveResult] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("zeze_result");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.risk !== undefined || parsed.probability !== undefined)) {
            setHasActiveResult(true);
          }
        } catch (e) {}
      }
    }
  }, [pageType]);

  const isAssessmentActive = pageType === "assessment" || pageType === "result";
  const assessmentHref = hasActiveResult ? "/result" : `/assessment?role=${normalizedRole}`;

  return (
    <header
      className={`w-full ${
        isLanding
          ? "max-w-6xl 2xl:max-w-7xl mx-auto mb-8 sm:mb-12"
          : "w-full mb-5 sm:mb-8"
      } neu-pill-nav py-2.5 sm:py-3 px-3.5 sm:px-8 flex items-center justify-between z-30 sticky top-3 sm:top-4 bg-white/90 backdrop-blur-md min-h-[64px] transition-all`}
    >
      {/* 1. LEFT: Brand Logo with Medallion (Exact Same as Landing Page) */}
      <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl neu-inset flex items-center justify-center text-blue-700 bg-white/70 group-hover:scale-105 transition-transform shrink-0">
          <img src="/icon.webp" alt="ZEZE" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
            ZEZE
          </span>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-blue-700 px-2 py-0.5 rounded-full neu-inset-sm">
            MED AI
          </span>
        </div>
      </Link>

      {/* 2. CENTER: Navigation Links */}
      {isLanding ? (
        /* Landing Page Center Navigation */
        <nav className="hidden md:flex items-center gap-7 text-xs font-black uppercase tracking-wider text-slate-600">
          <Link href="#persona-selection" className="hover:text-blue-700 transition-colors">
            Personas
          </Link>
          <Link href="#how-it-works" className="hover:text-blue-700 transition-colors">
            How It Works
          </Link>
          <Link href="#data-proof" className="hover:text-blue-700 transition-colors">
            Clinical Data
          </Link>
          <Link href="/assessment?mode=upload" className="hover:text-blue-700 transition-colors">
            OCR Scan
          </Link>
          <Link href="/assessment?mode=manual" className="hover:text-blue-700 transition-colors">
            Manual Form
          </Link>
        </nav>
      ) : (
        /* App Workspace Navigation: Shown for Clinician and Trainee ONLY (Except Patient) */
        normalizedRole !== "patient" && !isLocked && (
          <nav className="flex items-center gap-1.5 sm:gap-2 p-1.5 neu-inset rounded-2xl bg-[#dce5ef]/90 border border-white/95 shadow-inner shrink-0">
            <Link
              href={assessmentHref}
              className={`h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                isAssessmentActive
                  ? "neu-button-3d text-white shadow-md"
                  : "neu-button-secondary text-slate-700 hover:text-blue-700"
              }`}
            >
              <Activity
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  isAssessmentActive ? "text-white" : "text-blue-600"
                }`}
                strokeWidth={2.4}
              />
              <span>Assessment</span>
            </Link>
            <Link
              href={`/drugs?role=${normalizedRole}`}
              className={`h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                pageType === "drugs"
                  ? "neu-button-3d text-white shadow-md"
                  : "neu-button-secondary text-slate-700 hover:text-blue-700"
              }`}
            >
              <Pill
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  pageType === "drugs" ? "text-white" : "text-blue-600"
                }`}
                strokeWidth={2.4}
              />
              <span>Drug Exploration</span>
            </Link>
          </nav>
        )
      )}

      {/* 3. RIGHT: Action Controls */}
      {isLanding ? (
        /* Landing Action: Direct Launch Workspace */
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/select-role"
            className="neu-button-3d px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Workspace</span>
          </Link>
        </div>
      ) : (
        /* App Workspace Actions: Active Role Badge & Change Role */
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
            className="neu-button-secondary px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-black text-slate-700 hover:text-blue-700 transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1.5 shrink-0"
          >
            <span>Change Role</span>
          </Link>
        </div>
      )}
    </header>
  );
}
