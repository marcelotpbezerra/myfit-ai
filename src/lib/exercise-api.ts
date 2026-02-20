"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export interface RemoteExercise {
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
        console.log("1. Buscando tradução para:", query);
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const translationPrompt = `Translate the following exercise/muscle search term from Portuguese (PT-BR) to English. Return only the translated term: "${query}"`;
        const translationResult = await modelFlash.generateContent(translationPrompt);
        const englishQuery = translationResult.response.text().trim().replace(/['"]/g, '');

        console.log("2. Traduzido para Inglês:", englishQuery);

        // Passo 2: Fetch from ExerciseDB (RapidAPI)
        const response = await fetch(
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

        const rawResults = await response.json();
        console.log("4. Resposta bruta da RapidAPI:", JSON.stringify(rawResults).substring(0, 500) + "...");

        if (!rawResults || rawResults.length === 0) {
            console.warn("Aviso: RapidAPI retornou um array vazio.");
            return [];
        }

        // Passo 3: Outbound Translation & Normalização com Structured Output
        const structuringModel = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
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
                                    name: { type: "string" },
                                    targetMuscle: { type: "string" },
                                    equipment: { type: "string" },
                                    gifUrl: { type: "string" }
                                },
                                required: ["name", "targetMuscle", "equipment", "gifUrl"]
                            }
                        }
                    }
                } as any
            }
        });

        const structuringPrompt = `
            Translate these exercises from English to Portuguese (PT-BR). 
            Keep the gifUrl EXACTLY the same.
            Original Data: ${JSON.stringify(rawResults.slice(0, 8))}
            
            Return a JSON object with a single 'exercises' array property.
        `;

        const structuringResult = await structuringModel.generateContent(structuringPrompt);
        const finalText = structuringResult.response.text();
        console.log("5. Retorno do Gemini (Structured Output):", finalText);

        const structuredData = JSON.parse(finalText);

        return structuredData.exercises;

    } catch (error: any) {
        console.error("ERRO FATAL NA BUSCA:", error);
        throw new Error(error.message || "Erro desconhecido na busca global");
    }
}
