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
    <main className="min-h-screen relative p-4 sm:p-8 flex flex-col justify-center items-center overflow-x-hidden bg-[#edf3f9]">
      <div className="w-full max-w-lg mx-auto my-auto">
        {/* Neumorphic Card */}
        <div className="neu-card-glass p-6 sm:p-10 rounded-3xl border border-white/80 relative overflow-hidden">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 mx-auto rounded-2xl neu-flat flex items-center justify-center p-2.5 bg-[#edf3f9] border border-white/80 shadow-sm mb-3">
                <img src="/icon.webp" alt="ZEZE" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#0a192f] tracking-tight">
                Reset Password
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-sm mx-auto">
                Enter your registered email address and we will dispatch a secure password reset link.
              </p>
            </div>

            {/* Success Banner */}
            {sent ? (
              <div className="neu-inset p-5 rounded-2xl bg-emerald-50/80 border border-emerald-300 text-emerald-900 space-y-3 animate-in fade-in duration-200 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">
                    Reset Link Dispatched
                  </h3>
                  <p className="text-xs font-semibold text-emerald-800 mt-1">
                    Check your inbox at <strong>{email}</strong> for instructions to reset your password.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/signin"
                    className="neu-button-3d inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-wider"
                  >
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-2xl neu-inset-sm bg-rose-500/10 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@aiims.edu"
                      className="neu-input w-full pl-10 pr-4 py-3 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="neu-button-3d w-full py-4 px-8 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>{loading ? "Sending..." : "Send Reset Instructions"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Line: Back to Sign In */}
            <div className="text-center pt-4 border-t border-slate-200/80">
              <Link
                href="/signin"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-blue-700 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
