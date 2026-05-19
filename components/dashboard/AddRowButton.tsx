"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { DataRow } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (row: DataRow) => void;
}

export default function AddRowButton({ isOpen, onClose, onSuccess }: Props) {
  const DEFAULT = { fieldOne: "unlisted", fieldTwo: "unlisted", fieldThree: "unlisted" };
  const [fields, setFields] = useState(DEFAULT);
  const [errors, setErrors] = useState<Partial<typeof DEFAULT>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  function handleChange(key: keyof typeof DEFAULT, val: string) {
    setFields((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function handleSubmit() {
    setApiError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/rows/add", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      onSuccess(data.data.row);
      setFields(DEFAULT);
      onClose();
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fieldConfig = [
    { key: "fieldOne"   as const, label: "Field One" },
    { key: "fieldTwo"   as const, label: "Field Two" },
    { key: "fieldThree" as const, label: "Field Three" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Row"
      subtitle='Fields default to "unlisted"'
      icon={
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      }
      iconBg="bg-emerald-50"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Add Row</Button>
        </>
      }
    >
      <div className="space-y-4">
        {fieldConfig.map(({ key, label }) => (
          <Input
            key={key}
            label={label}
            value={fields[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            error={errors[key]}
          />
        ))}
        {apiError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {apiError}
          </p>
        )}
      </div>
    </Modal>
  );
}