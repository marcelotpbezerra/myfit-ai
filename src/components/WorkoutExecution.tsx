"use client";

import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    logSet,
    updateTargetWeight,
    getUserSettings,
    syncExerciseTutorial,
    removeExerciseTutorial
} from "@/actions/workout";
import {
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Dumbbell,
    History,
    Play,
    Pause,
    RotateCcw,
    Save,
    Trash2,
    GripVertical,
    Plus,
    Search,
    Info,
    Clock,
    ExternalLink,
    CheckCircle2,
    Circle,
    TrendingUp,
    Settings2,
    AlertTriangle,
    NotebookPen,
    Zap,
    Flag,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    gifUrl?: string | null;
}

const STORAGE_KEY = "myfit_workout_session_v1";

// 1. Skeleton Loader para evitar o flicker de hidratação (Next.js 15)
function WorkoutSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded-xl" />
                    <div className="h-4 w-32 bg-muted rounded-lg" />
                </div>
                <div className="h-12 w-12 bg-muted rounded-2xl" />
            </div>

            <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
                <CardHeader className="p-6 pb-2">
                    <div className="h-4 w-20 bg-muted rounded mb-2" />
                    <div className="h-10 w-full bg-muted rounded-xl" />
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-muted rounded-2xl" />
                        <div className="h-20 bg-muted rounded-2xl" />
                    </div>
                    <div className="h-48 bg-muted rounded-2xl" />
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-muted rounded-2xl" />
                <div className="h-16 bg-muted rounded-2xl" />
            </div>
        </div>
    );
}

