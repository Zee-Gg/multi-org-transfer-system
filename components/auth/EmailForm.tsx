"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Props {
  onSuccess: (email: string) => void;
}

export default function EmailForm({ onSuccess }: Props) {
  const [email, setEmail]   = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res  = await fetch("/api/auth/send-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok && res.status !== 200) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      onSuccess(email);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Organization email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@organization.com"
        error={error}
        autoComplete="email"
        autoFocus
      />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        {loading ? "Sending code..." : "Continue with Email"}
      </Button>
    </form>
  );
}