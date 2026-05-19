"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "otp";

export function useAuth() {
  const router = useRouter();
  const [step, setStep]       = useState<Step>("email");
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function sendOtp(inputEmail: string) {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: inputEmail }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 200) { setError(data.error); return; }
      setEmail(inputEmail);
      setStep("otp");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(code: string) {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/auth/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/dashboard/${data.data.orgSlug}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return { step, email, loading, error, sendOtp, verifyOtp, goBack: () => setStep("email") };
}