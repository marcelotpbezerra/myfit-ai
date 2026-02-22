// Client-safe utility — does NOT have "use server".
// The food search logic (DB + Gemini + Edamam) now lives in /api/food-search/route.ts

export async function searchFoodNutrition(query: string): Promise<any[]> {
    if (!query || query.trim().length < 2) return [];

    try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) {
            console.error(`[searchFoodNutrition] API error: ${res.status}`);
            return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("[searchFoodNutrition] Fetch failed:", error);
        return [];
    }
}
