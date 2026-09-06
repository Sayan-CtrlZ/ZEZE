"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope,
  GraduationCap,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const ROLE_OPTIONS = [
  {
    id: "clinician" as const,
    title: "Clinician / Doctor",
    subtitle: "Cardiologists & Attending Physicians",
    badge: "Clinical DSS",
    description: "ACC/AHA hypertension & ASCVD staging, pharmacological considerations, and differential clinical pathways.",
    icon: Stethoscope,
    accentBg: "#2563eb",
  },
  {
    id: "trainee" as const,
    title: "Healthcare Trainee",
    subtitle: "Medical Students & Residents",
    badge: "Supervised Learning",
    description: "Pathophysiological mechanisms, multi-variable tree feature interactions, and clinical teaching pearls.",
    icon: GraduationCap,
    accentBg: "#7c3aed",
  },
  {
    id: "patient" as const,
    title: "Patient / General User",
    subtitle: "Personal Cardiovascular Health Guidance",
    badge: "Plain Language",
    description: "Clear, jargon-free translation of vitals, heart-protective lifestyle advice, and questions for your doctor.",
    icon: User,
    accentBg: "#0d9488",
  },
];

function RoleSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<"clinician" | "trainee" | "patient">("clinician");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlRole = searchParams.get("role") as "clinician" | "trainee" | "patient" | null;
      if (urlRole && ["clinician", "trainee", "patient"].includes(urlRole)) {
        setSelectedRole(urlRole);
        return;
      }
      const saved = (localStorage.getItem("zeze_selected_role") || sessionStorage.getItem("zeze_selected_role")) as "clinician" | "trainee" | "patient" | null;
      if (saved && ["clinician", "trainee", "patient"].includes(saved)) {
        setSelectedRole(saved);
      }
    }
  }, [searchParams]);

  const handleConfirmRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("zeze_selected_role", selectedRole);
      sessionStorage.setItem("zeze_selected_role", selectedRole);
    }
    router.push(`/assessment?role=${selectedRole}`);
  };

  const activeConfig = ROLE_OPTIONS.find((r) => r.id === selectedRole) || ROLE_OPTIONS[0];

  return (
    <main className="min-h-screen relative p-4 sm:p-8 flex flex-col justify-center items-center overflow-x-hidden bg-[#edf3f9]">
      <div className="w-full max-w-lg sm:max-w-xl mx-auto my-auto">
        <div className="neu-card-glass p-6 sm:p-10 rounded-3xl border border-white/80 relative overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-2 mb-6 sm:mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl neu-flat flex items-center justify-center p-2.5 bg-[#edf3f9] border border-white/80 shadow-sm mb-3">
              <img src="/icon.webp" alt="ZEZE" className="w-full h-full object-contain" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full neu-inset-sm text-[10px] font-black uppercase tracking-widest text-blue-900 mb-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Workspace Setup</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#0a192f] tracking-tight">
              Select Your Role
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-sm mx-auto">
              Choose your role to tailor clinical algorithms, diagnostic depth, and medical terminology.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleConfirmRole} className="space-y-3.5">
            {/* Role Options */}
            <div className="space-y-3">
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = selectedRole === opt.id;
                const IconComp = opt.icon;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedRole(opt.id)}
                    className={`w-full p-4 sm:p-4.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3.5 ${
                      isSelected
                        ? "neu-inset border-blue-400 bg-blue-50/50 scale-[1.01]"
                        : "neu-flat hover:scale-[1.005] border-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: opt.accentBg, color: "#ffffff" }}
                      >
                        <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.4} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-black text-[#0a192f]">
                            {opt.title}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 hidden xs:inline">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                          {opt.subtitle}
                        </p>
                      </div>
                    </div>

                    {isSelected ? (
                      <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300/80 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Launch Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="neu-button-3d w-full py-3.5 sm:py-4 px-6 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 rounded-2xl"
              >
                <span>Enter {activeConfig.title.split("/")[0].trim()} Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Back to Home Link */}
            <div className="text-center pt-3 border-t border-slate-200/80">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Overview</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#edf3f9] flex items-center justify-center text-slate-700 font-bold">Loading...</div>}>
      <RoleSelectionContent />
    </Suspense>
  );
}