export function WorkoutExecution({ exercises: initialExercises }: { exercises: Exercise[] }) {
    const router = useRouter();
    const [orderedExercises, setOrderedExercises] = useState<Exercise[]>(initialExercises);
    const [activeExercise, setActiveExercise] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showTimer, setShowTimer] = useState(false);
    const [timerDuration, setTimerDuration] = useState(60);
    const exerciseRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const dragControls = useDragControls();
    const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const startPosRef = useRef<{ x: number, y: number } | null>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);

    // Track completed sets per exercise
    const [completedSets, setCompletedSets] = useState<Record<number, number>>({});
    const [exerciseFinished, setExerciseFinished] = useState<Record<number, boolean>>({});

    // Weights and Reps state for each exercise
    const [inputs, setInputs] = useState<Record<number, { weight: string, reps: string }>>({});
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [exerciseStartedAt, setExerciseStartedAt] = useState<Record<number, Date>>({});
    const [showNotes, setShowNotes] = useState<Record<string, boolean>>({});

    const [isMounted, setIsMounted] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.orderedExercises) {
                    // Ignora a ordem do localStorage para respeitar o que o usuário definiu no WorkoutBuilder (server-side)
                    // No WorkoutExecution, o drag-n-drop é apenas para a sessão atual
                }
                if (data.completedSets) setCompletedSets(data.completedSets);
                if (data.exerciseFinished) setExerciseFinished(data.exerciseFinished);
                if (data.inputs) setInputs(data.inputs);
                if (data.notes) setNotes(data.notes);
                if (data.activeExercise !== undefined) setActiveExercise(data.activeExercise);
            } catch (e) {
                console.error("Failed to load workout state", e);
            }
        } else {
            setOrderedExercises(initialExercises);
        }
        setIsMounted(true);
    }, [initialExercises]);

    // Save state to localStorage on every change
    useEffect(() => {
        if (!isMounted) return;

        const stateToSave = {
            orderedExercises,
            completedSets,
            exerciseFinished,
            inputs,
            notes,
            activeExercise
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [orderedExercises, completedSets, exerciseFinished, inputs, notes, activeExercise, isMounted]);

    // Auto-scroll logic
    useEffect(() => {
        if (activeExercise !== null && exerciseRefs.current[activeExercise]) {
            setTimeout(() => {
                exerciseRefs.current[activeExercise]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
        }
    }, [activeExercise]);

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
                    weight: orderedExercises.find(e => e.id === exerciseId)?.targetWeight || '',
                    reps: orderedExercises.find(e => e.id === exerciseId)?.targetReps?.toString() || ''
                }),
                [field]: value
            }
        }));
    };

    // Listener para o botão "Pular Descanso" da notificação (WearOS)
    useEffect(() => {
        const handleNotificationSkip = () => {
            setShowTimer(false);
            // Opcional: tocar um som ou vibrar para confirmar
        };
        window.addEventListener('notification:skip_rest', handleNotificationSkip);
        return () => window.removeEventListener('notification:skip_rest', handleNotificationSkip);
    }, []);

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
                const currentIndex = orderedExercises.findIndex(e => e.id === exercise.id);
                const nextPending = orderedExercises.slice(currentIndex + 1).find(e => !exerciseFinished[e.id]);

                if (nextPending) {
                    handleFocusExercise(nextPending.id);
                } else {
                    // Try to find any pending from the start
                    const anyPending = orderedExercises.find(e => !exerciseFinished[e.id] && e.id !== exercise.id);
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

    const handleFinishWorkout = () => {
        if (confirm("Deseja encerrar o treino atual? O progresso não salvo em séries individuais será perdido.")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload(); // Simplest way to reset all states to initial
        }
    };

    // 2. Prevenção de flicker com Skeleton em vez de null
    if (!isMounted) return <WorkoutSkeleton />;

    return (
        <div className="space-y-4 pb-24">

            <Reorder.Group axis="y" values={orderedExercises} onReorder={setOrderedExercises} className="grid gap-4">
                {orderedExercises.map((ex, index) => (
                    <Reorder.Item
                        key={ex.id}
                        value={ex}
                        dragControls={dragControls}
                        dragListener={false}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            scale: draggingId === ex.id ? 1.05 : 1,
                            zIndex: draggingId === ex.id ? 50 : 0
                        }}
                        transition={{
                            scale: { type: "spring", stiffness: 300, damping: 20 },
                            default: { delay: index * 0.05 }
                        }}
                        className={cn(
                            "relative group select-none",
                            draggingId === ex.id && "z-50"
                        )}
                    >
                        <Card
                            ref={(el) => { exerciseRefs.current[ex.id] = el; }}
                            className={cn(
                                "overflow-hidden transition-all duration-300 rounded-[2rem] border-none ring-1 ring-white/5 bg-[#0F1115]/60 backdrop-blur-md",
                                activeExercise === ex.id ? "ring-2 ring-primary bg-[#0F1115] shadow-2xl" : "hover:ring-white/10",
                                draggingId === ex.id && "ring-primary/50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] bg-[#0F1115]"
                            )}
                        >
                            <CardContent className="p-0">
                                <div className="flex items-center p-4 px-6 relative">
                                    <div
                                        className="absolute left-1 opacity-40 transition-opacity cursor-grab active:cursor-grabbing p-2 overflow-hidden touch-none select-none"
                                        onPointerDown={(e) => {
                                            startPosRef.current = { x: e.clientX, y: e.clientY };
                                            dragTimeoutRef.current = setTimeout(() => {
                                                if (navigator.vibrate) navigator.vibrate(50);
                                                setDraggingId(ex.id);
                                                dragControls.start(e);
                                            }, 600);
                                        }}
                                        onPointerUp={() => {
                                            if (dragTimeoutRef.current) {
                                                clearTimeout(dragTimeoutRef.current);
                                                dragTimeoutRef.current = null;
                                            }
                                            setDraggingId(null);
                                            startPosRef.current = null;
                                        }}
                                        onPointerCancel={() => {
                                            if (dragTimeoutRef.current) {
                                                clearTimeout(dragTimeoutRef.current);
                                                dragTimeoutRef.current = null;
                                            }
                                            setDraggingId(null);
                                            startPosRef.current = null;
                                        }}
                                        onPointerMove={(e) => {
                                            if (startPosRef.current) {
                                                const dx = e.clientX - startPosRef.current.x;
                                                const dy = e.clientY - startPosRef.current.y;
                                                if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                                                    if (dragTimeoutRef.current) {
                                                        clearTimeout(dragTimeoutRef.current);
                                                        dragTimeoutRef.current = null;
                                                    }
                                                    setDraggingId(null);
                                                }
                                            }
                                        }}
                                    >
                                        <GripVertical className="h-4 w-4 text-white" />
                                    </div>

                                    <div
                                        className="flex-1 flex items-center justify-between cursor-pointer"
                                        onClick={() => handleFocusExercise(ex.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative shadow-inner",
                                                exerciseFinished[ex.id] ? "bg-green-500/20 text-green-500 ring-1 ring-green-500/30" :
                                                    activeExercise === ex.id ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-white/5 text-white/40 ring-1 ring-white/10"
                                            )}>
                                                {exerciseFinished[ex.id] ? <CheckCircle2 className="h-6 w-6" /> : <Dumbbell className="h-6 w-6" />}
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
                                                <h3 className={cn("font-black text-lg tracking-tight transition-all", exerciseFinished[ex.id] ? "text-muted-foreground/40 line-through" : "text-white")}>{ex.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <Zap className="h-3 w-3 text-primary/50" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{ex.muscleGroup}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                                            {activeExercise === ex.id ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-white/20" />}
                                        </div>
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
                                                    <div className="bg-white/[0.02] rounded-2xl p-2 border border-white/5 flex flex-col items-center justify-center">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter mb-0.5">Goal</span>
                                                        <span className="text-sm font-bold text-white">{ex.targetSets}x{ex.targetReps}</span>
                                                    </div>
                                                    <div className="bg-white/[0.02] rounded-2xl p-2 border border-white/5 flex flex-col items-center justify-center">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter mb-0.5">Target</span>
                                                        <span className="text-sm font-bold text-white">{ex.targetWeight}kg</span>
                                                    </div>
                                                    <div className="bg-white/[0.02] rounded-2xl p-2 border border-white/5 flex flex-col items-center justify-center">
                                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter mb-0.5">Rest</span>
                                                        <span className="text-sm font-bold text-white">{ex.targetRestTime}s</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1 text-center">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">Carga Atual</label>
                                                        <Input
                                                            type="number"
                                                            placeholder={ex.targetWeight || "0"}
                                                            className="h-16 text-2xl font-black text-center rounded-[1.5rem] bg-white/5 border-none shadow-inner focus-visible:ring-primary focus-visible:bg-white/[0.08] transition-all"
                                                            value={inputs[ex.id]?.weight ?? ex.targetWeight ?? ""}
                                                            onChange={(e) => handleInputChange(ex.id, 'weight', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 text-center">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">Reps Cons de</label>
                                                        <Input
                                                            type="number"
                                                            placeholder={ex.targetReps?.toString() || "0"}
                                                            className="h-16 text-2xl font-black text-center rounded-[1.5rem] bg-white/5 border-none shadow-inner focus-visible:ring-primary focus-visible:bg-white/[0.08] transition-all"
                                                            value={inputs[ex.id]?.reps ?? ex.targetReps?.toString() ?? ""}
                                                            onChange={(e) => handleInputChange(ex.id, 'reps', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                                            onClick={() => setShowNotes(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                                                        >
                                                            <NotebookPen className="h-4 w-4" />
                                                            <span>Notas</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isPending}
                                                            className={cn(
                                                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl",
                                                                ex.gifUrl ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-primary/10 text-primary/60 hover:bg-primary/20"
                                                            )}
                                                            onClick={async () => {
                                                                if (ex.gifUrl && !showNotes[`gif_${ex.id}`]) {
                                                                    setShowNotes(prev => ({ ...prev, [`gif_${ex.id}`]: true }));
                                                                } else if (ex.gifUrl && showNotes[`gif_${ex.id}`]) {
                                                                    const reSync = confirm("Deseja refazer a busca deste tutorial com outro nome?");
                                                                    if (reSync) {
                                                                        const customName = prompt("Digite o nome do exercício (em português ou inglês):", ex.name);
                                                                        if (customName) {
                                                                            startTransition(async () => {
                                                                                const res = await syncExerciseTutorial(ex.id, customName);
                                                                                if (res.success && res.gifUrl) {
                                                                                    router.refresh();
                                                                                } else {
                                                                                    alert("Tutorial não encontrado com esse nome.");
                                                                                }
                                                                            });
                                                                        }
                                                                    } else {
                                                                        setShowNotes(prev => ({ ...prev, [`gif_${ex.id}`]: false }));
                                                                    }
                                                                } else {
                                                                    const customName = prompt("Digite o nome para busca (ou deixe vazio para o padrão):", ex.name);
                                                                    if (customName !== null) {
                                                                        startTransition(async () => {
                                                                            const res = await syncExerciseTutorial(ex.id, customName || ex.name);
                                                                            if (res.success && res.gifUrl) {
                                                                                setShowNotes(prev => ({ ...prev, [`gif_${ex.id}`]: true }));
                                                                                router.refresh();
                                                                            } else {
                                                                                alert("Tutorial não encontrado. Tente outro nome.");
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                                                            <span>{ex.gifUrl ? (showNotes[`gif_${ex.id}`] ? "FECHAR / REFAZER" : "VER EXECUÇÃO") : (isPending ? "BUSCANDO..." : "BUSCAR TUTORIAL")}</span>
                                                        </button>
                                                        {ex.gifUrl && (
                                                            <button
                                                                type="button"
                                                                disabled={isPending}
                                                                onClick={() => {
                                                                    if (confirm("Deseja remover o tutorial deste exercício?")) {
                                                                        startTransition(async () => {
                                                                            await removeExerciseTutorial(ex.id);
                                                                            router.refresh();
                                                                        });
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-destructive/60 hover:text-destructive transition-colors px-3 h-8 bg-destructive/5 rounded-lg border border-destructive/10"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                REMOVER VÍDEO
                                                            </button>
                                                        )}
                                                    </div>

                                                    <AnimatePresence>
                                                        {showNotes[`gif_${ex.id}`] && ex.gifUrl && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                exit={{ opacity: 0, scale: 0.95 }}
                                                                className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40"
                                                            >
                                                                <img src={ex.gifUrl} alt={ex.name} className="w-full aspect-video object-contain" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <AnimatePresence>
                                                        {showNotes[ex.id] && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                            >
                                                                <Input
                                                                    placeholder="Ex: Sentir o peitoral alongar..."
                                                                    className="h-12 text-sm rounded-2xl bg-white/[0.02] border-dashed border-white/10 focus-visible:border-primary/50 text-center"
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
                                                    className="w-full h-16 text-xl font-black rounded-[1.5rem] shadow-2xl shadow-primary/20 flex flex-col items-center justify-center gap-0 active:scale-95 transition-all bg-primary hover:bg-primary/90 text-black group"
                                                >
                                                    {isPending ? "Syncing..." : (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="h-5 w-5" />
                                                                <span>CONCLUIR SÉRIE</span>
                                                            </div>
                                                            <span className="text-[10px] font-black opacity-60 tracking-[0.2em]">
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
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-8 px-4"
            >
                <Button
                    variant="outline"
                    onClick={handleFinishWorkout}
                    className="w-full h-14 rounded-2xl border-dashed border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2"
                >
                    <Flag className="h-4 w-4" />
                    ENCERRAR TREINO ATUAL
                </Button>
            </motion.div>

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
