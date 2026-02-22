"use server";

import { auth } from "@clerk/nextjs/server";

import { db } from "@/db";
import { workoutLogs, meals, userSettings, exercises, biometrics, healthStats } from "@/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Passo 2: A Action de Importação de Bioimpedância (Multimodal + Structured Output)
 */
export async function uploadBioimpedance(formData: FormData) {
    try {
        const { userId } = await auth();
        if (!userId) {
            console.error("[uploadBioimpedance] Erro: Usuário não autenticado");
            return { success: false, error: "Não autorizado" };
        }

        const file = formData.get("file") as File | null;
        if (!file || file.size === 0) {
            console.error("[uploadBioimpedance] Erro: Nenhum arquivo enviado ou arquivo vazio");
            return { success: false, error: "Nenhum arquivo enviado" };
        }

        console.log(`[uploadBioimpedance] Processando arquivo: ${file.name}, Tipo: ${file.type}, Tamanho: ${file.size}`);

        // Conversão robusta para Base64
        let base64Data: string;
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            base64Data = buffer.toString("base64");
        } catch (e) {
            console.error("[uploadBioimpedance] Erro ao converter arquivo para buffer:", e);
            return { success: false, error: "Falha ao ler o arquivo físico" };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[uploadBioimpedance] Erro: GEMINI_API_KEY não configurada");
            return { success: false, error: "Configuração da IA pendente" };
        }

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
            model: "gemini-2.0-flash", // Use a stable version name
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        console.log("[uploadBioimpedance] Enviando para o Gemini...");

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || "application/pdf", // Fallback mime type
                },
            },
            "Analise este exame de bioimpedância e extraia estritamente os dados solicitados no schema. Foque em: Peso (Weight), Gordura Corporal (Body Fat %), Massa Muscular (Muscle Mass) e Gordura Visceral (Visceral Fat).",
        ]);

        const text = result.response.text();
        console.log("[uploadBioimpedance] Resposta do Gemini:", text);

        const responseData = JSON.parse(text);

        // Salva na nova tabela de biometria
        const [inserted] = await db.insert(biometrics).values({
            userId,
            weight: responseData.weight?.toString(),
            bodyFat: responseData.bodyFat?.toString(),
            muscleMass: responseData.muscleMass?.toString(),
            visceralFat: responseData.visceralFat,
            waterPercentage: responseData.waterPercentage?.toString(),
            recordedAt: new Date(),
        }).returning();

        console.log("[uploadBioimpedance] Dados salvos no banco:", inserted.id);

        // Atualiza também o peso atual no health_stats (para compatibilidade com dashboard)
        if (responseData.weight) {
            await db.insert(healthStats).values({
                userId,
                type: "weight",
                value: responseData.weight.toString(),
                recordedAt: new Date(),
            });
        }

        revalidatePath("/dashboard/health/bioimpedancia");
        revalidatePath("/dashboard");

        return { success: true, data: responseData };
    } catch (error: any) {
        console.error("###################################################");
        console.error("CRITICAL ERROR IN uploadBioimpedance:");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        if (error.response) {
            console.error("Gemini Response Error:", JSON.stringify(error.response, null, 2));
        }
        console.error("###################################################");

        return {
            success: false,
            error: error.message || "Erro interno ao processar bioimpedância"
        };
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("[generateConsultantReport] Erro: GEMINI_API_KEY não configurada");
        return { error: "IA não configurada" };
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: reportSchema,
        },
    });

    const systemPrompt = `Você é um Especialista em Nutrição e Fisiologia Esportiva de elite. 
    Sua missão é analisar se a dieta e os treinos da última semana estão alinhados com a composição corporal do usuário.
    Analise especificamente a bioimpedância: se o percentual de gordura está alto, foque em déficit e qualidade; se a massa muscular está estagnada, critique o volume de treino ou aporte proteico.
    Seja direto, técnico e use o tom assertivo da Redesoft B2Click.`;

    const userPrompt = `
    DADOS DO USUÁRIO (ÚLTIMOS 7 DIAS):
    
    COMPOSIÇÃO CORPORAL (ÚLTIMA BIOIMPEDÂNCIA):
    ${latestBiometrics
            ? `- Peso: ${latestBiometrics.weight}kg
           - Gordura Corporal: ${latestBiometrics.bodyFat}%
           - Massa Muscular: ${latestBiometrics.muscleMass}kg
           - Gordura Visceral: Nível ${latestBiometrics.visceralFat}
           - Data da Avaliação: ${new Date(latestBiometrics.recordedAt!).toLocaleDateString('pt-BR')}`
            : "Nenhuma avaliação de bioimpedância recente encontrada. Recomende que o usuário faça o upload de um exame para uma análise mais precisa."}

    DIETA (REFREIÇÕES REGISTRADAS):
    ${recentMeals.length > 0 ? recentMeals.map(m => `- ${m.mealName}: ${JSON.stringify(m.items)}`).join('\n') : "Nenhum log de dieta na última semana."}
    
    TREINOS (HISTÓRICO):
    ${recentWorkoutLogs.length > 0 ? recentWorkoutLogs.map(l => `- ${l.exerciseName}: ${l.weight}kg x ${l.reps} reps ${l.notes ? `(${l.notes})` : ""}`).join('\n') : "Nenhum treino registrado nos últimos 7 dias."}
    `;

    try {

        console.log("[generateConsultantReport] Enviando prompt para consultoria...");
        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        const text = result.response.text();
        console.log("[generateConsultantReport] Resposta bruta Gemini:", text);

        try {
            const parsed = JSON.parse(text);
            return parsed;
        } catch (parseError) {
            console.error("[generateConsultantReport] Erro de Parsing JSON:", text);
            return { error: "Erro no formato da resposta da IA. Gemini retornou: " + text.substring(0, 50) + "..." };
        }
    } catch (error: any) {
        console.error("###################################################");
        console.error("ERROR IN generateConsultantReport:");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("###################################################");

        return {
            error: "Não foi possível gerar o relatório agora. Verifique seus logs."
        };
    }
}

export async function analyzeProgressWithGemini() {
    const { userId } = await auth();
    if (!userId) throw new Error("Não autorizado");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "Configuração da IA pendente. Adicione GEMINI_API_KEY ao .env";

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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Erro no Gemini:", error);
        return "Ocorreu um erro ao processar seu insight. Tente novamente em alguns instantes.";
    }
}
