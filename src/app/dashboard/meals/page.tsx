import { getMealsByDate } from "@/actions/diet";
import { MealManager } from "@/components/MealManager";
import { Utensils } from "lucide-react";

export default async function MealsPage() {
    const today = new Date().toISOString().split('T')[0];
    const initialMeals = await getMealsByDate(today);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Plano Alimentar 🍎
                </h1>
                <p className="text-muted-foreground font-medium">
                    Gerencie suas refeições do dia e acompanhe seus macros.
                </p>
            </div>

            <MealManager initialMeals={initialMeals} date={today} />
        </div>
    );
}
