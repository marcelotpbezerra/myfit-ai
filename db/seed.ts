import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import fs from "fs";

// AJUSTE: import do seu schema
import { exercises } from "../src/db/schema";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seedExercises() {
    console.log("⏳ Seed 300 exercícios...");
    try {
        const exercisesData = JSON.parse(fs.readFileSync('./data/exercises-seed.json', 'utf-8'));
        const dataWithUserId = exercisesData.map((ex: any) => ({
            ...ex,
            userId: "system"
        }));

        await db.insert(exercises)
            .values(dataWithUserId)
            .onConflictDoNothing();

        console.log(`🎉 ${dataWithUserId.length} EXERCÍCIOS NO NEON!`);
    } catch (error: any) {
        console.error("❌ Erro:", error?.message || error);
    }
    process.exit(0);
}

seedExercises();
