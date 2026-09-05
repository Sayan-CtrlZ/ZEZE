"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RiskForm, { FormData } from "@/components/RiskForm";
import Link from "next/link";

function AssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as "upload" | "manual") || "upload";
  const initialRole = searchParams.get("role") || "patient";
  
  const [currentMode, setCurrentMode] = useState<"upload" | "manual">(initialMode);
  const [currentRole, setCurrentRole] = useState<string>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        let errMsg = "Failed to evaluate risk score.";
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch {
          // fallback
        }
        throw new Error(errMsg);
      }

      const responseData = await response.json();
      sessionStorage.setItem('zeze_result', JSON.stringify({ ...responseData, payload }));
      router.push('/result');

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(msg);
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
        let errMsg = "Failed to evaluate document.";
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch {
          // fallback
        }
        throw new Error(errMsg);
      }

      const responseData = await response.json();
      sessionStorage.setItem('zeze_result', JSON.stringify({ ...responseData, payload: { symptoms, role: currentRole } }));
      router.push('/result');

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1640px] 2xl:max-w-[1720px] mx-auto relative z-10 w-full px-3 sm:px-6 lg:px-8">
      {/* FLOATING PILL TOP BAR */}
      <div className="neu-pill-nav p-3 px-6 mb-8 flex flex-wrap justify-between items-center gap-4">
        <Link 
          href="/" 
          className="neu-button-secondary inline-flex items-center gap-2 px-4 py-2 text-slate-800 font-black text-xs sm:text-sm tracking-wide"
        >
          <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Home
        </Link>

        {/* Role Switcher Pills */}
        <div className="flex items-center gap-2 p-1.5 neu-inset rounded-2xl">
          <span className="text-[10px] font-black uppercase text-slate-500 px-2">Role:</span>
          {[
            { id: 'clinician', label: 'Clinician' },
            { id: 'trainee', label: 'Healthcare Trainee' },
            { id: 'patient', label: 'Patient / General' }
          ].map((r) => {
            const isSelected = currentRole === r.id || (r.id === 'clinician' && currentRole === 'practitioner');
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setCurrentRole(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected 
                    ? 'neu-button-3d text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <header className="text-center mb-8 flex flex-col items-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full neu-inset-sm text-xs font-black tracking-widest text-blue-900 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_#2563eb] animate-pulse"></span>
          ACTIVE ASSESSMENT
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-2">
          {currentMode === 'manual' ? 'Manual Clinical Entry' : 'Smart Document Scan'}
        </h1>

        <h2 className="text-xs sm:text-sm font-extrabold tracking-[0.2em] uppercase text-slate-500 px-4 mb-6">
          Zero Error Zonal Evaluation Model
        </h2>

        {/* 3D MODE TOGGLE SWITCH (MATCHING SCREENSHOT BUTTONS) */}
        <div className="p-2 neu-inset rounded-full flex items-center gap-2 shadow-inner bg-white/50">
          <button
            type="button"
            onClick={() => setCurrentMode('upload')}
            className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-black tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              currentMode === 'upload'
                ? 'neu-button-3d text-white'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Smart Document Scan
          </button>
          <button
            type="button"
            onClick={() => setCurrentMode('manual')}
            className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-black tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-2 ${
              currentMode === 'manual'
                ? 'neu-button-3d text-white'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Manual Clinical Entry
          </button>
        </div>
      </header>

      <section>
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
    <main className="min-h-screen relative pt-6 pb-12 px-2 sm:px-6 lg:px-8 overflow-x-hidden flex flex-col justify-start">
      <Suspense fallback={<div className="flex justify-center text-slate-900 font-black tracking-widest uppercase">Loading Assessment...</div>}>
        <AssessmentContent />
      </Suspense>
    </main>
  );
}
