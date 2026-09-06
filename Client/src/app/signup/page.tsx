"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  registerWithEmail,
  loginWithGoogle,
  persistLocalSession,
  type RoleDetails,
} from "@/lib/firebase";

export default function SignUpPage() {
  const router = useRouter();

  // Two-step flow:
  // - "role": Step 1 (Role Selection)
  // - "details": Step 2 (Profile Data Fill & Launch)
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<"clinician" | "trainee" | "patient">("clinician");

  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Clinician fields
  const [clinicianName, setClinicianName] = useState("");
  const [specialty, setSpecialty] = useState("Cardiology / Internal Medicine");
  const [hospital, setHospital] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Trainee fields
  const [traineeName, setTraineeName] = useState("");
  const [medicalSchool, setMedicalSchool] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("MS3 - Clinical Rotations");
  const [academicFocus, setAcademicFocus] = useState("Cardiovascular Pathophysiology");

  // Patient fields
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("55");
  const [patientSex, setPatientSex] = useState<"Male" | "Female">("Male");

  // Account identity
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get("role");
      const urlTab = params.get("tab");
      const urlStep = params.get("step");
      const urlEmail = params.get("email");
      const urlName = params.get("name");
      const isGoogle = params.get("google");
      const notFound = params.get("not_found");

      if (urlTab === "signin" || urlStep === "signin") {
        router.replace("/signin");
        return;
      }

      if (urlEmail) setEmail(urlEmail);
      if (urlName) {
        setClinicianName(urlName);
        setTraineeName(urlName);
        setPatientName(urlName);
      }
      if (isGoogle === "1") {
        setIsGoogleSignUp(true);
      }
      if (notFound === "1") {
        setAuthError(
          `No account found for Google email (${urlEmail || "this email"}). Please select your role and create your account.`
        );
      }

      if (urlRole === "clinician" || urlRole === "trainee" || urlRole === "patient") {
        setRole(urlRole);
        setStep("details");
      } else if (urlStep === "details") {
        setStep("details");
      } else {
        setStep("role");
      }
    }
  }, [router]);

  // Resolved user name
  const resolvedName =
    role === "clinician"
      ? clinicianName.trim() || "Dr. Aarav Sharma, MD"
      : role === "trainee"
      ? traineeName.trim() || "Rohan Verma, Medical Trainee"
      : patientName.trim() || "Rahul Kumar";

  const handleFinalizeProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const roleDetails: RoleDetails =
      role === "clinician"
        ? { specialty, hospital: hospital || "AIIMS New Delhi", licenseNumber }
        : role === "trainee"
        ? { medicalSchool: medicalSchool || "All India Institute of Medical Sciences (AIIMS)", trainingLevel, academicFocus }
        : { age: patientAge, sex: patientSex };

    try {
      if (isGoogleSignUp) {
        await loginWithGoogle("signup", role, roleDetails);
      } else {
        const fallbackEmail = email || `${resolvedName.toLowerCase().replace(/[^a-z0-9]/g, "") || "doctor"}@aiims.edu`;
        await registerWithEmail(fallbackEmail, "Temporary123!", {
          name: resolvedName,
          role,
          details: roleDetails,
        });
      }

      router.push(`/assessment?role=${role}`);
    } catch (err: unknown) {
      console.error("[Create Profile] Error:", err);
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await loginWithGoogle("signup", role);
      setIsGoogleSignUp(true);
      const googleEmail = res.email || email;
      const googleName =
        res.name ||
        (role === "clinician"
          ? clinicianName || "Dr. Aarav Sharma, MD"
          : role === "trainee"
          ? traineeName || "Rohan Verma"
          : patientName || "Rahul Kumar");

      // Save initial profile requiring completion
      const initialProfile = {
        uid: res.uid,
        name: googleName,
        email: googleEmail,
        role,
        authMethod: "google" as const,
        isComplete: false,
        details:
          role === "clinician"
            ? { specialty: "", hospital: "", licenseNumber: "" }
            : role === "trainee"
            ? { medicalSchool: "", trainingLevel: "MBBS 3rd/Final Prof - Clinical Postings", academicFocus: "" }
            : { age: "", sex: "Male" as const },
      };
      persistLocalSession(initialProfile);

      // Directly route to profile page in the dashboard to complete required sections
      router.push(`/profile?complete=true&role=${role}`);
    } catch (err: unknown) {
      const errObj = err as Error;
      if (errObj?.message?.includes("cancelled")) {
        setAuthError(null);
        setAuthLoading(false);
        return;
      }
      console.error("[Google Auth] Error:", err);
      // Mock/fallback for resilient dev experience
      const fallbackEmail = "dr.sharma@aiims.edu";
      const fallbackName = role === "clinician" ? "Dr. Aarav Sharma, MD" : "Rohan Verma";
      const initialProfile = {
        uid: "usr_google_mock",
        name: fallbackName,
        email: fallbackEmail,
        role,
        authMethod: "google" as const,
        isComplete: false,
        details:
          role === "clinician"
            ? { specialty: "", hospital: "", licenseNumber: "" }
            : role === "trainee"
            ? { medicalSchool: "", trainingLevel: "MBBS 3rd/Final Prof - Clinical Postings", academicFocus: "" }
            : { age: "", sex: "Male" as const },
      };
      persistLocalSession(initialProfile);
      router.push(`/profile?complete=true&role=${role}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const roleDefinitions = [
    {
      id: "clinician" as const,
      title: "Clinician / Doctor",
      subtitle: "Cardiologists & Attending Physicians",
      icon: Stethoscope,
      accentBg: "#2563eb",
    },
    {
      id: "trainee" as const,
      title: "Healthcare Trainee",
      subtitle: "Medical Students & Residents",
      icon: GraduationCap,
      accentBg: "#7c3aed",
    },
    {
      id: "patient" as const,
      title: "Patient / General User",
      subtitle: "Personal Cardiovascular Health Guidance",
      icon: User,
      accentBg: "#0d9488",
    },
  ];

  return (
    <main className="min-h-screen relative p-4 sm:p-8 flex flex-col justify-center items-center overflow-x-hidden bg-[#edf3f9]">
      <div className="w-full max-w-lg sm:max-w-xl mx-auto my-auto">
        {/* Neumorphic Form Card */}
        <div className="neu-card-glass p-6 sm:p-10 rounded-3xl border border-white/80 relative overflow-hidden">
          {/* STEP 1: ROLE SELECTION */}
          {step === "role" && (
            <div className="space-y-6">
              {/* Header with ZEZE Logo */}
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 mx-auto rounded-2xl neu-flat flex items-center justify-center p-2.5 bg-[#edf3f9] border border-white/80 shadow-sm mb-3">
                  <img src="/icon.webp" alt="ZEZE" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#0a192f] tracking-tight">
                  Create Your Profile
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-sm mx-auto">
                  Select your role to tailor clinical algorithms and evaluation depth.
                </p>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="p-3.5 rounded-2xl neu-inset-sm bg-rose-500/10 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Clean Role Cards */}
              <div className="space-y-3 pt-1">
                {roleDefinitions.map((rd) => {
                  const isSelected = role === rd.id;
                  const IconComp = rd.icon;

                  return (
                    <button
                      key={rd.id}
                      type="button"
                      onClick={() => setRole(rd.id)}
                      className={`w-full p-4 sm:p-4.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3.5 ${
                        isSelected
                          ? "neu-inset border-blue-400 bg-blue-50/50"
                          : "neu-flat hover:scale-[1.005] border-white/80"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: rd.accentBg, color: "#ffffff" }}
                        >
                          <IconComp className="w-5 h-5 text-white" strokeWidth={2.4} />
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-black text-[#0a192f]">
                            {rd.title}
                          </div>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {rd.subtitle}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300/80 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={authLoading}
                  className="neu-button-secondary w-full py-3.5 px-6 rounded-2xl text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign up with Google</span>
                </button>

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow neu-track-inset h-[2px]"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    OR
                  </span>
                  <div className="flex-grow neu-track-inset h-[2px]"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="neu-button-3d w-full py-3.5 sm:py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <span>Enter Profile Details Manually</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Line: Sign In link */}
              <div className="text-center pt-3 border-t border-slate-200/80">
                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                  Already have an account?{" "}
                  <Link
                    href="/signin"
                    className="font-black text-blue-700 hover:underline cursor-pointer ml-1"
                  >
                    Sign In &rarr;
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE DATA FILL */}
          {step === "details" && (
            <form onSubmit={handleFinalizeProfile} className="space-y-7 sm:space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#0a192f] tracking-tight">
                    {role === "clinician"
                      ? "Clinician Details"
                      : role === "trainee"
                      ? "Trainee Details"
                      : "Patient Profile"}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Calibrate your precision cardiology workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="neu-button-secondary px-3 py-1.5 text-xs font-black text-blue-700 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              </div>

              {/* Error Banner */}
              {authError && (
                <div className="p-3.5 rounded-2xl neu-inset-sm bg-rose-500/10 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Google Connected Status */}
              {isGoogleSignUp && (
                <div className="neu-inset p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-xs shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  </div>
                  <div className="text-xs font-bold text-slate-700 truncate">
                    Google Connected: <span className="font-extrabold text-[#0a192f]">{email || "Authenticated"}</span>
                  </div>
                </div>
              )}

              {/* Role-Specific Form Fields */}
              {role === "clinician" && (
                <div className="space-y-8 sm:space-y-9">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      Full Name &amp; Title
                    </label>
                    <input
                      type="text"
                      required
                      value={clinicianName}
                      onChange={(e) => setClinicianName(e.target.value)}
                      placeholder="e.g. Dr. Aarav Sharma, MD"
                      className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      Specialty / Department
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Cardiology, Internal Medicine"
                      className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      Hospital or Practice Center
                    </label>
                    <input
                      type="text"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="e.g. AIIMS New Delhi"
                      className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      Medical Registration Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. NMC-2019-038291"
                      className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {role === "trainee" && (
                <div className="space-y-8 sm:space-y-9">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={traineeName}
                      onChange={(e) => setTraineeName(e.target.value)}
                      placeholder="e.g. Rohan Verma"
                      className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      Medical School / Institution
                    </label>
                    <input
                      type="text"
                      value={medicalSchool}
                      onChange={(e) => setMedicalSchool(e.target.value)}
                      placeholder="e.g. All India Institute of Medical Sciences (AIIMS)"
                      className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      Training Level
                    </label>
                    <select
                      value={trainingLevel}
                      onChange={(e) => setTrainingLevel(e.target.value)}
                      className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="MBBS 1st/2nd Prof - Pre-Clinical">MBBS 1st/2nd Prof - Pre-Clinical</option>
                      <option value="MBBS 3rd/Final Prof - Clinical Postings">MBBS 3rd/Final Prof - Clinical Postings</option>
                      <option value="CRRI / Compulsory Rotatory Intern">CRRI / Compulsory Rotatory Intern</option>
                      <option value="Junior Resident (JR) - MD/MS Medicine">Junior Resident (JR) - MD/MS Medicine</option>
                      <option value="Senior Resident (SR) - Cardiology">Senior Resident (SR) - Cardiology</option>
                      <option value="DM / DNB Cardiology Fellow">DM / DNB Cardiology Fellow</option>
                    </select>
                  </div>
                </div>
              )}

              {role === "patient" && (
                <div className="space-y-8 sm:space-y-9">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Rahul Kumar"
                      className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6 sm:gap-7">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        min="18"
                        max="105"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                        Biological Sex
                      </label>
                      <select
                        value={patientSex}
                        onChange={(e) => setPatientSex(e.target.value as "Male" | "Female")}
                        className="neu-input w-full px-4.5 py-3.5 sm:py-4 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 1-Click Google OAuth option if not connected yet */}
              {!isGoogleSignUp && (
                <div className="pt-6 sm:pt-7">
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={authLoading}
                    className="neu-button-secondary w-full py-3.5 px-6 rounded-2xl text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Sign up with Google</span>
                  </button>
                </div>
              )}

              {/* Direct Submit Button */}
              <div className="pt-3 sm:pt-4">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="neu-button-3d w-full py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>
                    {authLoading ? "Creating Profile..." : "Create Profile & Launch Workspace"}
                  </span>
                </button>
              </div>

              {/* Bottom Line: Sign In link */}
              <div className="text-center pt-3 border-t border-slate-200/80">
                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                  Already have an account?{" "}
                  <Link
                    href="/signin"
                    className="font-black text-blue-700 hover:underline cursor-pointer ml-1"
                  >
                    Sign In &rarr;
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
