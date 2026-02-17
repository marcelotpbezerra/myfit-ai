"use client";

import { motion, AnimatePresence } from "framer-motion";
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
    AlertTriangle,
    NotebookPen,
    Zap
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
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [exerciseStartedAt, setExerciseStartedAt] = useState<Record<number, Date>>({});
    const [showNotes, setShowNotes] = useState<Record<number, boolean>>({});

    const handleFocusExercise = (exerciseId: number) => {
        if (activeExercise === exerciseId) {
            setActiveExercise(null);
            return;
        }

        // If not started yet, mark as started
        if (!exerciseStartedAt[exerciseId]) {
            setExerciseStartedAt(prev => ({ ...prev, [exerciseId]: new Date() }));
        }
        setActiveExercise(exerciseId);
    };

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
            const now = new Date();
            await logSet({
                exerciseId: exercise.id,
                weight: input.weight,
                reps: parseInt(input.reps),
                restTime: exercise.targetRestTime || 60,
                notes: notes[exercise.id],
                startedAt: exerciseStartedAt[exercise.id] || now,
                completedAt: now
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
                // Auto-focus next PENDING exercise
                const currentIndex = exercises.findIndex(e => e.id === exercise.id);
                const nextPending = exercises.slice(currentIndex + 1).find(e => !exerciseFinished[e.id]);

                if (nextPending) {
                    handleFocusExercise(nextPending.id);
                } else {
                    // Try to find any pending from the start
                    const anyPending = exercises.find(e => !exerciseFinished[e.id] && e.id !== exercise.id);
                    if (anyPending) {
                        handleFocusExercise(anyPending.id);
                    } else {
                        setActiveExercise(null);
                    }
                }
            } else {
                setTimerDuration(exercise.targetRestTime || 60);
                setShowTimer(true);
            }
        });
    };

    return (
        <div className="space-y-4">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive rounded-3xl p-4 flex items-center gap-3"
            >
                <div className="h-10 w-10 rounded-2xl bg-destructive/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Warning: Valsalva Protection</p>
                    <p className="text-[11px] font-bold opacity-80 leading-snug">
                        Lembrete: Mantenha a expiração no esforço máximo. Não prenda a respiração.
                    </p>
                </div>
            </motion.div>

            <div className="grid gap-4">
                {exercises.map((ex, index) => (
                    <motion.div
                        key={ex.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className={cn(
                            "overflow-hidden transition-all duration-500 rounded-[2rem] border-none ring-1 ring-white/5 bg-[#0F1115]/60 backdrop-blur-md",
                            activeExercise === ex.id ? "ring-2 ring-primary bg-[#0F1115] shadow-2xl scale-[1.02]" : "hover:ring-white/10"
                        )}>
                            <CardContent className="p-0">
                                <div
                                    className="flex items-center justify-between p-6 cursor-pointer"
                                    onClick={() => handleFocusExercise(ex.id)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative shadow-inner",
                                            exerciseFinished[ex.id] ? "bg-green-500/20 text-green-500 ring-1 ring-green-500/30" :
                                                activeExercise === ex.id ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-white/5 text-white/40 ring-1 ring-white/10"
                                        )}>
                                            {exerciseFinished[ex.id] ? <CheckCircle2 className="h-7 w-7" /> : <Dumbbell className="h-7 w-7" />}
                                            {completedSets[ex.id] > 0 && !exerciseFinished[ex.id] && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-2 -right-2 h-6 w-6 bg-primary text-[11px] text-black font-black flex items-center justify-center rounded-full border-2 border-[#0F1115]"
                                                >
                                                    {completedSets[ex.id]}
                                                </motion.div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className={cn("font-black text-xl tracking-tight transition-all", exerciseFinished[ex.id] ? "text-muted-foreground/40 line-through" : "text-white")}>{ex.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-3 w-3 text-primary/50" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{ex.muscleGroup}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                                        {activeExercise === ex.id ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-white/20" />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {activeExercise === ex.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-6 space-y-6">
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Goal</span>
                                                        <span className="text-sm font-bold text-white">{ex.targetSets}x{ex.targetReps}</span>
                                                    </div>
                                                    <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Target</span>
                                                        <span className="text-sm font-bold text-white">{ex.targetWeight}kg</span>
                                                    </div>
                                                    <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Rest</span>
                                                        <span className="text-sm font-bold text-white">{ex.targetRestTime}s</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Carga Atual</label>
                                                        <Input
                                                            type="number"
                                                            placeholder={ex.targetWeight || "0"}
                                                            className="h-20 text-3xl font-black text-center rounded-[1.5rem] bg-white/5 border-none shadow-inner focus-visible:ring-primary focus-visible:bg-white/[0.08] transition-all"
                                                            value={inputs[ex.id]?.weight ?? ex.targetWeight ?? ""}
                                                            onChange={(e) => handleInputChange(ex.id, 'weight', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Reps Cons de</label>
                                                        <Input
                                                            type="number"
                                                            placeholder={ex.targetReps?.toString() || "0"}
                                                            className="h-20 text-3xl font-black text-center rounded-[1.5rem] bg-white/5 border-none shadow-inner focus-visible:ring-primary focus-visible:bg-white/[0.08] transition-all"
                                                            value={inputs[ex.id]?.reps ?? ex.targetReps?.toString() ?? ""}
                                                            onChange={(e) => handleInputChange(ex.id, 'reps', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <button
                                                        type="button"
                                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors ml-2"
                                                        onClick={() => setShowNotes(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                                                    >
                                                        <NotebookPen className="h-4 w-4" />
                                                        <span>Notas de Execução</span>
                                                    </button>
                                                    <AnimatePresence>
                                                        {showNotes[ex.id] && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                            >
                                                                <Input
                                                                    placeholder="Ex: Sentir o peitoral alongar..."
                                                                    className="h-14 text-sm rounded-2xl bg-white/[0.02] border-dashed border-white/10 focus-visible:border-primary/50"
                                                                    value={notes[ex.id] || ""}
                                                                    onChange={(e) => setNotes(prev => ({ ...prev, [ex.id]: e.target.value }))}
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <Button
                                                    onClick={() => handleLogSet(ex)}
                                                    disabled={isPending}
                                                    className="w-full h-24 text-2xl font-black rounded-[2rem] shadow-2xl shadow-primary/20 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all bg-primary hover:bg-primary/90 text-black group"
                                                >
                                                    {isPending ? "Syncing..." : (
                                                        <>
                                                            <div className="flex items-center gap-3">
                                                                <CheckCircle2 className="h-7 w-7" />
                                                                <span>CONCLUIR SÉRIE</span>
                                                            </div>
                                                            <span className="text-[10px] font-black opacity-60 tracking-[0.3em]">
                                                                SET {(completedSets[ex.id] || 0) + 1} OF {ex.targetSets}
                                                            </span>
                                                        </>
                                                    )}
                                                </Button>

                                                <div className="flex items-center justify-around py-4 opacity-50 border-t border-white/5 border-dashed">
                                                    <div className="flex flex-col items-center gap-1 cursor-not-allowed">
                                                        <History className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">Logs</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 cursor-not-allowed">
                                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">PR</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors" onClick={() => setShowTimer(true)}>
                                                        <Zap className="h-4 w-4" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">Timer</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {showTimer && (
                    <RestTimer
                        duration={timerDuration}
                        onClose={() => setShowTimer(false)}
                        onComplete={() => setShowTimer(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
