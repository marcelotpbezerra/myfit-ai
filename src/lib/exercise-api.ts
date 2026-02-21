"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export interface RemoteExercise {
    id: string; // Adicionado para mapeamento robusto
    name: string;
    targetMuscle: string;
    equipment: string;
    gifUrl: string;
}

export async function searchExerciseFromAPI(query: string): Promise<RemoteExercise[]> {
    const rapidKey = process.env.X_RAPIDAPI_KEY;

    if (!rapidKey) {
        console.warn("RapidAPI Key missing (X_RAPIDAPI_KEY).");
        return [];
    }

    try {
        // Passo 1: Inbound Translation: PT-BR -> EN
        console.log("1. Buscando termo otimizado para:", query);
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const translationPrompt = `
            Otimize este termo de busca de exercício (em PT-BR) para uma busca por nome em um banco de dados de exercícios em inglês.
            Retorne APENAS o termo em inglês mais provável de retornar resultados (curto e direto, 1-3 palavras).
            Exemplos: 
            - "Agachamento Smith" -> "smith squat"
            - "Supino Inclinado com Halteres" -> "inclined dumbbell bench press"
            - "Cadeira extensora" -> "leg extension"
            Termo: "${query}"
        `;
        const translationResult = await modelFlash.generateContent(translationPrompt);
        let englishQuery = translationResult.response.text().trim().replace(/['"]/g, '');

        console.log("2. Termo Otimizado (Inglês):", englishQuery);

        // Passo 2: Fetch from ExerciseDB (RapidAPI)
        let response = await fetch(
            `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(englishQuery.toLowerCase())}?limit=8`,
            {
                method: "GET",
                headers: {
                    "X-RapidAPI-Key": rapidKey!,
                    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com"
                }
            }
        );

        console.log("3. Status RapidAPI:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ExerciseDB ERROR] Status: ${response.status} - Body: ${errorText}`);
            throw new Error(`ExerciseDB API Error: ${response.status} - ${errorText}`);
        }

        let rawResults = await response.json();

        // Fallback: Se não encontrar nada, tenta algo mais genérico (ex: pega última palavra)
        if (!rawResults || rawResults.length === 0) {
            const fallbackQuery = englishQuery.split(' ').pop();
            if (fallbackQuery && fallbackQuery !== englishQuery) {
                console.log(`4a. Sem resultados para "${englishQuery}". Tentando fallback: "${fallbackQuery}"`);
                const fallbackResponse = await fetch(
                    `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(fallbackQuery.toLowerCase())}?limit=8`,
                    {
                        method: "GET",
                        headers: {
                            "X-RapidAPI-Key": rapidKey!,
                            "X-RapidAPI-Host": "exercisedb.p.rapidapi.com"
                        }
                    }
                );
                if (fallbackResponse.ok) {
                    rawResults = await fallbackResponse.json();
                }
            }
        }

        console.log("4. Resposta Final RapidAPI:", JSON.stringify(rawResults).substring(0, 500) + "...");

        if (!rawResults || rawResults.length === 0) {
            console.warn("Aviso: RapidAPI retornou um array vazio.");
            return [];
        }

        // Passo 3: Outbound Translation & Normalização com Structured Output
        const structuringModel = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        exercises: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" }, // Adicionado no Schema
                                    name: { type: "string" },
                                    targetMuscle: { type: "string" },
                                    equipment: { type: "string" },
                                    gifUrl: { type: "string" }
                                },
                                required: ["id", "name", "targetMuscle", "equipment", "gifUrl"]
                            }
                        }
                    }
                } as any
            }
        });

        const structuringPrompt = `
            You are a PT-BR fitness specialist.
            Translate these exercises from English to Portuguese (PT-BR). 

            STRICT MUSCLE MAPPING:
            - "back" -> "Costas"
            - "cardiovascular" -> "Cardio"
            - "chest" -> "Peitoral"
            - "lower arms" -> "Antebraço"
            - "lower legs" -> "Panturrilhas"
            - "neck" -> "Pescoço"
            - "shoulders" -> "Ombros"
            - "upper arms" -> "Braços"
            - "upper legs" -> "Pernas"
            - "waist" -> "Cintura / Abdômen"

            STRICT RULES:
            1. Keep the gifUrl and id EXACTLY the same.
            2. Translate name and equipment naturally to PT-BR.
            3. Use the STRICT MUSCLE MAPPING for the targetMuscle field based on the 'bodyPart' or 'target' from the original data.
            
            Original Data: ${JSON.stringify(rawResults.slice(0, 8))}
            
            Return a JSON object with a single 'exercises' array property.
        `;

        const structuringResult = await structuringModel.generateContent(structuringPrompt);
        const finalText = structuringResult.response.text();
        const structuredData = JSON.parse(finalText);

        // Mapeamento Robusto V4: Normalização de IDs e Log Extremo
        const mappedExercises = structuredData.exercises.map((ex: any) => {
            // Normalizamos ambos os IDs para string, removemos espaços e zeros à esquerda para comparação
            const normalizeId = (id: any) => String(id || "").trim().replace(/^0+/, "");
            const normalizedExId = normalizeId(ex.id);

            const original = rawResults.find((r: any) => normalizeId(r.id) === normalizedExId);

            if (original) {
                console.log(`[Sync V4] Match Sucesso: ID ${ex.id} -> GIF Original ${original.gifUrl ? "OK" : "MISSING"}`);
            } else {
                console.warn(`[Sync V4] Match FALHA: Não encontrei ID ${ex.id} (Normalizado: ${normalizedExId}) no rawResults.`);
            }

            const finalGif = original?.gifUrl || ex.gifUrl || "";

            return {
                ...ex,
                gifUrl: finalGif,
                targetMuscle: ex.targetMuscle || (original?.target || "Outros")
            };
        });

        return mappedExercises;

    } catch (error: any) {
        console.error("ERRO FATAL NA BUSCA:", error);
        throw new Error(error.message || "Erro desconhecido na busca global");
    }
}
