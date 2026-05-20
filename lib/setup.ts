import sql from "./db";

export async function setupDatabase(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS organizations (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      slug       TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS otp_tokens (
      id         SERIAL PRIMARY KEY,
      email      TEXT NOT NULL,
      code       TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS data_rows (
      id          SERIAL PRIMARY KEY,
      org_id      INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      field_one   TEXT NOT NULL DEFAULT 'unlisted',
      field_two   TEXT NOT NULL DEFAULT 'unlisted',
      field_three TEXT NOT NULL DEFAULT 'unlisted',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transfers (
      id             SERIAL PRIMARY KEY,
      from_org_id    INTEGER NOT NULL REFERENCES organizations(id),
      to_org_id      INTEGER NOT NULL REFERENCES organizations(id),
      message        TEXT,
      row_count      INTEGER NOT NULL,
      transferred_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id            SERIAL PRIMARY KEY,
      event_type    TEXT NOT NULL,
      org_id        INTEGER REFERENCES organizations(id),
      email         TEXT,
      ip_address    TEXT NOT NULL,
      action        TEXT NOT NULL,
      details       JSONB,
      result        TEXT NOT NULL CHECK (result IN ('success', 'failure')),
      error_message TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Indexes for performance
  await sql`CREATE INDEX IF NOT EXISTS idx_data_rows_org_id    ON data_rows(org_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_data_rows_created   ON data_rows(org_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_otp_tokens_email    ON otp_tokens(email, used, expires_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transfers_from_org  ON transfers(from_org_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transfers_to_org    ON transfers(to_org_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id   ON audit_logs(org_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_email    ON audit_logs(email, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_ip       ON audit_logs(ip_address, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_event    ON audit_logs(event_type, created_at DESC)`;
}