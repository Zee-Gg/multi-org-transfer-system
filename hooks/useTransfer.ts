"use client";
import { useState } from "react";

export function useTransfer(onSuccess: (msg: string) => void) {
  const [isOpen, setIsOpen]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function transfer(message?: string): Promise<void> {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/transfer", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onSuccess(data.message);
      setIsOpen(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return { isOpen, setIsOpen, loading, error, transfer };
}