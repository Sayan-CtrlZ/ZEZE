"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: "clinician",
      num: "01",
      title: "Clinician / Doctor",
      tagline: "Primary & Clinical Decision Support",
      accentBorder: "card-accent-navy",
      iconColor: "text-blue-700",
      description: "Enter or scan patient lab data for clinical decision support, calibrated risk stratification, ACC/AHA staging, and clinical review prompts.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      id: "trainee",
      num: "02",
      title: "Healthcare Trainee",
      tagline: "Supervised Learning & Education",
      accentBorder: "card-accent-violet",
      iconColor: "text-violet-600",
      description: "Supervised training workspace. Explore underlying physiological mechanisms, feature attributions, and educational clinical rationale.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: "patient",
      num: "03",
      title: "Patient / General User",
      tagline: "Clear Health Guidance",
      accentBorder: "card-accent-cyan",
      iconColor: "text-cyan-600",
      description: "Receive individualized, easy-to-understand health interpretations, clear explanations of what results mean, and actionable lifestyle habits.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  return (
    <main className="min-h-screen relative p-4 sm:p-8 flex flex-col justify-start items-center overflow-x-hidden">
      
      {/* FLOATING PILL NAVBAR (MATCHING SCREENSHOT 1-5) */}
      <header className="w-full max-w-6xl 2xl:max-w-7xl mx-auto neu-pill-nav py-3 px-6 sm:px-8 mb-12 flex items-center justify-between z-30 sticky top-4">
        {/* Brand Logo with Spark Icon */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl neu-inset flex items-center justify-center text-blue-700 bg-white/60 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">ZEZE</span>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 px-2 py-0.5 rounded-full neu-inset-sm">MED AI</span>
            </div>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-black uppercase tracking-wider text-slate-600">
          <Link href="#persona-selection" className="hover:text-blue-700 transition-colors">Personas</Link>
          <Link href="#data-proof" className="hover:text-blue-700 transition-colors">Clinical Data</Link>
          <Link href="/assessment?mode=upload" className="hover:text-blue-700 transition-colors">OCR Scan</Link>
          <Link href="/assessment?mode=manual" className="hover:text-blue-700 transition-colors">Manual Form</Link>
        </nav>

        {/* Right Action Button (3D Navy Button matching screenshot) */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="w-9 h-9 rounded-full neu-inset-sm hidden sm:flex items-center justify-center text-slate-600 hover:text-blue-700 transition-colors"
            title="Theme Indicator"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          </button>
          
          <Link 
            href="/assessment" 
            className="neu-button-3d px-5 py-2.5 text-xs font-black"
          >
            <svg className="w-3.5 h-3.5 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            START
          </Link>
        </div>
      </header>

      {/* HERO SECTION (MATCHING SCREENSHOT 1 & 2) */}
      <section className="max-w-4xl mx-auto text-center py-6 sm:py-10 relative z-10 w-full">
        
        {/* Title Tagline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
          Precision <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-sky-600 to-blue-900">Cardiology.</span>
        </h1>
        
        <p className="text-sm sm:text-base font-bold text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Zero Error Zonal Evaluation Engine powered by a calibrated 70,000-cohort gradient boosted model with on-device document OCR.
        </p>

        {/* MAIN 3D CTA BUTTON (MATCHING SCREENSHOT 1 & 2) */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <a
            href="#persona-selection"
            className="neu-button-3d px-8 py-4 text-sm font-black tracking-wider group"
          >
            <svg className="w-4 h-4 transform -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            START YOUR EVALUATION
          </a>
        </div>
      </section>

      {/* PERSONA / ROLE SELECTOR (WHO ARE YOU?) */}
      <section id="persona-selection" className="w-full max-w-7xl 2xl:max-w-[1380px] mx-auto py-10 px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full neu-inset-sm text-xs font-black tracking-widest text-blue-900 uppercase mb-3">
            Target Users &amp; Roles
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Who are <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-600">you?</span>
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-600 max-w-xl mx-auto mt-2">
            Choose your profile to tailor the clinical dashboard, detail level, and medical wording to your workflow.
          </p>
        </div>

        {!selectedRole ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`neu-card-glass ${role.accentBorder} p-8 sm:p-9 flex flex-col justify-between group`}
              >
                {/* Top Row: Icon Well on Left + Crisp Watermark Number on Right */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl neu-inset flex items-center justify-center ${role.iconColor} bg-white/70 group-hover:scale-105 transition-transform`}>
                    {role.icon}
                  </div>
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-300/80 select-none">
                    {role.num}
                  </span>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full inline-block">
                      {role.tagline}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                    {role.title}
                  </h3>

                  <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed mb-8 flex-1">
                    {role.description}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedRole(role.id)}
                  className="neu-button-3d w-full py-3.5 text-xs font-black tracking-wider cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  Select Profile
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full max-w-5xl 2xl:max-w-6xl mx-auto">
            {/* Top Navigation Bar with Back Button */}
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={() => setSelectedRole(null)}
                className="neu-button-secondary inline-flex items-center gap-2 px-4 py-2 text-slate-800 font-black text-xs sm:text-sm tracking-wide"
              >
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to Roles
              </button>

              <div className="px-4 py-1.5 rounded-full neu-inset-sm text-xs font-black uppercase tracking-wider text-blue-900">
                Active Profile: <span className="underline">{selectedRole}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
              
              {/* Option 1: Smart Document Scan */}
              <div className="neu-card-glass card-accent-cyan p-8 sm:p-9 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-cyan-600 bg-white/70 group-hover:scale-105 transition-transform">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-300/80 select-none">
                    OCR
                  </span>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700 bg-cyan-100/60 px-3 py-1 rounded-full inline-block">
                      ⚡ On-Device RapidOCR
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                    Smart Document Scan
                  </h3>
                  <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed mb-8 flex-1">
                    Upload a PDF or image of your lab report. Optical character recognition auto-extracts blood pressure and lipid panels.
                  </p>
                </div>

                <Link 
                  href={`/assessment?mode=upload&role=${selectedRole}`}
                  className="neu-button-3d w-full py-3.5 text-xs font-black tracking-wider text-center"
                >
                  <svg className="w-3.5 h-3.5 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  Scan Document
                </Link>
              </div>

              {/* Option 2: Manual Entry */}
              <div className="neu-card-glass card-accent-navy p-8 sm:p-9 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center text-blue-700 bg-white/70 group-hover:scale-105 transition-transform">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-300/80 select-none">
                    17+
                  </span>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-100/60 px-3 py-1 rounded-full inline-block">
                      Full Biomarker Entry
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                    Manual Clinical Entry
                  </h3>
                  <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed mb-8 flex-1">
                    Directly input blood pressure, BMI, cholesterol tiers, and clinical biomarkers into our tactile form with live stage validation.
                  </p>
                </div>

                <Link 
                  href={`/assessment?mode=manual&role=${selectedRole}`}
                  className="neu-button-3d w-full py-3.5 text-xs font-black tracking-wider text-center"
                >
                  <svg className="w-3.5 h-3.5 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  Open Manual Form
                </Link>
              </div>

            </div>
          </div>
        )}
      </section>

      {/* DATA & STATS GRID (MATCHING SCREENSHOT 4 "THE PROOF IS IN THE DATA") */}
      <section id="data-proof" className="w-full max-w-7xl 2xl:max-w-[1380px] mx-auto py-14 px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full neu-inset-sm text-xs font-black tracking-widest text-blue-900 uppercase mb-3">
            By The Numbers
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-600">proof</span> is in the data.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          
          <div className="neu-card-glass card-accent-cyan p-7 sm:p-8">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-1">
              70,000+
            </div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
              Cohort Patients
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Calibrated dataset across diverse demographics
            </p>
          </div>

          <div className="neu-card-glass card-accent-navy p-7 sm:p-8">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-1">
              95.8%
            </div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
              Diagnostic Precision
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Gradient-boosted decision ensembles
            </p>
          </div>

          <div className="neu-card-glass card-accent-violet p-7 sm:p-8">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-1">
              0.875
            </div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
              ROC-AUC Score
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Validated on holdout clinical partitions
            </p>
          </div>

          <div className="neu-card-glass card-accent-amber p-7 sm:p-8">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-1">
              &lt; 800ms
            </div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
              OCR Inference Time
            </div>
            <p className="text-xs font-semibold text-slate-500">
              On-device entity extraction pipeline
            </p>
          </div>

        </div>
      </section>

    </main>
  );
}
