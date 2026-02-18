import { getMealsByDate, getDietPlan } from "@/actions/diet";
import { seedMarceloProtocol } from "@/actions/seedMarcelo2026";
import { MealManager } from "@/components/MealManager";
import { DietConfig } from "@/components/DietConfig";
import { Utensils, Calendar, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MealsPage() {
    let initialMeals: any[] = [];
    let dietPlanData: any[] = [];
    // Data local segura para evitar shift de fuso horário
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
        // Garantir que o protocolo Marcelo 2026 está carregado
        await seedMarceloProtocol();
        initialMeals = await getMealsByDate(today);
        dietPlanData = await getDietPlan();
    } catch (error) {
        console.error("[MEALS PAGE] Erro ao carregar dados:", error);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Utensils className="h-8 w-8 text-primary" />
                        <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent uppercase tracking-tight">
                            Diet <span className="text-white">OS</span>
                        </h1>
                    </div>
                </div>

                <Tabs defaultValue="daily" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-16 bg-card/30 backdrop-blur-xl rounded-3xl p-1.5 shadow-2xl ring-1 ring-white/5 mb-8">
                        <TabsTrigger value="daily" className="rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 gap-2">
                            <Calendar className="h-4 w-4" />
                            Diário
                        </TabsTrigger>
                        <TabsTrigger value="protocol" className="rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 gap-2">
                            <Settings className="h-4 w-4" />
                            Protocolo
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="daily" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <MealManager initialMeals={initialMeals} dietPlan={dietPlanData} date={today} />
                    </TabsContent>

                    <TabsContent value="protocol" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <DietConfig currentPlan={dietPlanData} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
