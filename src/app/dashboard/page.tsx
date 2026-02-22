import { currentUser } from "@clerk/nextjs/server";
import { SyncButton } from "@/components/SyncButton";
import { WaterTracker } from "@/components/WaterTracker";
import { MacroChart } from "@/components/MacroChart";
import { AIInsights } from "@/components/AIInsights";
import { getTodayWater, getLatestStats } from "@/actions/health";
import { getTodayMacros } from "@/actions/diet";
import { Dumbbell, Trophy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { WeightCard } from "@/components/WeightCard";
import { getWaterGoal, getUserSettings } from "@/actions/health";
import { getDietPlan } from "@/actions/diet";
import { getNextSuggestedWorkout, getTodayWorkoutStatus } from "@/actions/workout";
import { BiometricInvite } from "@/components/BiometricInvite";
import { MealNotificationManager } from "@/components/MealNotificationManager";

export default async function DashboardPage() {
    const user = await currentUser();

    // Buscar todos os dados em paralelo para melhor performance
    const [
        todayWater,
        waterGoal,
        todayMacros,
        latestStats,
        nextWorkout,
        todayStatus,
        dietPlan,
        settings,
    ] = await Promise.all([
        getTodayWater(),
        getWaterGoal(),
        getTodayMacros(),
        getLatestStats(),
        getNextSuggestedWorkout(),
        getTodayWorkoutStatus(),
        getDietPlan(),
        getUserSettings(),
    ]);

    const currentWeight = latestStats.weight || "82.5";
    const biometricEnabled = settings?.biometricEnabled ?? false;

    const safesDietPlan = Array.isArray(dietPlan) ? dietPlan : [];
    const calorieGoal = safesDietPlan.reduce((acc, p) => acc + (p.targetCalories || 0), 0) || 2500;
    const goalProtein = safesDietPlan.reduce((acc, p) => acc + (p.targetProtein || 0), 0);
    const goalCarbs = safesDietPlan.reduce((acc, p) => acc + (p.targetCarbs || 0), 0);
    const goalFat = safesDietPlan.reduce((acc, p) => acc + (p.targetFat || 0), 0);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
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
                            {capitalizedDate} — Foco total hoje.
                        </p>
                    </div>
                </div>
            </div>

            <BiometricInvite biometricEnabled={biometricEnabled} />
            <MealNotificationManager dietPlan={safesDietPlan} />

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
                            goalProtein={goalProtein}
                            goalCarbs={goalCarbs}
                            goalFat={goalFat}
                        />
                    </div>
                    <AIInsights />
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* ── Workout Card — 2 estados ── */}
                    {todayStatus.trainedToday ? (
                        /* Estado 2: Treino concluído hoje */
                        <Link
                            href="/dashboard/workout"
                            className="block group rounded-3xl border-none bg-green-500/10 backdrop-blur-xl ring-1 ring-green-500/20 p-6 space-y-4 hover:bg-green-500/15 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-black transition-colors">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-green-400/80 tracking-widest">
                                        Treino Concluído
                                    </p>
                                    <p className="text-lg font-black italic text-green-300 group-hover:text-green-200 transition-colors">
                                        Treino {todayStatus.splitTrained ?? "?"} — Ótimo trabalho! 💪
                                    </p>
                                </div>
                            </div>
                            {/* Resumo rápido */}
                            <div className="flex gap-4 text-xs font-bold text-green-400/70">
                                <span>{todayStatus.totalSets} séries</span>
                                <span>·</span>
                                <span>{todayStatus.totalVolume} kg volume</span>
                            </div>
                            {/* Barra 100% */}
                            <div className="h-1 w-full bg-green-500/20 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-full transition-all duration-700" />
                            </div>
                        </Link>
                    ) : (
                        /* Estado 1: Não treinou hoje */
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
                                    <p className="text-lg font-black italic group-hover:text-primary transition-colors">
                                        {nextWorkout?.name ?? "Treino A — Empurre"}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                                Iniciar Treino →
                            </p>
                            <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-1/3 group-hover:w-1/2 transition-all duration-500" />
                            </div>
                        </Link>
                    )}

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
