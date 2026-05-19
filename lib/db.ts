import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,               // Serverless: keep connection pool minimal
  idle_timeout: 20,     // Close idle connections after 20s
  connect_timeout: 10,  // Fail fast if DB is unreachable
  ssl: "require",       // Neon requires SSL
});

export default sql;