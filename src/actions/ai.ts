"use server";

import { auth } from "@clerk/nextjs/server";

import { db } from "@/db";
import { workoutLogs, meals, userSettings, exercises, biometrics, healthStats } from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

/**
 * Passo 2: A Action de Importação de Bioimpedância (Multimodal + Structured Output)
 */
export async function uploadBioimpedance(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const file = formData.get("file") as File;
    if (!file) throw new Error("Nenhum arquivo enviado");

    // Prepara o arquivo para o Gemini
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const schema: any = {
        description: "Dados extraídos de um exame de bioimpedância",
        type: SchemaType.OBJECT,
        properties: {
            weight: { type: SchemaType.NUMBER, description: "Peso total em kg" },
            bodyFat: { type: SchemaType.NUMBER, description: "Percentual de gordura corporal" },
            muscleMass: { type: SchemaType.NUMBER, description: "Massa muscular em kg" },
            visceralFat: { type: SchemaType.NUMBER, description: "Nível de gordura visceral" },
            waterPercentage: { type: SchemaType.NUMBER, description: "Percentual de água corporal" },
        },
        required: ["weight", "bodyFat", "muscleMass", "visceralFat"],
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });

    try {
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            },
            "Analise este exame de bioimpedância e extraia os dados estruturados. Se os dados não estiverem claros, tente estimar ou retorne nulo para o campo específico.",
        ]);

        const responseData = JSON.parse(result.response.text());

        // Salva na nova tabela de biometria
        await db.insert(biometrics).values({
            userId,
            weight: responseData.weight?.toString(),
            bodyFat: responseData.bodyFat?.toString(),
            muscleMass: responseData.muscleMass?.toString(),
            visceralFat: responseData.visceralFat,
            waterPercentage: responseData.waterPercentage?.toString(),
            recordedAt: new Date(),
        });

        // Atualiza também o peso atual no health_stats (para compatibilidade com dashboard)
        if (responseData.weight) {
            await db.insert(healthStats).values({
                userId,
                type: "weight",
                value: responseData.weight.toString(),
                recordedAt: new Date(),
            });
        }

        revalidatePath("/dashboard/health");
        revalidatePath("/dashboard");

        return { success: true, data: responseData };
    } catch (error) {
        console.error("Erro no processamento da Bioimpedância:", error);
        throw new Error("Erro ao processar o exame de bioimpedância.");
    }
}

/**
 * Passo 3: O Consultor Gemini (Ação Analítica com Structured Output)
 */
export async function generateConsultantReport() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    // 1. Buscar Dados dos Últimos 7 Dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    // Dieta
    const recentMeals = await db.query.meals.findMany({
        where: and(eq(meals.userId, userId), gte(meals.date, dateStr)),
    });

    // Treinos
    const recentWorkoutLogs = await db.select({
        exerciseName: exercises.name,
        weight: workoutLogs.weight,
        reps: workoutLogs.reps,
        notes: workoutLogs.notes,
        date: workoutLogs.createdAt,
    })
        .from(workoutLogs)
        .leftJoin(exercises, eq(workoutLogs.exerciseId, exercises.id))
        .where(and(eq(workoutLogs.userId, userId), gte(workoutLogs.createdAt, sevenDaysAgo)))
        .orderBy(desc(workoutLogs.createdAt));

    // Bioimpedância mais recente
    const latestBiometrics = await db.query.biometrics.findFirst({
        where: eq(biometrics.userId, userId),
        orderBy: [desc(biometrics.recordedAt)],
    });

    // 2. Definir Persona e Schema
    const reportSchema: any = {
        description: "Relatório de consultoria nutricional e fisiológica",
        type: SchemaType.OBJECT,
        properties: {
            overview: { type: SchemaType.STRING, description: "Resumo da semana" },
            critique: { type: SchemaType.STRING, description: "Crítica técnica sobre falhas e acertos" },
            actionable_tips: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Dicas práticas para a próxima semana"
            },
        },
        required: ["overview", "critique", "actionable_tips"],
    };

    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: reportSchema,
        },
    });

    const systemPrompt = `Você é um Nutricionista e Fisiologista de alta performance. Analise os treinos, os macros batidos e a composição corporal atual do usuário. Seja direto, técnico e aponte falhas e acertos. Se houver falta de dados, mencione o que falta para uma análise melhor. Tone: Profissional, assertivo (estilo Redesoft B2Click).`;

    const userPrompt = `
    DADOS DO USUÁRIO (ÚLTIMOS 7 DIAS):
    
    DIETA:
    ${recentMeals.length > 0 ? recentMeals.map(m => `- ${m.mealName}: ${JSON.stringify(m.items)}`).join('\n') : "Nenhuma refeição registrada."}
    
    TREINOS:
    ${recentWorkoutLogs.length > 0 ? recentWorkoutLogs.map(l => `- ${l.exerciseName}: ${l.weight}kg x ${l.reps} ${l.notes || ""}`).join('\n') : "Nenhum treino registrado."}
    
    ÚLTIMA BIOIMPEDÂNCIA:
    ${latestBiometrics ? JSON.stringify(latestBiometrics) : "Nenhuma avaliação recente."}
    `;

    try {
        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("Erro no Consultor Gemini:", error);
        throw new Error("Não foi possível gerar o relatório agora.");
    }
}

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
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Erro no Gemini:", error);
        return "Ocorreu um erro ao processar seu insight. Tente novamente em alguns instantes.";
    }
}
