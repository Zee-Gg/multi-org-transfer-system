"use client";
import { useState, useEffect, useCallback } from "react";
import type { DataRow, PaginatedRows } from "@/types";

const PAGE_SIZE = 20;

export function useRows() {
  const [rows, setRows]         = useState<DataRow[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRows = useCallback(async (p: number, query: string = "") => {
    setLoading(true);
    try {
      const endpoint = query
        ? `/api/rows/search?q=${encodeURIComponent(query)}&page=${p}&limit=${PAGE_SIZE}`
        : `/api/rows/list?page=${p}&limit=${PAGE_SIZE}`;
      const res  = await fetch(endpoint);
      const data = await res.json() as { success: boolean; data: PaginatedRows };
      if (data.success) {
        setRows(data.data.rows);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRows(page, searchQuery);
    }, 0);

    return () => clearTimeout(timeout);
  }, [page, searchQuery, fetchRows]);

  const deleteRow = useCallback(async (id: number): Promise<boolean> => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/rows/delete", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id }),
      });
      if (res.ok) {
        setRows((r) => r.filter((row) => row.id !== id));
        setTotal((t) => t - 1);
        return true;
      }
      return false;
    } finally {
      setDeletingId(null);
    }
  }, []);

  const addRow = useCallback((row: DataRow) => {
    setRows((r) => [row, ...r]);
    setTotal((t) => t + 1);
  }, []);

  const refresh = useCallback(() => fetchRows(page, searchQuery), [page, searchQuery, fetchRows]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  }, []);

  return {
    rows, total, page, totalPages, loading,
    deletingId, setPage, deleteRow, addRow, refresh, search,
    searchQuery, pageSize: PAGE_SIZE,
  };
}