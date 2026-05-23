"use client";
import { useState, useCallback } from "react";
import DashboardHeader  from "@/components/dashboard/DashboardHeader";
import StatsBar         from "@/components/dashboard/StatsBar";
import RowSearch        from "@/components/dashboard/RowSearch";
import DataTable        from "@/components/dashboard/DataTable";
import TransferModal    from "@/components/dashboard/TransferModal";
import AddRowButton     from "@/components/dashboard/AddRowButton";
import Toast            from "@/components/ui/Toast";
import { useRows }      from "@/hooks/useRows";
import type { SessionPayload, DataRow, ToastData } from "@/types";

// Add ToastData to types/index.ts if not there
interface Props { session: SessionPayload }

export default function DashboardShell({ session }: Props) {
  const {
    rows, total, page, totalPages, loading, deletingId,
    pageSize, setPage, deleteRow, addRow, refresh, search, searchQuery,
  } = useRows();

  const [showTransfer, setShowTransfer] = useState(false);
  const [showAddRow, setShowAddRow]     = useState(false);
  const [toast, setToast]               = useState<{ id: string; message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ id: Date.now().toString(), message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  async function handleDelete(id: string) {
    const ok = await deleteRow(id);
    if (ok) showToast("Row deleted successfully");
    else showToast("Failed to delete row", "error");
  }

  function handleTransferSuccess(message: string) {
    showToast(message);
    refresh();
  }

  function handleAddSuccess(row: DataRow) {
    addRow(row);
    showToast("Row added successfully");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardHeader session={session} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full animate-fade-in">
        <StatsBar
          total={total}
          orgName={session.orgName}
          orgSlug={session.orgSlug}
          onTransfer={() => setShowTransfer(true)}
          onAddRow={() => setShowAddRow(true)}
        />

        <RowSearch 
          onSearch={search}
          loading={loading}
          resultCount={searchQuery ? total : undefined}
        />

        <DataTable
          rows={rows}
          total={total}
          page={page}
          totalPages={totalPages}
          loading={loading}
          deletingId={deletingId}
          pageSize={pageSize}
          onDelete={handleDelete}
          onPageChange={setPage}
        />
      </main>

      {/* Modals */}
      <TransferModal
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        onSuccess={handleTransferSuccess}
        rowCount={total}
      />
      <AddRowButton
        isOpen={showAddRow}
        onClose={() => setShowAddRow(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Toast notifications */}
      <Toast toast={toast} />
    </div>
  );
}