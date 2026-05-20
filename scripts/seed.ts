import postgres from "postgres";
import * as dotenv from "dotenv";
import { setupDatabase } from "../lib/setup";

dotenv.config({ path: ".env.local" });

async function seed() {
  console.log("\n🌱 DataBridge — Database Seed\n");

  const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

  try {
    console.log("⚙️  Creating tables...");
    // We reuse setup.ts logic but need our own sql instance here
    await sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY, name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS otp_tokens (
        id SERIAL PRIMARY KEY, email TEXT NOT NULL, code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL, used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS data_rows (
        id SERIAL PRIMARY KEY, org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        field_one TEXT NOT NULL DEFAULT 'unlisted', field_two TEXT NOT NULL DEFAULT 'unlisted',
        field_three TEXT NOT NULL DEFAULT 'unlisted', created_at TIMESTAMPTZ DEFAULT NOW()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY, from_org_id INTEGER NOT NULL REFERENCES organizations(id),
        to_org_id INTEGER NOT NULL REFERENCES organizations(id),
        message TEXT, row_count INTEGER NOT NULL, transferred_at TIMESTAMPTZ DEFAULT NOW()
      )`;
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
      )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_rows_org_id ON data_rows(org_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens(email, used, expires_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_transfers_to ON transfers(to_org_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(email, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON audit_logs(ip_address, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type, created_at DESC)`;
    console.log("✅ Tables ready\n");

    // Upsert both orgs
    const orgAEmail = process.env.ORG_A_EMAIL;
    const orgBEmail = process.env.ORG_B_EMAIL;

    if (!orgAEmail || !orgBEmail) {
      throw new Error("ORG_A_EMAIL and ORG_B_EMAIL must be set in .env.local");
    }

    console.log("🏢 Seeding organizations...");
    const orgs = await sql`
      INSERT INTO organizations (name, email, slug)
      VALUES
        ('Organization Alpha', ${orgAEmail}, 'org-a'),
        ('Organization Beta',  ${orgBEmail}, 'org-b')
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name, slug = EXCLUDED.slug
      RETURNING id, name, slug
    `;
    console.log(`   ✓ ${orgs[0].name} (${orgs[0].slug}) — id: ${orgs[0].id}`);
    console.log(`   ✓ ${orgs[1].name} (${orgs[1].slug}) — id: ${orgs[1].id}\n`);

    const orgAId = orgs[0].id;

    // Clear existing rows for Org A and reseed
    const { count } = (
      await sql`SELECT COUNT(*)::int as count FROM data_rows WHERE org_id = ${orgAId}`
    )[0];

    if (count > 0) {
      console.log(`🧹 Clearing ${count} existing rows for Org Alpha...`);
      await sql`DELETE FROM data_rows WHERE org_id = ${orgAId}`;
    }

    console.log("📦 Seeding 500 rows for Organization Alpha...");
    const categories = ["Finance", "Operations", "HR", "Marketing", "Legal", "Tech", "Sales", "Support", "Product", "Research"];
    const rows = Array.from({ length: 500 }, (_, i) => ({
      org_id:      orgAId,
      field_one:   `Alpha-Record-${String(i + 1).padStart(4, "0")}`,
      field_two:   categories[Math.floor(i / 50) % categories.length],
      field_three: `VAL-${Math.floor(Math.random() * 90000) + 10000}`,
    }));

    // Insert in chunks of 100
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      await sql`INSERT INTO data_rows ${sql(chunk, "org_id", "field_one", "field_two", "field_three")}`;
      process.stdout.write(`\r   Inserted ${Math.min(i + 100, 500)}/500 rows...`);
    }
    console.log("\n   ✅ 500 rows seeded\n");

    console.log("🎉 Database ready! You can now run: npm run dev\n");
  } finally {
    await sql.end();
  }
}

seed().catch((e) => {
  console.error("\n❌ Seed failed:", e.message);
  process.exit(1);
});