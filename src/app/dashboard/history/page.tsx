import { getWorkoutLogsByDate } from "@/actions/workout";
import { getMealsByDate } from "@/actions/diet";
import { History as HistoryIcon, Dumbbell, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HistoryDatePicker } from "@/components/HistoryDatePicker";
import { WorkoutLogEditor } from "@/components/WorkoutLogEditor";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const params = await searchParams;
    const dateStr = params.date || new Date().toISOString().split('T')[0];

    let workoutLogs: Awaited<ReturnType<typeof getWorkoutLogsByDate>> = [];
    let mealLogs: Awaited<ReturnType<typeof getMealsByDate>> = [];

    try {
        workoutLogs = await getWorkoutLogsByDate(dateStr);
    } catch (err) {
        console.error("[History] Falha ao buscar logs de treino:", err);
    }

    try {
        mealLogs = await getMealsByDate(dateStr);
    } catch (err) {
        console.error("[History] Falha ao buscar refeições:", err);
    }

    // Safety: garantir que são arrays antes de iterar
    const safeWorkoutLogs = Array.isArray(workoutLogs) ? workoutLogs : [];
    const safeMealLogs = Array.isArray(mealLogs) ? mealLogs : [];

    const totalVolume = safeWorkoutLogs.reduce((acc, l) => {
        if (!l?.log) return acc;
        return acc + (Number(l.log.weight ?? 0) * (l.log.reps ?? 0));
    }, 0);

    const totalCals = safeMealLogs.reduce((acc, m) => {
        const items = Array.isArray(m.items) ? (m.items as any[]) : [];
        const mealCals = items.reduce((sum, item: any) =>
            sum + (Number(item?.protein ?? 0) * 4 + Number(item?.carbs ?? 0) * 4 + Number(item?.fat ?? 0) * 9), 0);
        return acc + mealCals;
    }, 0);

    const formattedDate = new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <HistoryIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Histórico
                        </h1>
                        <p className="text-muted-foreground font-medium text-sm">{formattedDate}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Workout Summary */}
                <Card className="rounded-[2.5rem] bg-card/30 backdrop-blur-xl border-none ring-1 ring-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Treinos</CardTitle>
                        <Dumbbell className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-primary mb-1">{safeWorkoutLogs.length} Exercícios</div>
                        <p className="text-xs text-muted-foreground font-medium">
                            Volume Total: <span className="text-white">{Math.round(totalVolume)} kg</span>
                        </p>

                        <WorkoutLogEditor logs={safeWorkoutLogs} />
                    </CardContent>
                </Card>

                {/* Diet Summary */}
                <Card className="rounded-[2.5rem] bg-card/30 backdrop-blur-xl border-none ring-1 ring-white/5 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Dieta</CardTitle>
                        <Utensils className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-primary mb-1">{Math.round(totalCals)} kcal</div>
                        <p className="text-xs text-muted-foreground font-medium">
                            {safeMealLogs.filter(m => m.isCompleted).length} de {safeMealLogs.length} refeições concluídas
                        </p>

                        <div className="mt-6 space-y-4">
                            {safeMealLogs.map((m, i) => {
                                const items = Array.isArray(m.items) ? (m.items as any[]) : [];
                                return (
                                    <div key={i} className={cn(
                                        "flex items-center justify-between p-3 rounded-2xl border transition-all",
                                        m.isCompleted ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/5"
                                    )}>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{m.mealName}</p>
                                            <div className="flex gap-2 text-[9px] text-muted-foreground uppercase font-black">
                                                {items.slice(0, 2).map((it: any, idx: number) => (
                                                    <span key={idx}>{it?.food ?? ""}</span>
                                                ))}
                                                {items.length > 2 && <span>...</span>}
                                            </div>
                                        </div>
                                        {m.isCompleted && <div className="h-2 w-2 rounded-full bg-green-500" />}
                                    </div>
                                );
                            })}
                            {safeMealLogs.length === 0 && (
                                <p className="text-center py-10 text-xs text-muted-foreground italic">Nenhuma refeição registrada neste dia.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Date Selector — Client Component */}
            <div className="flex items-center justify-center gap-4 py-4">
                <HistoryDatePicker defaultValue={dateStr} />
            </div>
        </div>
    );
}
