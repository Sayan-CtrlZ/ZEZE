"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RiskForm, { FormData } from "@/components/RiskForm";
import Link from "next/link";

function AssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as "upload" | "manual") || "upload";
  const role = searchParams.get("role") || "patient";
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");

    try {
      const payload: any = { ...data, role };
      Object.keys(payload).forEach(key => {
        if (key !== 'symptoms' && key !== 'role' && payload[key] === '') payload[key] = 0;
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/predict`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prediction");
      }

      const responseData = await response.json();

      // Store the result seamlessly in browser session to pass to the next page
      sessionStorage.setItem('zeze_result', JSON.stringify({ ...responseData, payload }));

      // Route successfully to the dashboard
      router.push('/result');

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
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
      uploadData.append("role", role);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/predict-document`;

      const response = await fetch(apiUrl, {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        let errMsg = "Failed to evaluate document.";
        try {
          const errData = await response.json();
          if (errData && errData.detail) errMsg = errData.detail;
        } catch (e) {}
        throw new Error(errMsg);
      }

      const responseData = await response.json();
      
      // Store the result seamlessly in browser session to pass to the next page
      sessionStorage.setItem('zeze_result', JSON.stringify({ ...responseData, payload: { symptoms, role } }));

      // Route successfully to the dashboard
      router.push('/result');

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto relative z-10 w-full px-2 sm:px-0">
      <Link href="/" className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-white/40 hover:bg-white/60 backdrop-blur border border-white/40 text-brand-900 font-bold tracking-wide transition-all mb-4 md:mb-8 shadow-sm text-sm md:text-base">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Home
      </Link>

      <header className="text-center mb-6 md:mb-10 mt-0 md:mt-2 animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col items-center">
        <div className="inline-flex items-baseline gap-2 px-3 py-1 md:px-4 md:py-1 rounded-full bg-white/80 backdrop-blur shadow-sm text-[10px] md:text-xs font-bold tracking-widest text-brand-900 mb-3 md:mb-6 border border-brand-900/10">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mt-[0.15rem] bg-green-500 animate-pulse inline-block"></span>
          ACTIVE AI ASSESSMENT
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-brand-900 mb-1 md:mb-2 drop-shadow-md">
          {mode === 'manual' ? 'Manual Entry' : 'Smart Scan'}
        </h1>

        <h2 className="text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.15em] md:tracking-[0.2em] uppercase text-brand-900/80 mb-2 md:mb-4 drop-shadow-sm px-4">
          Zero Error Zonal Evaluation Model
        </h2>
      </header>

      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
        <RiskForm onSubmit={handleSubmit} onDocumentSubmit={handleDocumentSubmit} isLoading={loading} mode={mode} />

        {error && (
          <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-sm font-bold">
            Error evaluating risk: {error}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Assessment() {
  return (
    <main className="min-h-screen relative pt-4 pb-4 px-4 sm:px-6 lg:px-8 selection:bg-brand-900 selection:text-brand-100 overflow-hidden flex flex-col justify-center">
      {/* Animated Glass Bubbles */}
      <div className="bubble w-[150px] h-[150px] left-[10%]" style={{ animationDuration: '18s', animationDelay: '0s' }}></div>
      <div className="bubble w-[250px] h-[250px] left-[30%]" style={{ animationDuration: '25s', animationDelay: '4s' }}></div>
      <div className="bubble w-[100px] h-[100px] left-[55%]" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
      <div className="bubble w-[200px] h-[200px] left-[75%]" style={{ animationDuration: '22s', animationDelay: '6s' }}></div>
      <div className="bubble w-[120px] h-[120px] left-[85%]" style={{ animationDuration: '19s', animationDelay: '1s' }}></div>
      <div className="bubble w-[300px] h-[300px] left-[5%]" style={{ animationDuration: '28s', animationDelay: '8s' }}></div>
      <div className="bubble w-[180px] h-[180px] left-[45%]" style={{ animationDuration: '20s', animationDelay: '10s' }}></div>

      <Suspense fallback={<div className="flex justify-center text-brand-900 font-bold">Loading assessment...</div>}>
        <AssessmentContent />
      </Suspense>
    </main>
  );
}
