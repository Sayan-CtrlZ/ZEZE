"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { resetPasswordEmail } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPasswordEmail(email);
      setSent(true);
    } catch (err: unknown) {
      console.error("[Forgot Password] Error:", err);
      setError("Something went wrong. Please check the email and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-dvh sm:min-h-screen relative p-3 sm:p-8 flex flex-col justify-center items-center overflow-hidden sm:overflow-auto bg-[#edf3f9]">
      <div className="w-full max-w-lg mx-auto my-auto">
        {/* Neumorphic Card */}
        <div className="neu-card-glass p-4 sm:p-10 rounded-2xl sm:rounded-3xl border border-white/80 relative overflow-hidden">
          <div className="space-y-3 sm:space-y-6">
            {/* Header */}
            <div className="text-center space-y-0.5 sm:space-y-1.5">
              <div className="w-9 h-9 sm:w-14 sm:h-14 mx-auto rounded-xl sm:rounded-2xl neu-flat flex items-center justify-center p-1.5 sm:p-2.5 bg-[#edf3f9] border border-white/80 shadow-sm mb-1.5 sm:mb-3">
                <img src="/icon.webp" alt="ZEZE" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl sm:text-4xl font-black text-[#0a192f] tracking-tight">
                Reset Password
              </h1>
              <p className="text-[11px] sm:text-sm font-semibold text-slate-600 max-w-sm mx-auto line-clamp-2 sm:line-clamp-none">
                Enter your registered email address and we will dispatch a secure password reset link.
              </p>
            </div>

            {/* Success Banner */}
            {sent ? (
              <div className="neu-inset p-3.5 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-300 text-emerald-900 space-y-2.5 sm:space-y-3 animate-in fade-in duration-200 text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-emerald-950">
                    Reset Link Dispatched
                  </h3>
                  <p className="text-[11px] sm:text-xs font-semibold text-emerald-800 mt-0.5 sm:mt-1">
                    Check your inbox at <strong>{email}</strong> for instructions to reset your password.
                  </p>
                </div>
                <div className="pt-1 sm:pt-2">
                  <Link
                    href="/signin"
                    className="neu-button-3d inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 text-xs font-black uppercase tracking-wider rounded-xl"
                  >
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
                {/* Error Banner */}
                {error && (
                  <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl neu-inset-sm bg-rose-500/10 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-start gap-2 animate-in fade-in duration-200">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700 mb-1 sm:mb-2.5">
                    Registered Email Address
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

                <div className="pt-1 sm:pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="neu-button-3d w-full py-2.5 sm:py-4 px-4 sm:px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer active:scale-95 disabled:opacity-60 rounded-xl sm:rounded-2xl"
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    <span>{loading ? "Sending..." : "Send Reset Instructions"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Line: Back to Sign In */}
            <div className="text-center pt-2 sm:pt-4 border-t border-slate-200/80">
              <Link
                href="/signin"
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-sm font-black text-blue-700 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
