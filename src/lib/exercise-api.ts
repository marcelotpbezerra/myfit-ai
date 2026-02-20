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
        // 1. Inbound Translation: PT-BR -> EN
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const translationPrompt = `Translate the following exercise/muscle search term from Portuguese (PT-BR) to English. Return only the translated term: "${query}"`;
        const translationResult = await modelFlash.generateContent(translationPrompt);
        const englishQuery = translationResult.response.text().trim().replace(/['"]/g, '');

        console.log(`[Exercise Middleware] PT-BR: "${query}" -> EN: "${englishQuery}"`);

        // 2. Fetch from ExerciseDB (RapidAPI)
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

        console.log(`[ExerciseDB] Status: ${response.status} (${response.statusText})`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[ExerciseDB] Error: ${errorText}`);
            throw new Error(`ExerciseDB API Error: ${response.status}`);
        }

        const rawResults = await response.json();

        if (!rawResults || rawResults.length === 0) return [];

        // 3. Outbound Translation & Normalização com Structured Output
        const structuringModel = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
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
        const structuredData = JSON.parse(structuringResult.response.text());

        return structuredData.exercises;

    } catch (error) {
        console.error("Exercise Search Error with Gemini Middleware:", error);
        return [];
    }
}
