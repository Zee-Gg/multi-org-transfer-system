export interface Organization {
  id: number;
  name: string;
  email: string;
  slug: string;
  created_at: string;
}

export interface DataRow {
  id: number;
  org_id: number;
  field_one: string;
  field_two: string;
  field_three: string;
  created_at: string;
}

export interface Transfer {
  id: number;
  from_org_id: number;
  to_org_id: number;
  message: string | null;
  row_count: number;
  transferred_at: string;
}

export interface OtpToken {
  id: number;
  email: string;
  code: string;
  expires_at: string;
  used: boolean;
}

export interface SessionPayload {
  orgId: number;
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
}
export interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}