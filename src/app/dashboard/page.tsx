import { currentUser } from "@clerk/nextjs/server";
import { SyncButton } from "@/components/SyncButton";
import { WaterTracker } from "@/components/WaterTracker";
import { MacroChart } from "@/components/MacroChart";
import { AIInsights } from "@/components/AIInsights";
import { getTodayWater, getLatestStats } from "@/actions/health";
import { getTodayMacros } from "@/actions/diet";
import { Dumbbell, Activity, Trophy } from "lucide-react";
import Link from "next/link";
import { WeightCard } from "@/components/WeightCard";
import { getWaterGoal } from "@/actions/health";
import { getDietPlan } from "@/actions/diet";

export default async function DashboardPage() {
    const user = await currentUser();
    const todayWater = await getTodayWater();
    const waterGoal = await getWaterGoal();
    const todayMacros = await getTodayMacros();
    const latestStats = await getLatestStats();
    const currentWeight = latestStats.weight || "82.5";
    const dietPlan = await getDietPlan();

    const calorieGoal = dietPlan.reduce((acc, p) => acc + (p.targetCalories || 0), 0) || 2500;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header with Glass Card */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Olá, {user?.firstName || "Atleta"}!
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">
                            Sexta-feira, 20 de Fevereiro — Foco total hoje.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                {/* Main Stats Column */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <WaterTracker initialAmount={todayWater} initialGoal={waterGoal} />
                        <MacroChart
                            protein={todayMacros.protein}
                            carbs={todayMacros.carbs}
                            fat={todayMacros.fat}
                            calories={todayMacros.calories}
                            goal={calorieGoal}
                        />
                    </div>
                    <AIInsights />
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                    <Link
                        href="/dashboard/workout"
                        className="block group rounded-3xl border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 p-6 space-y-4 hover:bg-primary/5 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                                <Dumbbell className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Próximo Treino</p>
                                <p className="text-lg font-black italic group-hover:text-primary transition-colors">Treino A — Empurre</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-1/3 group-hover:w-1/2 transition-all duration-500" />
                        </div>
                    </Link>

                    <WeightCard initialWeight={currentWeight} />

                    <div className="p-6 rounded-3xl bg-muted/10 border border-white/5 space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sistema</p>
                        <SyncButton />
                    </div>
                </div>
            </div>
        </div>
    );
}
