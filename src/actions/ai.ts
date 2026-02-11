"use server";

import { auth } from "@clerk/nextjs/server";

import { db } from "@/db";
import { workoutLogs, meals, userSettings, exercises } from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function analyzeProgressWithGemini() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return "Configuração da IA pendente. Adicione GOOGLE_GEMINI_API_KEY ao .env";

    // 1. Buscar Contexto do Usuário
    const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
    });

    // 2. Buscar Logs de Treino dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentWorkoutLogs = await db.select({
        exerciseName: exercises.name,
        weight: workoutLogs.weight,
        reps: workoutLogs.reps,
        notes: workoutLogs.notes,
        date: workoutLogs.createdAt,
    })
        .from(workoutLogs)
        .leftJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
        .where(
            and(
                eq(workoutLogs.userId, userId),
                gte(workoutLogs.createdAt, sevenDaysAgo)
            )
        )
        .orderBy(desc(workoutLogs.createdAt));

    // 3. Buscar Refeições dos últimos 7 dias
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];
    const recentMeals = await db.query.meals.findMany({
        where: and(
            eq(meals.userId, userId),
            gte(meals.date, dateStr)
        ),
    });

    // 4. Preparar contexto para o Gemini
    const trainingData = recentWorkoutLogs.map(l => `- ${l.exerciseName}: ${l.weight}kg x ${l.reps} ${l.notes ? `(Nota: ${l.notes})` : ""}`).join('\n');
    const mealData = recentMeals.map(m => `- ${m.mealName}: ${JSON.stringify(m.items)}`).join('\n');

    const prompt = `
    Você é o Treinador IA do MyFit.ai. Seu tom é motivador, técnico e direto (estilo Redesoft).
    
    CONTEXTO DO USUÁRIO:
    ${settings?.aiContext || "Sem objetivo específico cadastrado."}
    
    DADOS DOS ÚLTIMOS 7 DIAS (TREINO):
    ${trainingData || "Nenhum treino registrado."}
    
    DADOS DOS ÚLTIMOS 7 DIAS (DIETA):
    ${mealData || "Nenhuma refeição registrada."}
    
    TAREFAS:
    1. Analise se o treino e dieta estão alinhados com o objetivo. Leve em conta as anotações do usuário sobre desconfortos ou fluidez.
    2. Dê um insight prático para a próxima semana.
    3. Seja breve e provocativo. Máximo 4 parágrafos pequenos. Use emojis fitness.
  `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Erro no Gemini:", error);
        return "Ocorreu um erro ao processar seu insight. Tente novamente em alguns instantes.";
    }
}
