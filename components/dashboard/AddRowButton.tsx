"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { DataRow } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (row: DataRow) => void;
}

export default function AddRowButton({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState("");

  async function handleSubmit() {
    setApiError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/rows/add", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error); return; }
      onSuccess(data.data.row);
      onClose();
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Row"
      subtitle='A new row will be added with "unlisted" defaults'
      icon={
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" 
        stroke="currentColor" strokeWidth={2}>
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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center 
          justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" 
            stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" 
              d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-900">New row will be created</p>
            <p className="text-xs text-emerald-600">
              All fields initialized to &quotunlisted&quot;
            </p>
          </div>
        </div>

        {apiError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 
          rounded-lg px-3 py-2">
            {apiError}
          </p>
        )}
      </div>
    </Modal>
  );
}