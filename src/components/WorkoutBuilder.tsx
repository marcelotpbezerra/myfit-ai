"use client";

import { useState, useTransition } from "react";
import { EXERCISES_DB } from "@/lib/exercises-db";
import { addExerciseToWorkout, deleteExercise } from "@/actions/workout";
import { Plus, Trash2, Search, Dumbbell, Target, X, Save } from "lucide-react";
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

    // Form state for adding/editing targets
    const [editingExercise, setEditingExercise] = useState<any | null>(null);
    const [form, setForm] = useState({
        targetSets: 3,
        targetReps: 12,
        targetWeight: "0",
        targetRestTime: 60
    });

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
        <div className="space-y-8">
            {/* Montador Section */}
            <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                    <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Montar Treino
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-muted-foreground font-sans">Adicionar ao:</span>
                        <div className="flex gap-1 bg-muted p-1 rounded-xl">
                            {splitLetters.map(letter => (
                                <button
                                    key={letter}
                                    onClick={() => setSelectedSplit(letter)}
                                    className={cn(
                                        "h-8 w-8 rounded-lg font-black text-xs transition-all",
                                        selectedSplit === letter ? "bg-primary text-black" : "hover:bg-background"
                                    )}
                                >
                                    {letter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {!editingExercise ? (
                    <>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar exercício (ex: Supino, Pernas...)"
                                className="pl-10 h-12 rounded-2xl bg-muted/50 border-none shadow-inner"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredExercises.map((ex) => (
                                <div
                                    key={ex.name}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-card border border-white/5 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                            <Dumbbell className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{ex.name}</p>
                                            <p className="text-[10px] uppercase font-black text-muted-foreground">{ex.muscleGroup}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleSelectForAdd(ex)}
                                        className="rounded-xl h-9 w-9 p-0 hover:bg-primary hover:text-black"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="p-6 rounded-[32px] bg-primary/5 border border-primary/20 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary text-black flex items-center justify-center">
                                    <Dumbbell className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase">{editingExercise.name}</p>
                                    <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Definir Metas para Treino {selectedSplit}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setEditingExercise(null)} className="rounded-full h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Séries</label>
                                <Input
                                    type="number"
                                    value={form.targetSets}
                                    onChange={e => setForm({ ...form, targetSets: parseInt(e.target.value) })}
                                    className="rounded-xl bg-background border-none h-12 text-center font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reps</label>
                                <Input
                                    type="number"
                                    value={form.targetReps}
                                    onChange={e => setForm({ ...form, targetReps: parseInt(e.target.value) })}
                                    className="rounded-xl bg-background border-none h-12 text-center font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Carga (kg)</label>
                                <Input
                                    type="number"
                                    value={form.targetWeight}
                                    onChange={e => setForm({ ...form, targetWeight: e.target.value })}
                                    className="rounded-xl bg-background border-none h-12 text-center font-bold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descanso (s)</label>
                                <Input
                                    type="number"
                                    value={form.targetRestTime}
                                    onChange={e => setForm({ ...form, targetRestTime: parseInt(e.target.value) })}
                                    className="rounded-xl bg-background border-none h-12 text-center font-bold"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2"
                            onClick={handleConfirmAdd}
                            disabled={isPending}
                        >
                            <Save className="h-4 w-4" />
                            {isPending ? "Salvando..." : "Confirmar Exercício"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Visualização do Treino Atual */}
            <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Meu Plano Atual
                </h3>

                {splitLetters.map(letter => {
                    const exercisesInSplit = currentExercises.filter(ex => ex.split === letter);
                    return (
                        <div key={letter} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-white/5 text-muted-foreground flex items-center justify-center text-[10px] font-black border border-white/5">
                                    {letter}
                                </div>
                                <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Treino {letter}</h4>
                            </div>

                            {exercisesInSplit.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic ml-8">Nenhum exercício adicionado ainda.</p>
                            ) : (
                                <div className="grid gap-3 ml-4 border-l-2 border-primary/10 pl-4">
                                    {exercisesInSplit.map((ex) => (
                                        <div
                                            key={ex.id}
                                            className="flex flex-col p-4 rounded-2xl bg-muted/20 border border-white/5 group relative overflow-hidden"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Target className="h-4 w-4 text-primary" />
                                                    <span className="text-sm font-black uppercase">{ex.name}</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(ex.id)}
                                                    disabled={isPending}
                                                    className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground">Séries</span>
                                                    <span className="text-xs font-bold text-white">{ex.targetSets}x</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground">Reps</span>
                                                    <span className="text-xs font-bold text-white">{ex.targetReps}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground">Carga</span>
                                                    <span className="text-xs font-bold text-white">{ex.targetWeight}kg</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-muted-foreground">Descanso</span>
                                                    <span className="text-xs font-bold text-white">{ex.targetRestTime}s</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
