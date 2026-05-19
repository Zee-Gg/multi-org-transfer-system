"use client";
import TableRow from "./TableRow";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { DataRow } from "@/types";

interface Props {
  rows: DataRow[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  deletingId: number | null;
  pageSize: number;
  onDelete: (id: number) => void;
  onPageChange: (page: number) => void;
}

export default function DataTable({
  rows, total, page, totalPages, loading, deletingId,
  pageSize, onDelete, onPageChange,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-12 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200">
        {["#", "Field One", "Field Two", "Field Three", ""].map((h, i) => (
          <span
            key={i}
            className={`text-xs font-semibold text-slate-400 uppercase tracking-wider
              ${i === 0 ? "col-span-1" : i === 4 ? "col-span-2 text-right" : "col-span-3"}`}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Body */}
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
          <LoadingSpinner size="lg" className="text-indigo-500" />
          <span className="text-sm">Loading records...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-2 text-slate-400">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
            <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">No records yet</p>
          <p className="text-xs text-slate-400">Add a row or receive a data transfer</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((row, idx) => (
            <TableRow
              key={row.id}
              row={row}
              index={(page - 1) * pageSize + idx + 1}
              onDelete={onDelete}
              isDeleting={deletingId === row.id}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/80">
          <span className="text-xs text-slate-500">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <span className="px-3 py-1.5 text-xs text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}