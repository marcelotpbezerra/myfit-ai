import { getWorkoutLogsByDate } from "@/actions/workout";
import { getMealsByDate } from "@/actions/diet";
import { History as HistoryIcon, Dumbbell, Utensils, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChangeEvent } from "react";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const params = await searchParams;
    const dateStr = params.date || new Date().toISOString().split('T')[0];

    const workoutLogs = await getWorkoutLogsByDate(dateStr);
    const mealLogs = await getMealsByDate(dateStr);

    const totalVolume = workoutLogs.reduce((acc, l) => acc + (Number(l.log.weight || 0) * (l.log.reps || 0)), 0);
    const totalCals = mealLogs.reduce((acc, m) => {
        const items = (m.items as any[]) || [];
        const mealCals = items.reduce((sum, item) => sum + (Number(item.protein || 0) * 4 + Number(item.carbs || 0) * 4 + Number(item.fat || 0) * 9), 0);
        return acc + mealCals;
    }, 0);

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
                        <p className="text-muted-foreground font-medium text-sm">
                            {new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
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
                        <div className="text-3xl font-black text-primary mb-1">{workoutLogs.length} Exercícios</div>
                        <p className="text-xs text-muted-foreground font-medium">Volume Total: <span className="text-white">{Math.round(totalVolume)} kg</span></p>

                        <div className="mt-6 space-y-4">
                            {workoutLogs.map((l, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">{l.exercise.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">{l.log.weight}kg x {l.log.reps} reps</p>
                                    </div>
                                    <div className="text-[10px] font-black text-primary/60">
                                        {l.log.createdAt ? new Date(l.log.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' }) : ""}
                                    </div>
                                </div>
                            ))}
                            {workoutLogs.length === 0 && (
                                <p className="text-center py-10 text-xs text-muted-foreground italic">Nenhum treino registrado neste dia.</p>
                            )}
                        </div>
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
                        <p className="text-xs text-muted-foreground font-medium">{mealLogs.filter(m => m.isCompleted).length} de {mealLogs.length} refeições concluídas</p>

                        <div className="mt-6 space-y-4">
                            {mealLogs.map((m, i) => (
                                <div key={i} className={cn(
                                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                                    m.isCompleted ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/5"
                                )}>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold">{m.mealName}</p>
                                        <div className="flex gap-2 text-[9px] text-muted-foreground uppercase font-black">
                                            {((m.items as any[]) || []).slice(0, 2).map((it, idx) => (
                                                <span key={idx}>{it.food}</span>
                                            ))}
                                            {((m.items as any[]) || []).length > 2 && <span>...</span>}
                                        </div>
                                    </div>
                                    {m.isCompleted && <div className="h-2 w-2 rounded-full bg-green-500" />}
                                </div>
                            ))}
                            {mealLogs.length === 0 && (
                                <p className="text-center py-10 text-xs text-muted-foreground italic">Nenhuma refeição registrada neste dia.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Simple Date Selector (Expandable later to a proper calendar) */}
            <div className="flex items-center justify-center gap-4 py-4">
                <Input
                    type="date"
                    defaultValue={dateStr}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const newDate = e.target.value;
                        if (newDate) window.location.href = `/dashboard/history?date=${newDate}`;
                    }}
                    className="w-48 h-12 rounded-2xl bg-card/50 border-none shadow-xl text-center font-bold"
                />
            </div>
        </div>
    );
}
