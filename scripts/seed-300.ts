import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import fs from 'fs';
import * as schema from '../db/schema.js'; // ← AJUSTE SEU CAMINHO

async function seedExercises() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });
  const db = drizzle(pool);

  try {
    const exercises = JSON.parse(fs.readFileSync('./data/exercises-seed.json'));
    await db.insert(schema.exercises).values(exercises);
    console.log(`🎉 ${exercises.length} EXERCÍCIOS INJETADOS NO NEON!`);
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

seedExercises();
