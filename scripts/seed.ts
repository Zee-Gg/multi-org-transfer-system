import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import sql from "../lib/db";

async function seed() {
  console.log("Seeding 500 rows for Organization A...");

  const orgs = await sql`
    SELECT id FROM organizations WHERE slug = 'org-a'
  `;

  if (orgs.length === 0) {
    console.error("Organization A not found. Make sure you have seeded the organizations first.");
    process.exit(1);
  }

  const orgId = orgs[0].id;

  await sql`
    INSERT INTO data_rows (org_id, field_one, field_two, field_three)
    SELECT 
      ${orgId}::uuid,
      'Value_'    || i,
      'Category_' || (i % 10),
      'Status_'   || (i % 5)
    FROM generate_series(1, 500) AS s(i)
  `;

  console.log("Done. 500 rows seeded for Organization A.");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});