import { currentUser } from "@clerk/nextjs/server";
import { SyncButton } from "@/components/SyncButton";
import { WaterTracker } from "@/components/WaterTracker";
import { MacroChart } from "@/components/MacroChart";
import { AIInsights } from "@/components/AIInsights";
import { getTodayWater } from "@/actions/health";
import { getTodayMacros } from "@/actions/diet";
import { Dumbbell, Activity, Utensils, Droplets, Trophy } from "lucide-react";

export default async function DashboardPage() {
    const user = await currentUser();
    const todayWater = await getTodayWater();
    const todayMacros = await getTodayMacros();

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

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Main Stats Column */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <WaterTracker initialAmount={todayWater} />
                        <MacroChart
                            protein={todayMacros.protein}
                            carbs={todayMacros.carbs}
                            fat={todayMacros.fat}
                            calories={todayMacros.calories}
                        />
                    </div>
                    <AIInsights />
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Dumbbell className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Próximo Treino</p>
                                <p className="text-lg font-black italic">Treino A — Empurre</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/40 w-1/3" />
                        </div>
                    </div>

                    <div className="rounded-3xl border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Peso Atual</p>
                                <p className="text-lg font-black">82.5 kg</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                            <Activity className="h-3 w-3" /> -0.8kg vs semana passada
                        </span>
                    </div>

                    <div className="p-6 rounded-3xl bg-muted/10 border border-white/5 space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sistema</p>
                        <SyncButton />
                    </div>
                </div>
            </div>
        </div>
    );
}
