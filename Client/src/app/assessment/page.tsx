"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RiskForm, { FormData } from "@/components/RiskForm";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";

function AssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as "upload" | "manual") || "upload";
  const roleParam = searchParams.get("role");
  
  const [currentMode, setCurrentMode] = useState<"upload" | "manual">(initialMode);
  const [currentRole, setCurrentRole] = useState<string>("clinician");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("zeze_selected_role") || sessionStorage.getItem("zeze_selected_role");
      if (roleParam && ["clinician", "trainee", "patient"].includes(roleParam)) {
        setCurrentRole(roleParam);
        localStorage.setItem("zeze_selected_role", roleParam);
        sessionStorage.setItem("zeze_selected_role", roleParam);
      } else if (stored && ["clinician", "trainee", "patient"].includes(stored)) {
        setCurrentRole(stored);
      } else {
        router.replace("/select-role");
      }
    }
  }, [roleParam, router]);

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");

    try {
      const payload: Record<string, unknown> = { ...data, role: currentRole };
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          delete payload[key];
        }
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
      const apiUrl = `${baseUrl}/predict`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Evaluation error");
      }

      const responseData = await response.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("zeze_selected_role", currentRole);
        sessionStorage.setItem("zeze_selected_role", currentRole);
        sessionStorage.setItem('zeze_result', JSON.stringify({ ...responseData, payload }));
      }
      router.push('/result');

    } catch (e: unknown) {
      console.error("[Assessment] Manual entry error:", e);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleDocumentSubmit = async (files: FileList | File[], symptoms: string) => {
    setLoading(true);
    setError("");

    try {
      const uploadData = new window.FormData();
      Array.from(files).forEach(file => {
        uploadData.append("files", file);
      });
      if (symptoms) {
        uploadData.append("symptoms", symptoms);
      }
      uploadData.append("role", currentRole);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
      const apiUrl = `${baseUrl}/predict-document`;

      const response = await fetch(apiUrl, {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error("Document evaluation error");
      }

      const responseData = await response.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("zeze_selected_role", currentRole);
        sessionStorage.setItem("zeze_selected_role", currentRole);
        sessionStorage.setItem('zeze_result', JSON.stringify({ 
          ...responseData, 
          payload: { 
            ...(responseData.extracted_parameters || {}),
            symptoms, 
            role: currentRole 
          } 
        }));
      }
      router.push('/result');

    } catch (e: unknown) {
      console.error("[Assessment] Document upload error:", e);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1640px] 2xl:max-w-[1720px] mx-auto relative z-10 w-full px-2 sm:px-6 lg:px-8 flex flex-col flex-1">
      {/* RESPONSIVE TOP BAR: MOBILE HAMBURGER & NESTED MENU / DESKTOP PILL */}
      <AppNavbar
        currentRole={currentRole}
        currentMode={currentMode}
        onModeChange={(mode) => setCurrentMode(mode)}
        pageType="assessment"
      />

      <header className="text-center mb-4 sm:mb-6 flex flex-col items-center px-2 shrink-0">
        <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full neu-inset-sm text-[10px] sm:text-xs font-black tracking-widest text-blue-900 mb-2.5 sm:mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_#2563eb] animate-pulse"></span>
          <span>ACTIVE ASSESSMENT</span>
        </div>

        <h1 className="text-2xl xs:text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-2">
          {currentMode === 'manual' 
            ? (currentRole === 'trainee' ? 'Supervised Training Entry' : currentRole === 'patient' ? 'Personal Health Check' : 'Manual Clinical Entry')
            : (currentRole === 'trainee' ? 'Supervised Document Scan' : currentRole === 'patient' ? 'Personal Health Report Scan' : 'Smart Document Scan')
          }
        </h1>

        <h2 className="text-[10px] sm:text-xs sm:text-sm font-extrabold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-slate-500 px-2 mb-3 sm:mb-5">
          Zero Error Zonal Evaluation Model • {currentRole.toUpperCase()} WORKSPACE
        </h2>

        {/* 3D MODE TOGGLE SWITCH */}
        <div className="p-1.5 sm:p-2 neu-inset rounded-full flex items-center gap-1.5 sm:gap-2 shadow-inner bg-white/50 max-w-full overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setCurrentMode('upload')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              currentMode === 'upload'
                ? 'neu-button-3d text-white'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            <span>Document Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentMode('manual')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              currentMode === 'manual'
                ? 'neu-button-3d text-white'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            <span>Manual Entry</span>
          </button>
        </div>
      </header>

      <section className="flex-1 flex flex-col">
        <RiskForm 
          onSubmit={handleSubmit} 
          onDocumentSubmit={handleDocumentSubmit} 
          isLoading={loading} 
          mode={currentMode} 
        />

        {error && (
          <div className="mt-8 p-4 neu-inset text-red-700 rounded-2xl border border-red-300 text-center text-sm font-black tracking-wide">
            Error evaluating risk: {error}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Assessment() {
  return (
    <main className="min-h-screen relative pt-4 sm:pt-6 pb-3 sm:pb-4 px-2 sm:px-6 lg:px-8 overflow-x-hidden flex flex-col justify-start">
      <Suspense fallback={<div className="flex justify-center text-slate-900 font-black tracking-widest uppercase">Loading Assessment...</div>}>
        <AssessmentContent />
      </Suspense>
    </main>
  );
}
