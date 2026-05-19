import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function addOrganization() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

  try {
    // Get arguments from command line
    const [, , name, email, slug] = process.argv;

    if (!name || !email || !slug) {
      console.error(`
Usage: npx tsx --tsconfig tsconfig.seed.json scripts/add-org.ts <name> <email> <slug>

Example:
  npx tsx --tsconfig tsconfig.seed.json scripts/add-org.ts "Organization Gamma" "gamma@example.com" "org-c"
      `);
      process.exit(1);
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`\n🏢 Adding new organization...\n`);
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${normalizedEmail}`);
    console.log(`   Slug: ${slug}\n`);

    // Check if organization already exists
    const existing = await sql`
      SELECT id FROM organizations WHERE email = ${normalizedEmail} OR slug = ${slug}
    `;

    if (existing.length > 0) {
      console.error(`❌ Organization already exists with this email or slug`);
      process.exit(1);
    }

    // Insert the new organization
    const result = await sql`
      INSERT INTO organizations (name, email, slug)
      VALUES (${name}, ${normalizedEmail}, ${slug})
      RETURNING id, name, email, slug
    `;

    if (result.length > 0) {
      const org = result[0];
      console.log(`✅ Organization created successfully!\n`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Name: ${org.name}`);
      console.log(`   Email: ${org.email}`);
      console.log(`   Slug: ${org.slug}\n`);
      console.log(`🎉 Users can now login with email: ${org.email}\n`);
    }
  } catch (error) {
    console.error("\n❌ Error adding organization:", (error as any).message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

addOrganization();
