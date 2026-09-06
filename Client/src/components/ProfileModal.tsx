"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Stethoscope,
  GraduationCap,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  KeyRound,
  LogIn,
} from "lucide-react";

import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  resetPasswordEmail,
  GoogleAccountNotFoundError,
  type RoleDetails,
} from "@/lib/firebase";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: string;
  initialTab?: "signup" | "signin";
  initialStep?: "signin" | "role" | "details" | "forgot_password";
}

export default function ProfileModal({
  isOpen,
  onClose,
  initialRole = "clinician",
  initialTab = "signup",
  initialStep,
}: ProfileModalProps) {
  const router = useRouter();

  // Unified flow state:
  // - "signin": Sign In screen (only credentials / Google OAuth)
  // - "role": Step 1 of Sign Up (Choose Persona)
  // - "details": Step 2 of Sign Up (Fill profile data + credentials + Direct Create)
  // - "forgot_password": Password recovery
  const [step, setStep] = useState<"signin" | "role" | "details" | "forgot_password">(
    initialStep || (initialTab === "signin" ? "signin" : initialRole ? "details" : "role")
  );

  // Track if Google OAuth was selected for sign-up (prompts profile completion first)
  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sign Up: Step 1 Role Selection
  const [role, setRole] = useState<"clinician" | "trainee" | "patient">(
    initialRole === "trainee" ? "trainee" : initialRole === "patient" ? "patient" : "clinician"
  );

  // Keep state synchronized whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setAuthError(null);
      if (initialRole === "trainee" || initialRole === "patient" || initialRole === "clinician") {
        setRole(initialRole);
      }

      if (initialStep) {
        setStep(initialStep);
      } else if (initialTab === "signin") {
        setStep("signin");
      } else if (initialRole) {
        // Open the corresponding selected role form directly
        setStep("details");
      } else {
        setStep("role");
      }
    }
  }, [isOpen, initialRole, initialTab, initialStep]);

  // Sign Up: Step 2 Role Details
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
  const [healthGoal, setHealthGoal] = useState("Routine Cardiovascular Assessment");

  // Credentials (Sign Up & Sign In)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  // Resolve active name based on selected role
  const resolvedName =
    role === "clinician"
      ? clinicianName.trim() || "Dr. Sarah Jenkins, MD"
      : role === "trainee"
      ? traineeName.trim() || "Alex Rivera, Medical Trainee"
      : patientName.trim() || "John Doe";

  const handleFinalizeAuth = async (authType: "signup" | "signin" | "google") => {
    setAuthLoading(true);
    setAuthError(null);

    let activeRole = role;

    // If signing in directly, check if a role was previously saved or default to clinician
    if (authType === "signin" && typeof window !== "undefined") {
      const savedRole = sessionStorage.getItem("zeze_selected_role");
      if (savedRole === "clinician" || savedRole === "trainee" || savedRole === "patient") {
        activeRole = savedRole;
      }
    }

    const roleDetails: RoleDetails =
      activeRole === "clinician"
        ? { specialty, hospital: hospital || "City Heart Center", licenseNumber }
        : activeRole === "trainee"
        ? { medicalSchool: medicalSchool || "University Hospital School of Medicine", trainingLevel, academicFocus }
        : { age: patientAge, sex: patientSex, healthGoal };

    const userName = authType === "signin" ? (email ? email.split("@")[0] : resolvedName) : resolvedName;

    try {
      if (authType === "signup") {
        if (password && confirmPassword && password !== confirmPassword) {
          setAuthError("Passwords do not match. Please verify.");
          setAuthLoading(false);
          return;
        }
        await registerWithEmail(
          email || "user@zeze.ai",
          password || "Temporary123!",
          {
            name: userName,
            role: activeRole,
            details: roleDetails,
          }
        );
      } else if (authType === "signin") {
        await loginWithEmail(email || "user@zeze.ai", password || "Temporary123!");
      } else if (authType === "google") {
        await loginWithGoogle("signup", activeRole, roleDetails);
      }

      onClose();
      router.push(`/assessment?role=${activeRole}`);
    } catch (err: unknown) {
      console.error("[Auth] Backend error:", err);
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Google OAuth clicked for Sign Up -> prompts profile completion
  const handleGoogleSignUp = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await loginWithGoogle("signup", role);
      setIsGoogleSignUp(true);
      if (res.email) setEmail(res.email);
      if (res.name) {
        if (role === "clinician") setClinicianName(res.name);
        else if (role === "trainee") setTraineeName(res.name);
        else setPatientName(res.name);
      }
      setStep("details");
    } catch (err: unknown) {
      const errObj = err as Error;
      if (errObj?.message?.includes("cancelled")) {
        setAuthError(null);
        setAuthLoading(false);
        return;
      }
      console.error("[Google Auth] Error:", err);
      setIsGoogleSignUp(true);
      setEmail("alex.chen.md@cardio-health.org");
      if (!clinicianName) setClinicianName("Dr. Alex Chen, MD");
      if (!traineeName) setTraineeName("Alex Chen");
      if (!patientName) setPatientName("Alex Chen");
      setStep("details");
    } finally {
      setAuthLoading(false);
    }
  };

  // Google OAuth clicked on Sign In -> checks if account exists, otherwise alert and send to Sign Up
  const handleGoogleSignInDirect = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await loginWithGoogle("signin");
      if (res?.profile) {
        onClose();
        router.push(`/assessment?role=${res.profile.role || "clinician"}`);
      }
    } catch (err: unknown) {
      if (err instanceof GoogleAccountNotFoundError) {
        setIsGoogleSignUp(true);
        if (err.email) setEmail(err.email);
        if (err.userName) {
          setClinicianName(err.userName);
          setTraineeName(err.userName);
          setPatientName(err.userName);
        }
        setAuthError(
          `No account found for Google email (${err.email}). You cannot sign in directly — please select your role and create your account.`
        );
        setStep("role");
      } else if (err instanceof Error && err.message.includes("cancelled")) {
        setAuthError(null);
      } else {
        console.error("[Google Sign-In] Error:", err);
        setAuthError("Something went wrong. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Forgot password submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await resetPasswordEmail(forgotEmail);
      setResetSent(true);
    } catch (err: unknown) {
      console.error("[Auth] Password reset error:", err);
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Neumorphic Ice Porcelain Modal Surface (No white halo on backdrop) */}
      <div
        className="w-full max-w-3xl lg:max-w-4xl bg-[#edf3f9] rounded-3xl p-6 sm:p-10 lg:p-12 border border-white/80 shadow-[0_25px_60px_-15px_rgba(10,25,47,0.5)] relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="neu-button-secondary absolute top-5 right-5 sm:top-7 sm:right-7 w-11 h-11 rounded-2xl flex items-center justify-center text-slate-700 hover:text-slate-900 transition-transform active:scale-95 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

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
              <h2 className="text-2xl sm:text-4xl font-black text-[#0a192f] tracking-tight mt-1">
                Welcome Back
              </h2>
              <p className="text-sm sm:text-base font-semibold text-slate-600 mt-1">
                Enter your credentials or use Google OAuth to access your calibrated assessment workspace.
              </p>
            </div>

            {/* Google OAuth Direct Sign In */}
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

            {/* Auth Error Display */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2.5">
                <span className="text-base">⚠️</span>
                <span>{authError}</span>
              </div>
            )}

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
                    placeholder="e.g. physician@hospital.org"
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
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
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
                    setAuthError(null);
                    setResetSent(false);
                    setStep("forgot_password");
                  }}
                  className="font-black text-blue-700 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit 3D CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="neu-button-3d w-full py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <span>{authLoading ? "Authenticating..." : "Sign In & Enter Workspace"}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Bottom Line: Switch to Sign Up */}
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
          <div className="space-y-6 animate-in fade-in duration-200">
            {authError && (
              <div className="p-4 rounded-2xl neu-inset-sm bg-rose-500/10 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="neu-inset-sm inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-900">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Step 1: Role Selection
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0a192f] tracking-tight mt-1">
                Who are you?
              </h2>
              <p className="text-sm sm:text-base font-semibold text-slate-600 mt-1">
                Select your persona to calibrate clinical depth, terminology, and evaluation tools.
              </p>
            </div>

            <div className="space-y-4">
              {roleDefinitions.map((rd) => {
                const isSelected = role === rd.id;
                const IconComponent = rd.icon;

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
                        style={{
                          backgroundColor: rd.accentBg,
                          color: "#ffffff",
                        }}
                      >
                        <IconComponent className="w-7 h-7 text-white" strokeWidth={2.4} />
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

            <div className="pt-3">
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
            className="space-y-6 animate-in fade-in duration-200"
          >
            {/* Auth Error Display */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2.5">
                <span className="text-base">⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <span className="neu-inset-sm inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-900">
                  Step 2: Complete Profile
                </span>
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="neu-button-secondary px-3 py-1.5 text-xs font-black text-blue-700 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Role</span>
                </button>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight mt-1.5">
                {isGoogleSignUp ? "Complete Your Profile" : role === "clinician"
                  ? "Clinician Profile Details"
                  : role === "trainee"
                  ? "Trainee Academic Details"
                  : "Patient Health Profile"}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                {isGoogleSignUp
                  ? "Please complete your clinical background details below to calibrate your workspace."
                  : "Fill in your details to configure your calibrated dashboard and create your account."}
              </p>
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

            {/* SECTION 1: ROLE SPECIFIC FIELDS */}
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
                    Specialty / Department
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
                    Hospital or Institution
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
                    License / NPI <span className="text-slate-500 font-normal">(Optional)</span>
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
                    Medical School / University
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
                    Current Training Level
                  </label>
                  <select
                    value={trainingLevel}
                    onChange={(e) => setTrainingLevel(e.target.value)}
                    className="neu-input w-full px-4 py-3.5 rounded-xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Pre-Med / Undergraduate">Pre-Med / Undergraduate</option>
                    <option value="MS1-MS2 Pre-Clinical">MS1-MS2 Pre-Clinical Years</option>
                    <option value="MS3 - Clinical Rotations">MS3 - Clinical Rotations</option>
                    <option value="MS4 - Advanced Sub-Internship">MS4 - Advanced Sub-Internship</option>
                    <option value="Internal Medicine Resident">Internal Medicine Resident</option>
                    <option value="Cardiology Fellow">Cardiology Fellow</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Primary Academic Focus
                  </label>
                  <input
                    type="text"
                    value={academicFocus}
                    onChange={(e) => setAcademicFocus(e.target.value)}
                    placeholder="e.g. Hemodynamics, Coronary Pathophysiology"
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
              </div>
            )}

            {/* SECTION 2: ACCOUNT CREDENTIALS (Omitted if Google OAuth already linked) */}
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
              </div>
            )}

            {/* DIRECT CREATE / COMPLETE PROFILE 3D BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={authLoading}
                className="neu-button-3d w-full py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <span>
                  {authLoading
                    ? "Creating Profile..."
                    : isGoogleSignUp
                    ? "Complete Profile & Launch Workspace"
                    : "Create Profile & Launch Workspace"}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Line: Sign In Link if account already exists */}
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
          <div className="space-y-6 animate-in fade-in duration-200">
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
                onSubmit={handleForgotPasswordSubmit}
                className="space-y-5"
              >
                {/* Auth Error Display */}
                {authError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2.5">
                    <span className="text-base">⚠️</span>
                    <span>{authError}</span>
                  </div>
                )}

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
                    disabled={authLoading}
                    className="neu-button-3d w-full py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    <span>{authLoading ? "Sending Instructions..." : "Send Reset Instructions"}</span>
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
  );
}
