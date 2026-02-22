import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import fs from 'fs';
import * as schema from '../src/db/schema';

async function seedExercises() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  const db = drizzle(pool);

  try {
    const exercises = JSON.parse(fs.readFileSync('./data/exercises-seed.json', 'utf-8'));
    await db.insert(schema.exercises).values(exercises);
    console.log(`🎉 ${exercises.length} EXERCÍCIOS INJETADOS NO NEON!`);
  } catch (error: any) {
    console.error('Erro:', error?.message || error);
  } finally {
    await pool.end();
  }
}

seedExercises();
