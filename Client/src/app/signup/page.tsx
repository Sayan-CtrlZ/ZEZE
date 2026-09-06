"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Stethoscope,
  GraduationCap,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Home,
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  // Unified flow state:
  // - "signin": Sign In screen (only credentials / Google OAuth)
  // - "role": Step 1 of Sign Up (Role Select)
  // - "details": Step 2 of Sign Up (Profile data fill + credentials + Direct Create)
  // - "forgot_password": Password recovery
  const [step, setStep] = useState<"signin" | "role" | "details" | "forgot_password">("role");

  // Track if Google OAuth was selected for sign-up (prompts profile completion first)
  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);

  // Step 1: Role Selection
  const [role, setRole] = useState<"clinician" | "trainee" | "patient">("clinician");

  // Step 2: Role Details
  const [clinicianName, setClinicianName] = useState("");
  const [specialty, setSpecialty] = useState("Cardiology / Internal Medicine");
  const [hospital, setHospital] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const [traineeName, setTraineeName] = useState("");
  const [medicalSchool, setMedicalSchool] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("MS3 - Clinical Rotations");
  const [academicFocus, setAcademicFocus] = useState("Cardiovascular Pathophysiology");

  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("55");
  const [patientSex, setPatientSex] = useState<"Male" | "Female">("Male");
  const [healthGoal, setHealthGoal] = useState("Routine Cardiovascular Assessment");

  // Credentials (Sign Up & Sign In)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Resolved user name
  const resolvedName =
    role === "clinician"
      ? clinicianName.trim() || "Dr. Sarah Jenkins, MD"
      : role === "trainee"
      ? traineeName.trim() || "Alex Rivera, Medical Trainee"
      : patientName.trim() || "John Doe";

  const handleFinalizeAuth = (authType: "signup" | "signin" | "google") => {
    let activeRole = role;

    if (authType === "signin" && typeof window !== "undefined") {
      const savedRole = sessionStorage.getItem("zeze_selected_role");
      if (savedRole === "clinician" || savedRole === "trainee" || savedRole === "patient") {
        activeRole = savedRole;
      }
    }

    const userProfile = {
      name: authType === "signin" ? (email ? email.split("@")[0] : resolvedName) : resolvedName,
      role: activeRole,
      email: email || (authType === "google" || isGoogleSignUp ? "google.user@health.org" : "user@zeze.ai"),
      authMethod: isGoogleSignUp || authType === "google" ? "google" : authType,
      details:
        activeRole === "clinician"
          ? { specialty, hospital: hospital || "City Heart Center", licenseNumber }
          : activeRole === "trainee"
          ? { medicalSchool: medicalSchool || "University Hospital School of Medicine", trainingLevel, academicFocus }
          : { age: patientAge, sex: patientSex, goal: healthGoal },
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("zeze_user", JSON.stringify(userProfile));
      sessionStorage.setItem("zeze_profile", JSON.stringify({ name: userProfile.name, role: activeRole }));
      sessionStorage.setItem("zeze_selected_role", activeRole);
    }

    router.push(`/assessment?role=${activeRole}`);
  };

  const handleGoogleSignUp = () => {
    setIsGoogleSignUp(true);
    const googleEmail = "alex.chen.md@cardio-health.org";
    setEmail(googleEmail);
    if (!clinicianName) setClinicianName("Dr. Alex Chen, MD");
    if (!traineeName) setTraineeName("Alex Chen");
    if (!patientName) setPatientName("Alex Chen");
    setStep("details");
  };

  const handleGoogleSignInDirect = () => {
    handleFinalizeAuth("google");
  };

  const roleDefinitions = [
    {
      id: "clinician" as const,
      title: "Clinician / Doctor",
      badge: "Clinical DSS",
      icon: Stethoscope,
      accentBg: "#2563eb",
      description:
        "Physicians, cardiologists, and practitioners requiring ACC/AHA staging, Laplace wall stress mechanics, and differential diagnosis.",
    },
    {
      id: "trainee" as const,
      title: "Healthcare Trainee / Student",
      badge: "Supervised Learning",
      icon: GraduationCap,
      accentBg: "#7c3aed",
      description:
        "Medical students and residents learning hemodynamic equations, clinical guidelines, feature weights, and risk factor interactions.",
    },
    {
      id: "patient" as const,
      title: "Patient / General User",
      badge: "Personal Health Guidance",
      icon: User,
      accentBg: "#0d9488",
      description:
        "Individuals seeking plain-language translations of cardiac vitals, lifestyle prevention roadmaps, and doctor discussion guides.",
    },
  ];

  return (
    <main className="min-h-screen relative p-4 sm:p-8 flex flex-col justify-center items-center overflow-x-hidden bg-[#edf3f9]">
      <div className="w-full max-w-3xl lg:max-w-4xl mx-auto my-auto space-y-6">
        {/* Top Bar with Home Link */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="neu-button-secondary inline-flex items-center gap-2 px-4 py-2.5 text-slate-800 font-black text-xs sm:text-sm active:scale-95"
          >
            <Home className="w-4 h-4 text-slate-700" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl neu-flat flex items-center justify-center p-1.5 bg-[#edf3f9] border border-white/80 shadow-sm">
              <img src="/icon.webp" alt="ZEZE" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-sm tracking-tight text-[#0a192f]">ZEZE MED AI</span>
          </div>
        </div>

        {/* Neumorphic Glass Card */}
        <div className="neu-card-glass p-6 sm:p-10 lg:p-12 space-y-6">
          {/* =========================================================================
              PATH A - SIGN IN (ONLY CREDENTIALS / GOOGLE OAUTH)
             ========================================================================= */}
          {step === "signin" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="neu-inset-sm inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-900">
                    <LogIn className="w-3.5 h-3.5 text-blue-600" />
                    Account Sign In
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-[#0a192f] tracking-tight mt-1">
                  Welcome Back
                </h1>
                <p className="text-sm sm:text-base font-semibold text-slate-600 mt-1">
                  Enter your credentials or use Google OAuth to access your calibrated assessment workspace.
                </p>
              </div>

              {/* Google OAuth Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignInDirect}
                  className="neu-button-secondary w-full py-3.5 px-6 rounded-2xl text-slate-800 font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95"
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
                  <span>Sign in with Google</span>
                </button>
              </div>

              {/* Inset Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow neu-track-inset h-[2px]"></div>
                <span className="flex-shrink mx-4 text-xs font-black uppercase tracking-widest text-slate-500">
                  Or with Email Credentials
                </span>
                <div className="flex-grow neu-track-inset h-[2px]"></div>
              </div>

              {/* Credentials Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFinalizeAuth("signin");
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@cardio-center.org"
                      className="neu-input w-full pl-12 pr-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="neu-input w-full pl-12 pr-12 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setStep("forgot_password");
                    }}
                    className="font-black text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="neu-button-3d w-full py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                  >
                    <span>Sign In &amp; Enter Workspace</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Bottom Line: Create Profile */}
              <div className="text-center pt-4 border-t border-slate-200/80">
                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleSignUp(false);
                      setStep("role");
                    }}
                    className="font-black text-blue-700 hover:underline cursor-pointer ml-1"
                  >
                    Create Profile &rarr;
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              PATH B - SIGN UP: STEP 1 (ROLE SELECT)
             ========================================================================= */}
          {step === "role" && (
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <span className="neu-inset-sm inline-block px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-900">
                  Persona Setup
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-[#0a192f] tracking-tight">
                  Who are you?
                </h1>
                <p className="text-sm sm:text-base font-semibold text-slate-600 max-w-lg mx-auto">
                  Select your role first. Next, enter your details and proceed directly to workspace creation.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {roleDefinitions.map((rd) => {
                  const isSelected = role === rd.id;
                  const IconComp = rd.icon;

                  return (
                    <button
                      key={rd.id}
                      type="button"
                      onClick={() => setRole(rd.id)}
                      className={`w-full p-5 sm:p-6 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? "neu-inset border-blue-400 bg-blue-50/50"
                          : "neu-flat hover:scale-[1.005] border-white/80"
                      }`}
                    >
                      <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                        <div
                          className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                          style={{ backgroundColor: rd.accentBg, color: "#ffffff" }}
                        >
                          <IconComp className="w-7 h-7 text-white" strokeWidth={2.4} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base sm:text-xl font-black text-[#0a192f]">
                              {rd.title}
                            </span>
                            <span className="neu-inset-sm text-[10px] sm:text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full text-slate-700 border border-slate-300/60">
                              {rd.badge}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1 leading-relaxed">
                            {rd.description}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 className="w-7 h-7 text-blue-600 shrink-0 ml-2" />
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2 border-slate-300/80 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="neu-button-3d w-full py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <span>Continue to Profile Details</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Line: Sign In link */}
              <div className="text-center pt-4 border-t border-slate-200/80">
                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleSignUp(false);
                      setStep("signin");
                    }}
                    className="font-black text-blue-700 hover:underline cursor-pointer ml-1"
                  >
                    Sign In &rarr;
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              PATH B - SIGN UP: STEP 2 (PROFILE DATA FILL & DIRECT CREATE BUTTON)
             ========================================================================= */}
          {step === "details" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFinalizeAuth(isGoogleSignUp ? "google" : "signup");
              }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="neu-inset-sm inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-900">
                    Step 2: Complete Profile
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight mt-1.5">
                    {isGoogleSignUp ? "Complete Your Profile" : role === "clinician"
                      ? "Clinician Profile Details"
                      : role === "trainee"
                      ? "Trainee Academic Details"
                      : "Patient Health Profile"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="neu-button-secondary px-3 py-1.5 text-xs font-black text-blue-700 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Role</span>
                </button>
              </div>

              {/* Google OAuth Connected Status Banner */}
              {isGoogleSignUp && (
                <div className="neu-inset p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0">
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
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#0a192f] truncate">
                        Google OAuth Connected: {email || "alex.chen.md@cardio-health.org"}
                      </div>
                      <div className="text-[11px] font-semibold text-blue-900">
                        Step 2 of 2: Fill profile details to calibrate the diagnostic model.
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase shrink-0">
                    Verified
                  </span>
                </div>
              )}

              {/* Role Summary Pill */}
              <div className="neu-inset flex items-center gap-2.5 p-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-800">
                <span className="text-slate-500 uppercase text-[11px] font-black">Active Persona:</span>
                <span className="px-3 py-1 rounded-full bg-blue-100/90 text-blue-950 border border-blue-300 font-extrabold text-xs">
                  {role === "clinician"
                    ? "Clinician / Doctor"
                    : role === "trainee"
                    ? "Healthcare Trainee"
                    : "Patient / General User"}
                </span>
              </div>

              {/* Role-Specific Fields */}
              {role === "clinician" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Name &amp; Title
                    </label>
                    <input
                      type="text"
                      required
                      value={clinicianName}
                      onChange={(e) => setClinicianName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Jenkins, MD"
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Specialty / Clinical Department
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Cardiology, Internal Medicine"
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Hospital or Practice Center
                    </label>
                    <input
                      type="text"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="e.g. Metropolitan Heart Hospital"
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      NPI or Medical License Number <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. NPI-19482048"
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {role === "trainee" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Trainee / Student Name
                    </label>
                    <input
                      type="text"
                      required
                      value={traineeName}
                      onChange={(e) => setTraineeName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Medical School / Institution
                    </label>
                    <input
                      type="text"
                      value={medicalSchool}
                      onChange={(e) => setMedicalSchool(e.target.value)}
                      placeholder="e.g. Johns Hopkins School of Medicine"
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Training Level / Program
                    </label>
                    <select
                      value={trainingLevel}
                      onChange={(e) => setTrainingLevel(e.target.value)}
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="Pre-Med / Undergraduate">Pre-Med / Undergraduate</option>
                      <option value="MS1-MS2 Pre-Clinical">MS1-MS2 Pre-Clinical</option>
                      <option value="MS3 - Clinical Rotations">MS3 - Clinical Rotations</option>
                      <option value="MS4 - Sub-Internship">MS4 - Sub-Internship</option>
                      <option value="Resident Physician">Resident Physician</option>
                      <option value="Cardiology Fellow">Cardiology Fellow</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Primary Learning Area
                    </label>
                    <input
                      type="text"
                      value={academicFocus}
                      onChange={(e) => setAcademicFocus(e.target.value)}
                      placeholder="e.g. Hemodynamics, Endothelial Strain"
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {role === "patient" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Your Name or Preferred Alias
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="55"
                        className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Biological Sex
                      </label>
                      <select
                        value={patientSex}
                        onChange={(e) => setPatientSex(e.target.value as "Male" | "Female")}
                        className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Primary Health Goal
                    </label>
                    <select
                      value={healthGoal}
                      onChange={(e) => setHealthGoal(e.target.value)}
                      className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="Routine Cardiovascular Assessment">Routine Cardiovascular Assessment</option>
                      <option value="Monitoring Blood Pressure Trends">Monitoring Blood Pressure Trends</option>
                      <option value="Diet & Physical Activity Advice">Diet &amp; Physical Activity Advice</option>
                      <option value="Family History Risk Check">Family History Risk Check</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Credentials Section (Hidden if Google OAuth already linked) */}
              {!isGoogleSignUp && (
                <div className="pt-3 border-t border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Account Credentials
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Instant Access
                    </span>
                  </div>

                  {/* 1-Click Google Sign Up */}
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="neu-button-secondary w-full py-3.5 px-6 rounded-2xl text-slate-800 font-bold text-sm flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-95"
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
                    <span>Sign up with Google (Authenticates &amp; Links Profile)</span>
                  </button>

                  <div className="relative flex py-0.5 items-center">
                    <div className="flex-grow neu-track-inset h-[2px]"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Or set email &amp; password
                    </span>
                    <div className="flex-grow neu-track-inset h-[2px]"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="physician@hospital.org"
                          className="neu-input w-full pl-10 pr-4 py-3 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="neu-input w-full pl-10 pr-10 py-3 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="neu-input w-full pl-10 pr-4 py-3 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DIRECT CREATE / COMPLETE PROFILE BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="neu-button-3d w-full py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                >
                  <span>
                    {isGoogleSignUp
                      ? "Complete Profile & Launch Workspace"
                      : "Create Profile & Launch Workspace"}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Line: Sign In link */}
              <div className="text-center pt-3 border-t border-slate-200/80">
                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleSignUp(false);
                      setStep("signin");
                    }}
                    className="font-black text-blue-700 hover:underline cursor-pointer ml-1"
                  >
                    Sign In &rarr;
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* =========================================================================
              PATH C - FORGOT PASSWORD FLOW
             ========================================================================= */}
          {step === "forgot_password" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="neu-inset-sm inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-900">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    Password Recovery
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight mt-1">
                  Reset Your Password
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                  Enter the email address registered with your clinical profile and we'll send you recovery instructions.
                </p>
              </div>

              {resetSent ? (
                <div className="neu-inset p-6 rounded-2xl bg-emerald-50/70 border border-emerald-300 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-black text-emerald-950">
                    Recovery Email Sent!
                  </h4>
                  <p className="text-sm font-medium text-emerald-900">
                    We've dispatched password reset instructions to{" "}
                    <span className="font-bold text-emerald-950">{forgotEmail || "your email"}</span>.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("signin")}
                      className="neu-button-3d py-3 px-6 text-xs sm:text-sm font-black uppercase cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setResetSent(true);
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Account Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. physician@hospital.org"
                        className="neu-input w-full pl-12 pr-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="neu-button-3d w-full py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Send Reset Instructions</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("signin")}
                      className="neu-button-secondary px-4 py-2 text-xs sm:text-sm font-black text-blue-700 inline-flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
