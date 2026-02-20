"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EXERCISES_DB } from "@/lib/exercises-db";
import { addExerciseToWorkout, deleteExercise, addExerciseToCatalog } from "@/actions/workout";
import { searchExerciseFromAPI, RemoteExercise } from "@/lib/exercise-api";
import { Plus, Trash2, Search, Dumbbell, Target, X, Save, ArrowRight, Info, Zap, Globe, Loader2, Sparkles, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WorkoutBuilderProps {
    currentExercises: any[];
    currentSplit: string;
}

export function WorkoutBuilder({ currentExercises, currentSplit }: WorkoutBuilderProps) {
    const [isPending, startTransition] = useTransition();
    const [search, setSearch] = useState("");
    const [selectedSplit, setSelectedSplit] = useState("A");

    // Estados para Busca Global (API)
    const [isSearchingAPI, setIsSearchingAPI] = useState(false);
    const [remoteResults, setRemoteResults] = useState<RemoteExercise[]>([]);
    const [showRemote, setShowRemote] = useState(false);

    // Form state for adding/editing targets
    const [editingExercise, setEditingExercise] = useState<any | null>(null);
    const [form, setForm] = useState({
        targetSets: 3,
        targetReps: 12,
        targetWeight: "0",
        targetRestTime: 60
    });

    // Debounce manual para busca na API
    useEffect(() => {
        if (search.length < 3) {
            setRemoteResults([]);
            setShowRemote(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingAPI(true);
            try {
                const results = await searchExerciseFromAPI(search);
                setRemoteResults(results);
                if (results.length > 0) setShowRemote(true);
            } catch (err) {
                console.error("Erro na busca global:", err);
            } finally {
                setIsSearchingAPI(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [search]);

    const filteredExercises = EXERCISES_DB.filter(ex =>
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectForAdd = (exercise: any) => {
        setEditingExercise(exercise);
        setForm({
            targetSets: 3,
            targetReps: 12,
            targetWeight: "0",
            targetRestTime: 60
        });
    };

    const handleAddFromRemote = async (ex: RemoteExercise) => {
        startTransition(async () => {
            await addExerciseToCatalog({
                name: ex.name,
                muscleGroup: ex.targetMuscle,
                equipment: ex.equipment,
                gifUrl: ex.gifUrl
            });
            // Limpar busca para mostrar o novo exercício no catálogo local
            setSearch("");
            setRemoteResults([]);
            setShowRemote(false);
        });
    };

    const handleConfirmAdd = () => {
        if (!editingExercise) return;

        startTransition(async () => {
            await addExerciseToWorkout({
                name: editingExercise.name,
                muscleGroup: editingExercise.muscleGroup,
                split: selectedSplit,
                ...form
            });
            setEditingExercise(null);
        });
    };

    const handleDelete = (id: number) => {
        startTransition(async () => {
            await deleteExercise(id);
        });
    };

    const splitLetters = currentSplit.split("");

    return (
        <div className="space-y-8 pb-10">
            {/* Montador Section */}
            <div className="space-y-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center justify-between">
                    <div>
                        <h3 className="font-black text-xl uppercase tracking-tight flex items-center gap-2 text-white">
                            <Plus className="h-5 w-5 text-primary" />
                            Montar Treino
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-7">
                            Estruture sua rotina
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Destino:</span>
                        <div className="flex gap-2 bg-[#0F1115] p-1.5 rounded-2xl ring-1 ring-white/5 shadow-inner">
                            {splitLetters.map(letter => (
                                <button
                                    key={letter}
                                    onClick={() => setSelectedSplit(letter)}
                                    className={cn(
                                        "h-10 w-10 rounded-xl font-black text-xs transition-all duration-300",
                                        selectedSplit === letter ? "bg-primary text-black shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground hover:bg-white/5"
                                    )}
                                >
                                    {letter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!editingExercise ? (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input
                                    placeholder="Buscar exercício (Supino, Pernas...)"
                                    className="pl-12 h-16 text-sm rounded-2xl bg-[#0F1115] border-none ring-1 ring-white/5 focus-visible:ring-primary/50 transition-all shadow-inner"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {isSearchingAPI && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                {/* BUSCA GLOBAL (API) */}
                                {showRemote && remoteResults.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-2 py-1">
                                            <Globe className="h-3 w-3 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Busca Global (ExerciseDB)</span>
                                        </div>
                                        {remoteResults.map((ex, idx) => (
                                            <motion.div
                                                key={`remote-${idx}`}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {ex.gifUrl ? (
                                                        <img src={ex.gifUrl} alt={ex.name} className="h-12 w-12 rounded-xl object-cover ring-1 ring-primary/20" />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                            <Dumbbell className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                    <div className="max-w-[120px] sm:max-w-none truncate">
                                                        <p className="font-bold text-sm text-white truncate">{ex.name}</p>
                                                        <p className="text-[10px] uppercase font-black text-primary/60 tracking-widest truncate">{ex.targetMuscle} • {ex.equipment}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddFromRemote(ex);
                                                    }}
                                                    className="h-10 px-4 rounded-xl bg-primary text-black font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <Sparkles className="h-3 w-3 mr-2" />
                                                    Add
                                                </Button>
                                            </motion.div>
                                        ))}
                                        <div className="h-px bg-white/5 my-4" />
                                    </div>
                                )}

                                {/* BUSCA LOCAL */}
                                <div className="flex items-center gap-2 px-2 py-1">
                                    <Database className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Catálogo Local</span>
                                </div>
                                {filteredExercises.map((ex, index) => (
                                    <motion.div
                                        key={ex.name}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group active:scale-[0.98]"
                                        onClick={() => handleSelectForAdd(ex)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
                                                <Dumbbell className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{ex.name}</p>
                                                <p className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">{ex.muscleGroup}</p>
                                            </div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-8 rounded-[2.5rem] bg-[#0F1115] border border-primary/20 space-y-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Dumbbell className="h-24 w-24" />
                            </div>

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/20">
                                        <Target className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-lg uppercase leading-none mb-1">{editingExercise.name}</p>
                                        <p className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Set Targets for Split {selectedSplit}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setEditingExercise(null)} className="rounded-full h-10 w-10 p-0 hover:bg-white/10">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Séries</label>
                                    <Input
                                        type="number"
                                        value={form.targetSets}
                                        onChange={e => setForm({ ...form, targetSets: parseInt(e.target.value) })}
                                        className="rounded-2xl bg-white/5 border-none h-16 text-center font-black text-xl focus-visible:ring-primary shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Reps</label>
                                    <Input
                                        type="number"
                                        value={form.targetReps}
                                        onChange={e => setForm({ ...form, targetReps: parseInt(e.target.value) })}
                                        className="rounded-2xl bg-white/5 border-none h-16 text-center font-black text-xl focus-visible:ring-primary shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Carga (kg)</label>
                                    <Input
                                        type="number"
                                        value={form.targetWeight}
                                        onChange={e => setForm({ ...form, targetWeight: e.target.value })}
                                        className="rounded-2xl bg-white/5 border-none h-16 text-center font-black text-xl focus-visible:ring-primary shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">Descanso (s)</label>
                                    <Input
                                        type="number"
                                        value={form.targetRestTime}
                                        onChange={e => setForm({ ...form, targetRestTime: parseInt(e.target.value) })}
                                        className="rounded-2xl bg-white/5 border-none h-16 text-center font-black text-xl focus-visible:ring-primary shadow-inner"
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-20 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 bg-primary text-black shadow-xl shadow-primary/10 hover:bg-primary/90 active:scale-[0.98] transition-all relative z-10"
                                onClick={handleConfirmAdd}
                                disabled={isPending}
                            >
                                <Save className="h-6 w-6" />
                                {isPending ? "Syncing..." : "Confirmar Exercício"}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Visualização do Treino Atual */}
            <div className="space-y-8 pt-8 border-t border-white/5">
                <div>
                    <h3 className="font-black text-xl uppercase tracking-tight flex items-center gap-2 text-white">
                        <Target className="h-5 w-5 text-primary" />
                        Meu Plano Atual
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-7">
                        Overview da programação
                    </p>
                </div>

                <div className="grid gap-6">
                    {splitLetters.map(letter => {
                        const exercisesInSplit = currentExercises.filter(ex => ex.split === letter);
                        return (
                            <div key={letter} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 text-primary flex items-center justify-center text-sm font-black border border-white/5 shadow-inner">
                                        {letter}
                                    </div>
                                    <h4 className="font-black text-sm uppercase tracking-[0.2em] text-white">Treino {letter}</h4>
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                </div>

                                {exercisesInSplit.length === 0 ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground/40 italic ml-10">
                                        <Info className="h-3 w-3" />
                                        <span>Nenhum exercício definido</span>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 ml-4 pl-6 border-l-2 border-primary/5">
                                        {exercisesInSplit.map((ex) => (
                                            <motion.div
                                                layout
                                                key={ex.id}
                                                className="flex flex-col p-5 rounded-3xl bg-white/[0.02] border border-white/5 group relative overflow-hidden transition-all hover:bg-white/[0.04]"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <Zap className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="text-sm font-black uppercase tracking-tight text-white">{ex.name}</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(ex.id)}
                                                        disabled={isPending}
                                                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <div className="flex flex-col items-center p-2 rounded-xl bg-black/20">
                                                        <span className="text-[7px] font-black uppercase text-muted-foreground/60 tracking-tighter">Sets</span>
                                                        <span className="text-xs font-black text-white">{ex.targetSets}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-2 rounded-xl bg-black/20">
                                                        <span className="text-[7px] font-black uppercase text-muted-foreground/60 tracking-tighter">Reps</span>
                                                        <span className="text-xs font-black text-white">{ex.targetReps}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-2 rounded-xl bg-black/20">
                                                        <span className="text-[7px] font-black uppercase text-muted-foreground/60 tracking-tighter">Carga</span>
                                                        <span className="text-xs font-black text-white">{ex.targetWeight}k</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-2 rounded-xl bg-black/20">
                                                        <span className="text-[7px] font-black uppercase text-muted-foreground/60 tracking-tighter">Rest</span>
                                                        <span className="text-xs font-black text-white">{ex.targetRestTime}s</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
