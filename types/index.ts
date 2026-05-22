export interface Organization {
  id: string;
  name: string;
  email: string;
  slug: string;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface DataRow {
  id: string;
  org_id: string;
  transfer_id: string | null;
  field_one: string;
  field_two: string;
  field_three: string;
  is_deleted: boolean;
  created_at: string;
}

export interface Transfer {
  id: string;
  from_org_id: string;
  to_org_id: string;
  message: string | null;
  initiated_by: string;
  transferred_at: string;
}

export interface OtpToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface SessionPayload {
  userId: string;
  orgId: string;
  email: string;
  orgName: string;
  orgSlug: string;
}

export interface PaginatedRows {
  rows: DataRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}