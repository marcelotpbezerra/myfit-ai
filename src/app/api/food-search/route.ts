import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/db";
import { foods } from "@/db/schema";
import { ilike } from "drizzle-orm";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q");
    if (!query || query.trim().length < 2) {
        return NextResponse.json([]);
    }

    const appId = process.env.EDAMAM_APP_ID;
    const appKey = process.env.EDAMAM_APP_KEY;
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!appId || !appKey || !apiKey) {
        console.error("❌ Credentials missing. Check EDAMAM_APP_ID, EDAMAM_APP_KEY and GOOGLE_GEMINI_API_KEY.");
        return NextResponse.json([]);
    }

    try {
        // --- 1. BUSCA LOCAL (FAST PATH - TACO/SISTEMA) ---
        console.log(`[Nutrition API Route] Buscando localmente: "${query}"...`);
        const localResults = await db.select()
            .from(foods)
            .where(ilike(foods.nome, `%${query}%`))
            .limit(15);

        if (localResults.length > 0) {
            console.log(`[Nutrition API Route] 🎉 ${localResults.length} resultados encontrados na base local.`);
            const mapped = localResults.map(f => ({
                name: f.nome,
                protein: Number(f.prot) || 0,
                carbs: Number(f.carb) || 0,
                fat: Number(f.gord) || 0,
                calories: Number(f.kcal) || 0,
                unit: f.porcao || "100g",
                image: ""
            }));
            return NextResponse.json(mapped);
        }

        console.log(`[Nutrition API Route] ⏭️ Nada local. Acionando Edamam + Gemini fallback...`);

        // --- 2. FALLBACK (PLAN B - EDAMAM + GEMINI) ---
        // Inbound Translation: PT-BR -> EN
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const translationPrompt = `Translate the following food search query from Portuguese (PT-BR) to English. Return only the translated term or phrase, nothing else. If it is already in English, return it exactly as is: "${query}"`;
        const translationResult = await modelFlash.generateContent(translationPrompt);
        const englishQuery = translationResult.response.text().trim().replace(/['"]/g, '').toLowerCase();

        // Fetch from Edamam
        const response = await fetch(
            `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(englishQuery)}&nutrition-type=logging`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Edamam Error (${response.status}):`, errorText);
            return NextResponse.json([]);
        }

        const data = await response.json();
        if (!data.hints || data.hints.length === 0) return NextResponse.json([]);

        const rawResults = data.hints.slice(0, 8).map((hint: any) => {
            const food = hint.food;
            const nutrients = food.nutrients;
            return {
                originalName: food.label,
                protein: Math.round(nutrients.PROCNT || 0),
                carbs: Math.round(nutrients.CHOCDF || 0),
                fat: Math.round(nutrients.FAT || 0),
                calories: Math.round(nutrients.ENERC_KCAL || 0),
                unit: "100g",
                image: food.image || ""
            };
        });

        // Outbound Translation & Normalização com Structured Output
        const structuringModel = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        foods: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    calories: { type: "number" },
                                    protein: { type: "number" },
                                    carbs: { type: "number" },
                                    fat: { type: "number" },
                                    unit: { type: "string" },
                                    image: { type: "string" }
                                },
                                required: ["name", "calories", "protein", "carbs", "fat", "unit"]
                            }
                        }
                    }
                } as any
            }
        });

        const structuringPrompt = `
            You are a nutrition database assistant. 
            Translate these food items from English to Portuguese (PT-BR). 
            Maintain the nutrient values exactly as provided. All nutrient values must be numbers (not strings).
            Original Data: ${JSON.stringify(rawResults)}
            
            Return a JSON object with a single 'foods' array property.
        `;

        const structuringResult = await structuringModel.generateContent(structuringPrompt);
        const structuredData = JSON.parse(structuringResult.response.text());

        const finalFoods = Array.isArray(structuredData.foods)
            ? structuredData.foods.map((f: any) => ({
                name: String(f.name || "Alimento"),
                protein: Number(f.protein) || 0,
                carbs: Number(f.carbs) || 0,
                fat: Number(f.fat) || 0,
                calories: Number(f.calories) || 0,
                unit: String(f.unit || "100g"),
                image: String(f.image || "")
            }))
            : [];

        return NextResponse.json(finalFoods);

    } catch (error) {
        console.error("Nutrition Search Error:", error);
        return NextResponse.json([]);
    }
}
