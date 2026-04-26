
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RiskForm, { FormData } from "@/components/RiskForm";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");

    try {
      const payload: any = { ...data };
      Object.keys(payload).forEach(key => {
        if (key !== 'symptoms' && payload[key] === '') payload[key] = 0;
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/predict';

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

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <header className="text-center mb-10 mt-2 animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col items-center">

          <div className="inline-flex items-baseline gap-2 px-4 py-1 rounded-full bg-white/80 backdrop-blur shadow-sm text-xs font-bold tracking-widest text-brand-900 mb-6 border border-brand-900/10">
            <span className="w-2 h-2 rounded-full mt-[0.15rem] bg-green-500 animate-pulse inline-block"></span>
            ACTIVE AI ASSESSMENT
          </div>

          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-brand-900 mb-2 drop-shadow-md">
            ZEZE
          </h1>

          <h2 className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-brand-900/80 mb-4 drop-shadow-sm">
            Zero Error Zonal Evaluation Model
          </h2>

          <p className="text-sm md:text-base font-bold text-brand-900 tracking-wide drop-shadow-sm">
            Precision in Prediction. Clarity in Care.
          </p>

        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <RiskForm onSubmit={handleSubmit} isLoading={loading} />

          {error && (
            <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-sm font-bold">
              Error evaluating risk: {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
