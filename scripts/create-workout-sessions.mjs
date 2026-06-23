import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { readFileSync } = require("fs");
const { config } = require("dotenv");

config({ path: ".env.local" });

const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const sql = `
CREATE TABLE IF NOT EXISTS workout_sessions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  local_id TEXT NOT NULL UNIQUE,
  split TEXT NOT NULL,
  total_exercises INTEGER DEFAULT 0,
  completed_exercises INTEGER DEFAULT 0,
  total_sets INTEGER DEFAULT 0,
  total_volume TEXT DEFAULT '0',
  exercises JSONB DEFAULT '[]',
  notes TEXT,
  source TEXT DEFAULT 'phone',
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

try {
  await pool.query(sql);
  console.log("✓ workout_sessions table created (or already exists)");
} catch (e) {
  console.error("✗ Error:", e.message);
} finally {
  await pool.end();
}
