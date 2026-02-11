"use client";

import { useState, useTransition } from "react";
import { updateWorkoutSplit, importBaseExercises } from "@/actions/workout";
import {
    Layers,
    Database,
    Check,
    ChevronRight,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SPLIT_OPTIONS = [
    { id: "AB", label: "Divisão A-B", desc: "Treino Superior / Inferior" },
    { id: "ABC", label: "Divisão A-B-C", desc: "Push / Pull / Legs" },
    { id: "ABCD", label: "Divisão A-B-C-D", desc: "Músculos Isolados" },
];

export function WorkoutSplitter({ currentSplit }: { currentSplit: string }) {
    const [isPending, startTransition] = useTransition();
    const [isImporting, setIsImporting] = useState(false);
    const [selected, setSelected] = useState(currentSplit);

    const handleUpdateSplit = (split: string) => {
        setSelected(split);
        startTransition(async () => {
            await updateWorkoutSplit(split);
        });
    };

    const handleImport = async () => {
        setIsImporting(true);
        await importBaseExercises();
        setIsImporting(false);
        alert("Exercícios base importados com sucesso!");
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Selecione sua Divisão</label>
                {SPLIT_OPTIONS.map((option) => (
                    <Card
                        key={option.id}
                        className={cn(
                            "cursor-pointer transition-all active:scale-98",
                            selected === option.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/40"
                        )}
                        onClick={() => handleUpdateSplit(option.id)}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center",
                                    selected === option.id ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    <Layers className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold">{option.label}</h4>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase">{option.desc}</p>
                                </div>
                            </div>
                            {selected === option.id && (
                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                    <Check className="h-4 w-4 stroke-[3px]" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="p-6 rounded-3xl bg-muted/30 border-2 border-dashed border-muted flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center text-muted-foreground">
                    <Database className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="font-bold text-sm">Base de Exercícios</h4>
                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Importe nossa base oficial para começar seu treino rapidamente.</p>
                </div>
                <Button
                    variant="secondary"
                    onClick={handleImport}
                    disabled={isImporting}
                    className="rounded-xl h-11 px-6 font-bold"
                >
                    {isImporting ? "Importando..." : "Importar Base"}
                </Button>
            </div>
        </div>
    );
}
