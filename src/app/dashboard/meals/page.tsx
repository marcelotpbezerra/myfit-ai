import { getMealsByDate, getDietPlan } from "@/actions/diet";
import { seedMarceloProtocol } from "@/actions/seedMarcelo2026";
import { MealManager } from "@/components/MealManager";
import { Utensils } from "lucide-react";

export default async function MealsPage() {
    let initialMeals = [];
    let dietPlan = [];

    try {
        // Garantir que o protocolo Marcelo 2026 está carregado
        const seedResult = await seedMarceloProtocol();
        console.log("[MEALS PAGE] Seed result:", seedResult);

        const today = new Date().toISOString().split('T')[0];
        initialMeals = await getMealsByDate(today);
        dietPlan = await getDietPlan();
    } catch (error) {
        console.error("[MEALS PAGE] Erro ao carregar dados:", error);
        // Continuar com arrays vazios - não quebrar a página
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex items-center gap-3 mb-8">
                    <Utensils className="h-8 w-8 text-primary" />
                    <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Dieta
                    </h1>
                </div>
                <MealManager initialMeals={initialMeals} dietPlan={dietPlan} />
            </div>
        </div>
    );
}
