"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  LogIn,
} from "lucide-react";
import {
  loginWithEmail,
  loginWithGoogle,
  GoogleAccountNotFoundError,
} from "@/lib/firebase";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle direct Email & Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Please enter your email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    let activeRole = "clinician";
    if (typeof window !== "undefined") {
      const savedRole = sessionStorage.getItem("zeze_selected_role");
      if (savedRole === "clinician" || savedRole === "trainee" || savedRole === "patient") {
        activeRole = savedRole;
      }
    }

    try {
      const user = await loginWithEmail(email, password);
      const targetRole = user?.role || activeRole;
      router.push(`/assessment?role=${targetRole}`);
    } catch (err: unknown) {
      console.error("[Sign In] Error:", err);
      setAuthError("Invalid email or password. Please verify and try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Google OAuth Sign In with Account Existence Verification
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await loginWithGoogle("signin");
      if (res?.profile) {
        router.push(`/assessment?role=${res.profile.role || "clinician"}`);
      }
    } catch (err: unknown) {
      if (err instanceof GoogleAccountNotFoundError) {
        // Account does not exist in system: redirect to sign up with notice & prefill
        const encodedEmail = encodeURIComponent(err.email || "");
        const encodedName = encodeURIComponent(err.userName || "");
        router.push(`/signup?step=role&google=1&email=${encodedEmail}&name=${encodedName}&not_found=1`);
      } else if (err instanceof Error && err.message.includes("cancelled")) {
        setAuthError(null);
      } else {
        console.error("[Google Sign-In] Error:", err);
        setAuthError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="h-dvh sm:min-h-screen relative p-3 sm:p-8 flex flex-col justify-center items-center overflow-hidden sm:overflow-auto bg-[#edf3f9]">
      <div className="w-full max-w-lg mx-auto my-auto">
        {/* Neumorphic Sign In Card */}
        <div className="neu-card-glass p-4 sm:p-10 rounded-2xl sm:rounded-3xl border border-white/80 relative overflow-hidden">
          <div className="space-y-3 sm:space-y-6">
            {/* Header */}
            <div className="text-center space-y-0.5 sm:space-y-1.5">
              <div className="w-9 h-9 sm:w-14 sm:h-14 mx-auto rounded-xl sm:rounded-2xl neu-flat flex items-center justify-center p-1.5 sm:p-2.5 bg-[#edf3f9] border border-white/80 shadow-sm mb-1.5 sm:mb-3">
                <img src="/icon.webp" alt="ZEZE" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl sm:text-4xl font-black text-[#0a192f] tracking-tight">
                Welcome Back
              </h1>
              <p className="text-[11px] sm:text-sm font-semibold text-slate-600 max-w-sm mx-auto line-clamp-2 sm:line-clamp-none">
                Sign in to your clinical evaluation and precision cardiology workspace.
              </p>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl neu-inset-sm bg-rose-500/10 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-start gap-2 animate-in fade-in duration-200">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* 1-Click Google OAuth Sign In */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="neu-button-secondary w-full py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 sm:gap-3 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
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

            {/* Divider */}
            <div className="relative flex py-0 sm:py-0.5 items-center">
              <div className="flex-grow neu-track-inset h-[2px]"></div>
              <span className="flex-shrink mx-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">
                Or continue with credentials
              </span>
              <div className="flex-grow neu-track-inset h-[2px]"></div>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-2.5 sm:space-y-6">
              <div>
                <label className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700 mb-1 sm:mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-2.5 sm:left-3.5 sm:top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@aiims.edu"
                    className="neu-input w-full pl-9 pr-3.5 py-2 sm:pl-10 sm:pr-4 sm:py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] sm:text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-2.5 sm:left-3.5 sm:top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="neu-input w-full pl-9 pr-9 py-2 sm:pl-10 sm:pr-10 sm:py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 sm:right-3.5 sm:top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5 sm:pt-1">
                <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-[11px] sm:text-xs font-bold text-slate-600">Remember session</span>
                </label>
              </div>

              <div className="pt-1 sm:pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="neu-button-3d w-full py-2.5 sm:py-4 px-4 sm:px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer active:scale-95 disabled:opacity-60 rounded-xl sm:rounded-2xl"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  <span>{authLoading ? "Signing In..." : "Sign In to Workspace"}</span>
                </button>
              </div>
            </form>

            {/* Bottom Line: Create Profile Link */}
            <div className="text-center pt-2 sm:pt-4 border-t border-slate-200/80">
              <p className="text-[11px] sm:text-sm text-slate-600 font-semibold">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="font-black text-blue-700 hover:underline cursor-pointer ml-1"
                >
                  Create Profile &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
