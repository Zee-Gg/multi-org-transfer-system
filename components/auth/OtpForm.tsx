"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Props {
  email: string;
  onBack: () => void;
}

export default function OtpForm({ email, onBack }: Props) {
  const router = useRouter();
  const [digits, setDigits]   = useState<string[]>(Array(6).fill(""));
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent]   = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyingRef = useRef(false);

  const code = digits.join("");

  const verify = useCallback(async (fullCode: string) => {
    // Prevent multiple concurrent verifications
    if (verifyingRef.current) return;
    verifyingRef.current = true;

    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/auth/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.toLowerCase().trim(), code: fullCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        setDigits(Array(6).fill(""));
        refs.current[0]?.focus();
        verifyingRef.current = false;
        return;
      }

      router.push(`/dashboard/${data.data.orgSlug}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      verifyingRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [email, router]);

  useEffect(() => {
    // Only verify when code is complete and not already verifying
    if (code.length === 6 && !loading && !verifyingRef.current) {
      verify(code);
    }
  }, [code, loading, verify]);

  function handleChange(i: number, val: string) {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (char && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0)  refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleResend() {
    setResent(false);
    await fetch("/api/auth/send-otp", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });
    setResent(true);
    setDigits(Array(6).fill(""));
    refs.current[0]?.focus();
    setTimeout(() => setResent(false), 30_000);
  }

  return (
    <div className="space-y-5">
      {/* Code inputs */}
      <div className="flex gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            className={`
              w-full aspect-square text-center text-xl font-bold rounded-xl border-2
              text-slate-900 transition-all duration-150 focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${d ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 bg-white"}
              ${error ? "border-red-300 bg-red-50/30" : ""}
              focus:border-indigo-500 focus:bg-indigo-50/50
            `}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm animate-fade-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {resent && (
        <p className="text-sm text-emerald-600 text-center animate-fade-in">✓ New code sent!</p>
      )}

      {loading && (
        <p className="text-sm text-indigo-600 text-center animate-pulse">Verifying code...</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Different email
        </button>
        <button
          onClick={handleResend}
          disabled={resent}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Resend code
        </button>
      </div>
    </div>
  );
}