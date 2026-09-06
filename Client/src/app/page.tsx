"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Stethoscope,
  GraduationCap,
  User,
  ArrowRight,
  FileUp,
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("zeze_selected_role");
      if (saved) {
        setSelectedRole(saved);
      }
    }
  }, []);

  const roles = [
    {
      id: "clinician",
      num: "01",
      title: "Clinician / Doctor",
      tagline: "Primary Clinical Decision Support",
      accentBorder: "card-accent-navy",
      iconColor: "text-blue-700",
      description:
        "Designed for cardiologists and attending physicians. Provides ACC/AHA staging, clinical pharmacopeia, differential assessments, and immediate diagnostic pathways.",
      icon: <Stethoscope className="w-7 h-7 text-blue-700" />,
      features: [
        "ACC/AHA Hypertension & ASCVD Staging",
        "Clinical Pharmacopeia & Drug Reference",
        "What-If Real-Time Risk Simulator",
        "Calibrated Gradient Boosted Predictions",
      ],
    },
    {
      id: "trainee",
      num: "02",
      title: "Healthcare Trainee",
      tagline: "Supervised Learning & Education",
      accentBorder: "card-accent-violet",
      iconColor: "text-violet-600",
      description:
        "Designed for medical students and cardiology residents. Focuses on underlying pathophysiological mechanisms, Laplace wall stress, and educational decision rationale.",
      icon: <GraduationCap className="w-7 h-7 text-violet-600" />,
      features: [
        "Pathophysiological Mechanism Breakdowns",
        "Feature Attribution & SHAP Weights",
        "Educational Pharmacology Pearls",
        "Sensitivity Analysis Simulator",
      ],
    },
    {
      id: "patient",
      num: "03",
      title: "Patient / General User",
      tagline: "Clear Health Guidance",
      accentBorder: "card-accent-cyan",
      iconColor: "text-cyan-600",
      description:
        "Plain-language cardiovascular guidance with zero medical jargon. Understand what your numbers mean, learn actionable lifestyle habits, and get questions for your doctor.",
      icon: <User className="w-7 h-7 text-cyan-600" />,
      features: [
        "Jargon-Free Vitals Breakdown",
        "Personalized Lifestyle & Diet Roadmap",
        "Protective vs Risk Factor Clarity",
        "Doctor Discussion Talking Points",
      ],
    },
  ];

  return (
    <main className="min-h-screen relative p-3 sm:p-8 flex flex-col justify-start items-center overflow-x-hidden bg-[#edf3f9]">
      {/* =========================================================================
          1. FLOATING PILL NAVBAR
         ========================================================================= */}
      <header className="w-full max-w-6xl 2xl:max-w-7xl mx-auto neu-pill-nav py-2.5 sm:py-3 px-3.5 sm:px-8 mb-8 sm:mb-12 flex items-center justify-between z-30 sticky top-3 sm:top-4 bg-white/90 backdrop-blur-md">
        {/* Brand Logo with Medallion */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl neu-inset flex items-center justify-center text-blue-700 bg-white/70 group-hover:scale-105 transition-transform shrink-0">
            <img src="/icon.webp" alt="ZEZE" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">ZEZE</span>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-blue-700 px-2 py-0.5 rounded-full neu-inset-sm">
                MED AI
              </span>
            </div>
          </div>
        </Link>

        {/* Center Nav Links */}
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

        {/* Right Action Controls: Sign In & Sign Up / Start */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/signin"
            className="neu-button-secondary px-3 sm:px-4 py-2 text-xs font-black text-slate-800 transition-colors cursor-pointer hidden xs:inline-flex items-center gap-1.5 active:scale-95"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Sign In</span>
          </Link>

          <Link
            href="/signup"
            className="neu-button-3d px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs font-black shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Profile</span>
          </Link>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION
         ========================================================================= */}
      <section className="max-w-4xl mx-auto text-center py-4 sm:py-10 relative z-10 w-full px-2">
        <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full neu-inset-sm text-[10px] sm:text-xs font-black tracking-widest text-blue-900 uppercase mb-4 sm:mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Zero Error Zonal Evaluation • 70,000 Patient Cohort</span>
        </div>

        <h1 className="text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-3 sm:mb-4 leading-tight">
          Precision <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-sky-600 to-blue-900">Cardiology.</span>
        </h1>

        <p className="text-xs sm:text-base font-bold text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          Calibrated gradient boosted risk engine with on-device document OCR and persona-tailored clinical intelligence for doctors, trainees, and patients.
        </p>

        {/* CTA BUTTONS */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 mb-10 sm:mb-16">
          <Link
            href="/signup"
            className="neu-button-3d px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black tracking-wider group cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <span>Create Profile &amp; Start</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <a
            href="#persona-selection"
            className="neu-button-secondary px-5 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-black text-slate-800 tracking-wide transition-all"
          >
            Explore Personas
          </a>
        </div>
      </section>

      {/* =========================================================================
          3. PERSONA / ROLE SELECTOR (WHO ARE YOU?)
         ========================================================================= */}
      <section id="persona-selection" className="w-full max-w-7xl 2xl:max-w-[1380px] mx-auto py-8 sm:py-14 px-2 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block px-3.5 sm:px-4 py-1.5 rounded-full neu-inset-sm text-[10px] sm:text-xs font-black tracking-widest text-blue-900 uppercase mb-2 sm:mb-3">
            Role Architecture
          </span>
          <h2 className="text-2xl sm:text-5xl font-black tracking-tight text-slate-900">
            Who are <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-600">you?</span>
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-600 max-w-xl mx-auto mt-2">
            Select your persona profile. The platform will tailor the evaluation tools, detail level, and medical wording to your workflow.
          </p>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`neu-card-glass ${role.accentBorder} p-6 sm:p-8 lg:p-9 flex flex-col justify-between group rounded-3xl`}
            >
              <div>
                {/* Top Row: Icon + Watermark */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl neu-inset flex items-center justify-center bg-white/70 group-hover:scale-105 transition-transform">
                    {role.icon}
                  </div>
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-300/80 select-none">
                    {role.num}
                  </span>
                </div>

                <div className="mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-200/50 px-3 py-1 rounded-full inline-block">
                    {role.tagline}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                  {role.title}
                </h3>

                <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed mb-6">
                  {role.description}
                </p>

                {/* Features Bullet List */}
                <ul className="space-y-2 mb-8 border-t border-slate-200/80 pt-4">
                  {role.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button for this Persona */}
              <div className="pt-2 border-t border-slate-200/60">
                <Link
                  href={`/signup?role=${role.id}&step=details`}
                  className="neu-button-3d w-full py-3.5 text-xs sm:text-sm font-black tracking-wider cursor-pointer flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Select &amp; Create Profile</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          4. HOW IT WORKS / CLINICAL PIPELINE SECTION
         ========================================================================= */}
      <section id="how-it-works" className="w-full max-w-7xl 2xl:max-w-[1380px] mx-auto py-10 sm:py-16 px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full neu-inset-sm text-xs font-black tracking-widest text-blue-900 uppercase mb-3">
            Architecture &amp; Workflow
          </span>
          <h2 className="text-2xl sm:text-5xl font-black tracking-tight text-slate-900">
            How ZEZE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-600">Evaluates Risk</span>
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-600 max-w-xl mx-auto mt-2">
            A complete 4-step pipeline bridging computer vision OCR, gradient boosting calibration, and generative clinical synthesis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Create Profile",
              desc: "Select Clinician, Trainee, or Patient persona to tailor the workspace and medical terminology.",
              icon: User,
              color: "text-blue-600",
            },
            {
              step: "02",
              title: "Input Biomarkers",
              desc: "Upload a lab report PDF for RapidOCR extraction or enter systolic, diastolic, and lipid vitals directly.",
              icon: FileUp,
              color: "text-cyan-600",
            },
            {
              step: "03",
              title: "Calibrated ML Evaluation",
              desc: "Evaluated by our 70,000-cohort gradient boosted decision ensemble with isotonic probability calibration.",
              icon: Cpu,
              color: "text-violet-600",
            },
            {
              step: "04",
              title: "Persona-Tailored Report",
              desc: "Receive customized clinical decision pathways for doctors, learning pearls for trainees, or plain advice for patients.",
              icon: Activity,
              color: "text-emerald-600",
            },
          ].map((item, i) => {
            const IconComponent = item.icon;
            return (
              <div key={i} className="neu-card-glass p-6 sm:p-7 rounded-3xl relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-slate-300 select-none">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl neu-inset flex items-center justify-center bg-white/70">
                      <IconComponent className={`w-5 h-5 ${item.color}`} />
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                    {item.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          5. DATA & EVIDENCE SECTION ("THE PROOF IS IN THE DATA")
         ========================================================================= */}
      <section id="data-proof" className="w-full max-w-7xl 2xl:max-w-[1380px] mx-auto py-10 sm:py-16 px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full neu-inset-sm text-xs font-black tracking-widest text-blue-900 uppercase mb-3">
            Empirical Validation
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-sky-600">proof</span> is in the data.
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-600 max-w-xl mx-auto mt-2">
            Rigorous performance metrics evaluated on holdout clinical test partitions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="neu-card-glass card-accent-cyan p-7 sm:p-8 rounded-3xl">
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

          <div className="neu-card-glass card-accent-navy p-7 sm:p-8 rounded-3xl">
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

          <div className="neu-card-glass card-accent-violet p-7 sm:p-8 rounded-3xl">
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

          <div className="neu-card-glass card-accent-amber p-7 sm:p-8 rounded-3xl">
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

      {/* =========================================================================
          6. FOOTER
         ========================================================================= */}
      <footer className="w-full max-w-7xl mx-auto pt-10 pb-8 px-4 sm:px-8 border-t border-slate-300/60 mt-12 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg neu-flat flex items-center justify-center p-1 bg-white">
            <img src="/icon.webp" alt="ZEZE" className="w-full h-full object-contain" />
          </div>
          <span>© 2026 ZEZE MED AI. Clinical Decision Support System.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/signin" className="hover:text-blue-700 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="hover:text-blue-700 transition-colors">
            Sign Up
          </Link>
          <Link href="/assessment?mode=manual" className="hover:text-blue-700 transition-colors">
            Manual Form
          </Link>
          <Link href="/assessment?mode=upload" className="hover:text-blue-700 transition-colors">
            Document Scan
          </Link>
        </div>
      </footer>
    </main>
  );
}
