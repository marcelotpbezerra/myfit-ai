"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWorkoutLog, updateWorkoutLog } from "@/actions/workout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkoutLog {
    log: {
        id: number;
        weight: string | null;
        reps: number | null;
        createdAt: Date | null;
    };
    exercise: { name: string } | null;
}

interface WorkoutLogEditorProps {
    logs: WorkoutLog[];
}

export function WorkoutLogEditor({ logs }: WorkoutLogEditorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editWeight, setEditWeight] = useState("");
    const [editReps, setEditReps] = useState("");

    function openEdit(log: WorkoutLog["log"]) {
        setEditingId(log.id);
        setEditWeight(log.weight ?? "");
        setEditReps(log.reps?.toString() ?? "");
    }

    function cancelEdit() {
        setEditingId(null);
        setEditWeight("");
        setEditReps("");
    }

    function handleSave(logId: number) {
        startTransition(async () => {
            const result = await updateWorkoutLog(logId, editWeight, parseInt(editReps) || 0);
            if (result.success) {
                setEditingId(null);
                router.refresh();
            } else {
                alert(result.error || "Erro ao salvar");
            }
        });
    }

    function handleDelete(logId: number) {
        if (!confirm("Remover este registro de série?")) return;
        startTransition(async () => {
            const result = await deleteWorkoutLog(logId);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || "Erro ao deletar");
            }
        });
    }

    if (logs.length === 0) {
        return (
            <p className="text-center py-10 text-xs text-muted-foreground italic">
                Nenhum treino registrado neste dia.
            </p>
        );
    }

    return (
        <div className="space-y-3 mt-6">
            {logs.map((l, i) => {
                const timeStr = l.log.createdAt
                    ? new Date(l.log.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                    : "";
                const isEditing = editingId === l.log.id;

                return (
                    <div
                        key={i}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                            isEditing
                                ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
                                : "bg-white/5 border-white/5"
                        )}
                    >
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Dumbbell className="h-4 w-4 text-primary/60" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{l.exercise?.name ?? "—"}</p>

                            {isEditing ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                        type="number"
                                        value={editWeight}
                                        onChange={(e) => setEditWeight(e.target.value)}
                                        placeholder="Peso (kg)"
                                        className="h-8 w-24 text-xs rounded-xl bg-card border-none focus-visible:ring-primary text-center font-bold"
                                    />
                                    <span className="text-muted-foreground text-xs font-black">×</span>
                                    <Input
                                        type="number"
                                        value={editReps}
                                        onChange={(e) => setEditReps(e.target.value)}
                                        placeholder="Reps"
                                        className="h-8 w-20 text-xs rounded-xl bg-card border-none focus-visible:ring-primary text-center font-bold"
                                    />
                                    <span className="text-[10px] text-muted-foreground font-bold">reps</span>
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground uppercase font-black">
                                    {l.log.weight}kg × {l.log.reps} reps
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                            {isEditing ? (
                                <>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        disabled={isPending}
                                        onClick={() => handleSave(l.log.id)}
                                        className="h-8 w-8 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                        title="Salvar"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={cancelEdit}
                                        className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-white/10"
                                        title="Cancelar"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <span className="text-[10px] font-black text-primary/60 mr-1">{timeStr}</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => openEdit(l.log)}
                                        className="h-8 w-8 rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
                                        title="Editar"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        disabled={isPending}
                                        onClick={() => handleDelete(l.log.id)}
                                        className="h-8 w-8 rounded-xl text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                                        title="Deletar"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
