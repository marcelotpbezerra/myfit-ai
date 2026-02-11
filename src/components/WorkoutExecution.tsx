"use client";

import { useState, useTransition } from "react";
import { logSet, getRecentLogs, updateTargetWeight } from "@/actions/workout";
import {
    ChevronRight,
    ChevronDown,
    Dumbbell,
    History,
    CheckCircle2,
    Circle,
    TrendingUp,
    Settings2,
    AlertTriangle
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
    targetSets: number | null;
    targetReps: number | null;
    targetWeight: string | null;
    targetRestTime: number | null;
}

export function WorkoutExecution({ exercises }: { exercises: Exercise[] }) {
    const [activeExercise, setActiveExercise] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showTimer, setShowTimer] = useState(false);
    const [timerDuration, setTimerDuration] = useState(60);

    // Track completed sets per exercise
    const [completedSets, setCompletedSets] = useState<Record<number, number>>({});
    const [exerciseFinished, setExerciseFinished] = useState<Record<number, boolean>>({});

    // Weights and Reps state for each exercise
    const [inputs, setInputs] = useState<Record<number, { weight: string, reps: string }>>({});

    const handleInputChange = (exerciseId: number, field: 'weight' | 'reps', value: string) => {
        setInputs(prev => ({
            ...prev,
            [exerciseId]: {
                ...(prev[exerciseId] || {
                    weight: exercises.find(e => e.id === exerciseId)?.targetWeight || '',
                    reps: exercises.find(e => e.id === exerciseId)?.targetReps?.toString() || ''
                }),
                [field]: value
            }
        }));
    };

    const handleLogSet = async (exercise: Exercise) => {
        const input = inputs[exercise.id] || {
            weight: exercise.targetWeight || '',
            reps: exercise.targetReps?.toString() || ''
        };

        if (!input.weight || !input.reps) return;

        startTransition(async () => {
            await logSet({
                exerciseId: exercise.id,
                weight: input.weight,
                reps: parseInt(input.reps),
                restTime: exercise.targetRestTime || 60
            });

            // Update target weight if changed
            if (input.weight !== exercise.targetWeight) {
                await updateTargetWeight(exercise.id, input.weight);
            }

            // Update series counter
            const newSetsCount = (completedSets[exercise.id] || 0) + 1;
            setCompletedSets(prev => ({ ...prev, [exercise.id]: newSetsCount }));

            if (newSetsCount >= (exercise.targetSets || 3)) {
                setExerciseFinished(prev => ({ ...prev, [exercise.id]: true }));
                // Auto-focus next exercise if exists
                const currentIndex = exercises.findIndex(e => e.id === exercise.id);
                if (currentIndex < exercises.length - 1) {
                    setActiveExercise(exercises[currentIndex + 1].id);
                } else {
                    setActiveExercise(null);
                }
            } else {
                setTimerDuration(exercise.targetRestTime || 60);
                setShowTimer(true);
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-wide">
                    Aviso: Cuidado com a Manobra de Valsalva (Prender a respiração) durante o esforço. Mantenha a expiração no esforço.
                </p>
            </div>

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
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors relative",
                                    exerciseFinished[ex.id] ? "bg-green-500 text-white" :
                                        activeExercise === ex.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                )}>
                                    {exerciseFinished[ex.id] ? <CheckCircle2 className="h-6 w-6" /> : <Dumbbell className="h-6 w-6" />}
                                    {completedSets[ex.id] > 0 && !exerciseFinished[ex.id] && (
                                        <div className="absolute -top-2 -right-2 h-5 w-5 bg-primary text-[10px] text-black font-black flex items-center justify-center rounded-full border-2 border-[#080808]">
                                            {completedSets[ex.id]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className={cn("font-black text-lg tracking-tight", exerciseFinished[ex.id] && "text-muted-foreground line-through")}>{ex.name}</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{ex.muscleGroup}</p>
                                </div>
                            </div>
                            {activeExercise === ex.id ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                        </div>

                        {activeExercise === ex.id && (
                            <div className="px-5 pb-5 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex gap-4 justify-center py-2 bg-muted/30 rounded-2xl border border-white/5">
                                    <div className="text-center px-4 border-r border-white/10">
                                        <p className="text-[8px] font-black uppercase text-muted-foreground">Meta</p>
                                        <p className="text-xs font-bold">{ex.targetSets}x{ex.targetReps}</p>
                                    </div>
                                    <div className="text-center px-4 border-r border-white/10">
                                        <p className="text-[8px] font-black uppercase text-muted-foreground">Carga</p>
                                        <p className="text-xs font-bold">{ex.targetWeight}kg</p>
                                    </div>
                                    <div className="text-center px-4">
                                        <p className="text-[8px] font-black uppercase text-muted-foreground">Descanso</p>
                                        <p className="text-xs font-bold">{ex.targetRestTime}s</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Carga (kg)</label>
                                        <Input
                                            type="number"
                                            placeholder={ex.targetWeight || "00"}
                                            className="h-16 text-2xl font-black text-center rounded-2xl bg-muted/50 border-none shadow-sm focus-visible:ring-primary placeholder:text-muted-foreground/30"
                                            value={inputs[ex.id]?.weight ?? ex.targetWeight ?? ""}
                                            onChange={(e) => handleInputChange(ex.id, 'weight', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reps</label>
                                        <Input
                                            type="number"
                                            placeholder={ex.targetReps?.toString() || "00"}
                                            className="h-16 text-2xl font-black text-center rounded-2xl bg-muted/50 border-none shadow-sm focus-visible:ring-primary placeholder:text-muted-foreground/30"
                                            value={inputs[ex.id]?.reps ?? ex.targetReps?.toString() ?? ""}
                                            onChange={(e) => handleInputChange(ex.id, 'reps', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleLogSet(ex)}
                                    disabled={isPending}
                                    className="w-full h-20 text-xl font-black rounded-3xl shadow-xl shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all"
                                >
                                    {isPending ? "Salvando..." : (
                                        <>
                                            <CheckCircle2 className="h-6 w-6" />
                                            Série {(completedSets[ex.id] || 0) + 1} / {ex.targetSets}
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
