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
        // Passo 1: Inbound Translation: Smart Multi-language processing
        console.log("1. Processando query inteligente para:", query);
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const translationPrompt = `
            Você é um assistente fitness especializado em exercícios.
            Sua tarefa é converter este termo de busca para o nome técnico de exercício em INGLÊS que terá melhor resultado no ExerciseDB.

            REGRAS:
            1. Se o termo estiver em PT-BR, traduza para o nome técnico em inglês.
            2. Se o termo já estiver em INGLÊS, valide se é um nome de exercício válido e corrija apenas se houver erros ortográficos óbvios.
            3. Retorne APENAS o termo em inglês (curto e direto, 1-3 palavras). SEM aspas ou explicações.
            
            Exemplos: 
            - "Agachamento Smith" -> "smith squat"
            - "Leg press" -> "leg press"
            - "Supino" -> "bench press"
            - "bench press" -> "bench press"
            
            Termo: "${query}"
        `;
        const translationResult = await modelFlash.generateContent(translationPrompt);
        let englishQuery = translationResult.response.text().trim().replace(/['"“”]/g, '').toLowerCase();

        // Limpeza extra caso a IA retorne texto extra
        if (englishQuery.includes(":")) englishQuery = englishQuery.split(":").pop()?.trim() || englishQuery;

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
            4. IMPORTANT: Rank the exercises in the output array by their relevance to the USER'S ORIGINAL QUERY: "${query}".
               The first item in the array MUST be the most accurate match for the user's intended exercise. Consider words like "cable", "rope", "dumbbell" as high priority if present in the search.
            
            Original Data (ExerciseDB results): ${JSON.stringify(rawResults.slice(0, 8))}
            
            Return a JSON object with a single 'exercises' array property.
        `;

        const structuringResult = await structuringModel.generateContent(structuringPrompt);
        const finalText = structuringResult.response.text();
        const structuredData = JSON.parse(finalText);

        // Mapeamento Robusto V7: Proxy GIF Strategy
        const mappedExercises = structuredData.exercises.map((ex: any) => {
            const normalizeId = (id: any) => String(id || "").trim().replace(/^0+/, "");
            const normalizedExId = normalizeId(ex.id);

            const original = rawResults.find((r: any) => normalizeId(r.id) === normalizedExId);

            // Geramos o URL do nosso proxy interno
            const proxyGifUrl = `/api/exercise-image?exerciseId=${ex.id}`;

            if (original) {
                console.log(`[Sync V7] Match Sucesso: ID ${ex.id} -> Proxy GIF Link Gerado`);
            } else {
                console.warn(`[Sync V7] Match FALHA: ID ${ex.id} não encontrado no rawResults.`);
            }

            return {
                ...ex,
                gifUrl: proxyGifUrl, // Sempre usamos o proxy agora para segurança e estabilidade
                targetMuscle: ex.targetMuscle || (original?.target || "Outros")
            };
        });

        return mappedExercises;

    } catch (error: any) {
        console.error("ERRO FATAL NA BUSCA:", error);
        throw new Error(error.message || "Erro desconhecido na busca global");
    }
}
