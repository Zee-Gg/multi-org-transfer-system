"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  rowCount: number;
}

export default function TransferModal({ isOpen, onClose, onSuccess, rowCount }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleTransfer() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/transfer", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: message.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onSuccess(data.message);
      setMessage("");
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Data"
      subtitle="Copy all records to the other organization"
      icon={
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleTransfer} loading={loading}>
            {loading ? "Transferring..." : "Confirm Transfer"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-700 font-bold text-sm">{rowCount.toLocaleString()}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-900">Records to transfer</p>
            <p className="text-xs text-indigo-600">Each org will maintain independent state post-transfer</p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-700 leading-relaxed">
            The recipient will receive an email notification. New rows added after this transfer will remain exclusive to your organization.
          </p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Message <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Add a note for the recipient organization..."
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{message.length}/500</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>
    </Modal>
  );
}