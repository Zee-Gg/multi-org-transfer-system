"use client";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { DataRow } from "@/types";

interface Props {
  row: DataRow;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function TableRow({ row, index, onDelete, isDeleting }: Props) {
  return (
    <div className="grid grid-cols-12 gap-3 px-6 py-3.5 items-center hover:bg-slate-50/80 transition-colors duration-100 group">
      <span className="col-span-1 text-xs text-slate-400 font-mono tabular-nums">{index}</span>
      <span className="col-span-3 text-sm text-slate-800 font-medium truncate" title={row.field_one}>
        {row.field_one}
      </span>
      <span className="col-span-3 text-sm text-slate-600 truncate" title={row.field_two}>
        {row.field_two}
      </span>
      <span className="col-span-3 text-sm text-slate-600 font-mono truncate" title={row.field_three}>
        {row.field_three}
      </span>
      <div className="col-span-2 flex justify-end">
        <button
          onClick={() => onDelete(row.id)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150 disabled:cursor-not-allowed"
          title="Delete row"
          aria-label="Delete row"
        >
          {isDeleting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}