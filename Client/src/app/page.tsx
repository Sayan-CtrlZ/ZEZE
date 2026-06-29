"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: "patient",
      title: "Patient",
      description: "Get personalized, easy-to-understand health insights and lifestyle guidance.",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      )
    },
    {
      id: "practitioner",
      title: "Medical Practitioner",
      description: "Access fast, clinical risk probabilities and differential diagnostic considerations.",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
      )
    },
    {
      id: "researcher",
      title: "Researcher",
      description: "Deep dive into the machine learning model, feature impacts, and analytical data.",
      icon: (
        <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      )
    }
  ];

  return (
    <main className="min-h-screen relative p-4 md:p-8 selection:bg-brand-900 selection:text-brand-100 overflow-hidden flex flex-col justify-center items-center">
      {/* Animated Glass Bubbles - refined to feel slightly darker/sleeker if globals.css is updated */}
      <div className="bubble w-[150px] h-[150px] left-[10%]" style={{ animationDuration: '18s', animationDelay: '0s' }}></div>
      <div className="bubble w-[250px] h-[250px] left-[30%]" style={{ animationDuration: '25s', animationDelay: '4s' }}></div>
      <div className="bubble w-[100px] h-[100px] left-[55%]" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
      <div className="bubble w-[200px] h-[200px] left-[75%]" style={{ animationDuration: '22s', animationDelay: '6s' }}></div>
      <div className="bubble w-[120px] h-[120px] left-[85%]" style={{ animationDuration: '19s', animationDelay: '1s' }}></div>
      <div className="bubble w-[300px] h-[300px] left-[5%]" style={{ animationDuration: '28s', animationDelay: '8s' }}></div>
      <div className="bubble w-[180px] h-[180px] left-[45%]" style={{ animationDuration: '20s', animationDelay: '10s' }}></div>

      <div className="max-w-6xl mx-auto relative z-10 w-full text-center">
        <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col items-center">
          <div className="inline-flex items-baseline gap-2 px-4 py-1 rounded-full bg-white/80 backdrop-blur shadow-sm text-xs font-bold tracking-widest text-brand-900 mb-6 border border-brand-900/10">
            <span className="w-2 h-2 rounded-full mt-[0.15rem] bg-green-500 animate-pulse inline-block"></span>
            ACTIVE AI ASSESSMENT
          </div>

          <img src="/icon.webp" alt="ZEZE Logo" className="w-24 h-24 md:w-32 md:h-32 mb-2 drop-shadow-xl hover:scale-105 transition-transform duration-500" />

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-brand-900 mb-1 md:mb-2 drop-shadow-md">
            ZEZE
          </h1>

          <h2 className="text-xs sm:text-sm md:text-base font-bold tracking-[0.2em] uppercase text-brand-900/80 mb-2 md:mb-4 drop-shadow-sm">
            Zero Error Zonal Evaluation Model
          </h2>
        </header>

        {!selectedRole ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both px-2">
            <p className="text-sm sm:text-base md:text-lg font-bold text-brand-900 tracking-wide drop-shadow-sm max-w-2xl mx-auto mb-8">
              Select your role to personalize the cardiovascular risk assessment experience.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className="group relative w-full bg-white border-2 border-brand-900/10 rounded-xl p-6 md:p-8 flex flex-col items-center text-center transition-all duration-300 hover:bg-brand-50 hover:border-brand-900/30 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-brand-900/5 flex items-center justify-center text-brand-900 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                    {role.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-brand-900 tracking-tight mb-2">{role.title}</h3>
                  <p className="text-brand-900/80 font-semibold text-xs md:text-sm leading-relaxed">
                    {role.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500 px-2 w-full">
            <button 
              onClick={() => setSelectedRole(null)}
              className="absolute top-4 left-4 md:top-8 md:left-8 inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white hover:bg-gray-50 border-2 border-brand-900/10 text-brand-900 font-bold tracking-wide transition-all shadow-sm text-sm md:text-base z-50 rounded-xl"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Change Role
            </button>
            <p className="text-sm sm:text-base md:text-lg font-bold text-brand-900 tracking-wide drop-shadow-sm max-w-2xl mx-auto mb-8">
              Select your preferred method of clinical data entry to begin.
            </p>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
              
              {/* Card 1: Document Scan */}
              <Link href={`/assessment?mode=upload&role=${selectedRole}`} className="group relative w-full bg-white border-2 border-brand-900/10 rounded-xl p-6 md:p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-brand-50 hover:border-brand-900/30 hover:shadow-lg hover:-translate-y-1">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-brand-900/5 flex items-center justify-center text-brand-900 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-brand-900 tracking-tight mb-2 md:mb-3">Smart Document Scan</h3>
                <p className="text-brand-900/80 font-semibold text-xs md:text-sm leading-relaxed">
                  Upload a PDF or image of your clinical report. Our AI will automatically parse and extract your medical parameters.
                </p>
                <div className="mt-4 md:mt-8 px-6 py-2 rounded-full bg-brand-900 text-brand-100 font-bold text-xs md:text-sm tracking-wider uppercase opacity-90 group-hover:opacity-100 transition-opacity">
                  Upload File
                </div>
              </Link>

              {/* Card 2: Manual Entry */}
              <Link href={`/assessment?mode=manual&role=${selectedRole}`} className="group relative w-full bg-white border-2 border-brand-900/10 rounded-xl p-6 md:p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-brand-50 hover:border-brand-900/30 hover:shadow-lg hover:-translate-y-1">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-brand-900/5 flex items-center justify-center text-brand-900 mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-brand-900 tracking-tight mb-2 md:mb-3">Manual Clinical Entry</h3>
                <p className="text-brand-900/80 font-semibold text-xs md:text-sm leading-relaxed">
                  Directly input your 13 critical clinical parameters into our smart form for immediate AI cardiovascular evaluation.
                </p>
                <div className="mt-4 md:mt-8 px-6 py-2 rounded-full bg-brand-900/10 text-brand-900 border border-brand-900/20 font-bold text-xs md:text-sm tracking-wider uppercase opacity-90 group-hover:opacity-100 group-hover:bg-brand-900 group-hover:text-brand-100 transition-all">
                  Start Typing
                </div>
              </Link>

            </section>
          </div>
        )}
      </div>
    </main>
  );
}
