"use client";

import { useState, useTransition } from "react";
import { logSet, getRecentLogs } from "@/actions/workout";
import {
    ChevronRight,
    ChevronDown,
    Dumbbell,
    History,
    CheckCircle2,
    Circle,
    TrendingUp,
    Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RestTimer } from "./RestTimer";
import { cn } from "@/lib/utils";

interface Exercise {
    id: number;
    name: string;
    muscleGroup: string | null;
}

export function WorkoutExecution({ exercises }: { exercises: Exercise[] }) {
    const [activeExercise, setActiveExercise] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showTimer, setShowTimer] = useState(false);
    const [timerDuration, setTimerDuration] = useState(60);

    // Weights and Reps state for each exercise
    const [inputs, setInputs] = useState<Record<number, { weight: string, reps: string }>>({});

    const handleInputChange = (exerciseId: number, field: 'weight' | 'reps', value: string) => {
        setInputs(prev => ({
            ...prev,
            [exerciseId]: {
                ...(prev[exerciseId] || { weight: '', reps: '' }),
                [field]: value
            }
        }));
    };

    const handleLogSet = async (exerciseId: number) => {
        const input = inputs[exerciseId];
        if (!input?.weight || !input?.reps) return;

        startTransition(async () => {
            await logSet({
                exerciseId,
                weight: input.weight,
                reps: parseInt(input.reps),
                restTime: timerDuration
            });
            setShowTimer(true);
        });
    };

    return (
        <div className="space-y-4">
            {exercises.map((ex) => (
                <Card key={ex.id} className={cn(
                    "overflow-hidden transition-all duration-300",
                    activeExercise === ex.id ? "ring-2 ring-primary border-transparent shadow-2xl" : "hover:border-primary/30"
                )}>
                    <CardContent className="p-0">
                        <div
                            className="flex items-center justify-between p-5 cursor-pointer"
                            onClick={() => setActiveExercise(activeExercise === ex.id ? null : ex.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                                    activeExercise === ex.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                )}>
                                    <Dumbbell className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg tracking-tight">{ex.name}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{ex.muscleGroup}</p>
                                </div>
                            </div>
                            {activeExercise === ex.id ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                        </div>

                        {activeExercise === ex.id && (
                            <div className="px-5 pb-5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Carga (kg)</label>
                                        <Input
                                            type="number"
                                            placeholder="00"
                                            className="h-16 text-2xl font-black text-center rounded-2xl bg-muted/50 border-none shadow-sm focus-visible:ring-primary"
                                            value={inputs[ex.id]?.weight || ""}
                                            onChange={(e) => handleInputChange(ex.id, 'weight', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reps</label>
                                        <Input
                                            type="number"
                                            placeholder="00"
                                            className="h-16 text-2xl font-black text-center rounded-2xl bg-muted/50 border-none shadow-sm focus-visible:ring-primary"
                                            value={inputs[ex.id]?.reps || ""}
                                            onChange={(e) => handleInputChange(ex.id, 'reps', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleLogSet(ex.id)}
                                    disabled={isPending || !inputs[ex.id]?.weight || !inputs[ex.id]?.reps}
                                    className="w-full h-20 text-xl font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all"
                                >
                                    {isPending ? "Salvando..." : (
                                        <>
                                            <CheckCircle2 className="h-6 w-6" />
                                            Série Completa
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center justify-around py-4 border-t border-dashed">
                                    <div className="flex flex-col items-center gap-1 opacity-40">
                                        <History className="h-4 w-4" />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Histórico</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 opacity-40">
                                        <TrendingUp className="h-4 w-4" />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Progresso</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 opacity-40" onClick={() => setShowTimer(true)}>
                                        <Settings2 className="h-4 w-4" />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">Descanso</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}

            {showTimer && (
                <RestTimer
                    duration={timerDuration}
                    onClose={() => setShowTimer(false)}
                    onComplete={() => setShowTimer(false)}
                />
            )}
        </div>
    );
}
