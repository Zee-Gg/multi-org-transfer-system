"use client";
import { useState } from "react";
import EmailForm from "@/components/auth/EmailForm";
import OtpForm   from "@/components/auth/OtpForm";
import type { Metadata } from "next";

type Step = "email" | "otp";

export default function LoginPage() {
  const [step, setStep]   = useState<Step>("email");
  const [email, setEmail] = useState("");

  function handleEmailSuccess(submittedEmail: string) {
    setEmail(submittedEmail);
    setStep("otp");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Wordmark */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">DataBridge</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/50 overflow-hidden">
          {/* Step indicator */}
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
              style={{ width: step === "email" ? "50%" : "100%" }}
            />
          </div>

          <div className="p-8">
            {step === "email" ? (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
                <p className="text-sm text-slate-500 mb-6">
                  Enter your organization email to receive a secure login code
                </p>
                <EmailForm onSuccess={handleEmailSuccess} />
              </div>
            ) : (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Check your email</h1>
                <p className="text-sm text-slate-500 mb-1">
                  We sent a 6-digit code to
                </p>
                <p className="text-sm font-semibold text-indigo-600 mb-6 truncate">{email}</p>
                <OtpForm email={email} onBack={() => setStep("email")} />
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Only registered organization emails can sign in
        </p>
      </div>
    </div>
  );
}