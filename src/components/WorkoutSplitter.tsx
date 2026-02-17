"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateWorkoutSplit, importBaseExercises } from "@/actions/workout";
import {
    Layers,
    Database,
    Check,
    ChevronRight,
    Info,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SPLIT_OPTIONS = [
    { id: "AB", label: "Divisão A-B", desc: "Estrutura Superior / Inferior" },
    { id: "ABC", label: "Divisão A-B-C", desc: "Push / Pull / Legs (Padrão)" },
    { id: "ABCD", label: "Divisão A-B-C-D", desc: "Alta Intensidade / Isolados" },
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
        try {
            await importBaseExercises();
            alert("Protocolo Redesoft MyFit importado!");
        } catch (e) {
            console.error(e);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="space-y-10 pb-10">
            <div className="space-y-6">
                <div className="flex flex-col gap-1">
                    <h3 className="font-black text-xl uppercase tracking-tight text-white flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Configurar Divisão
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-7">
                        Selecione a arquitetura do seu treino
                    </p>
                </div>

                <div className="grid gap-4">
                    {SPLIT_OPTIONS.map((option, index) => (
                        <motion.div
                            key={option.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleUpdateSplit(option.id)}
                            className="relative"
                        >
                            <div className={cn(
                                "relative overflow-hidden cursor-pointer transition-all duration-500 rounded-[2rem] border-none ring-1 ring-white/5 bg-[#0F1115]/60 backdrop-blur-md p-6 group",
                                selected === option.id ? "ring-2 ring-primary bg-[#0F1115] shadow-2xl scale-[1.02]" : "hover:bg-[#16191F]"
                            )}>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                            selected === option.id ? "bg-primary text-black shadow-lg shadow-primary/20 rotate-12" : "bg-white/5 text-muted-foreground group-hover:scale-110"
                                        )}>
                                            <Layers className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h4 className={cn(
                                                "font-black text-lg uppercase transition-colors",
                                                selected === option.id ? "text-white" : "text-muted-foreground/80 group-hover:text-white"
                                            )}>{option.label}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{option.desc}</p>
                                        </div>
                                    </div>
                                    {selected === option.id ? (
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-black">
                                            <Check className="h-5 w-5 stroke-[3px]" />
                                        </div>
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary transition-all" />
                                    )}
                                </div>

                                {selected === option.id && (
                                    <motion.div
                                        layoutId="glow"
                                        className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-none"
                                    />
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="relative group overflow-hidden rounded-[2.5rem] bg-[#0F1115] border border-white/5 p-8 text-center space-y-6 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center text-primary border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Database className="h-10 w-10" />
                    </div>
                    <div>
                        <h4 className="font-black text-lg uppercase text-white mb-2">Protocolo Base</h4>
                        <p className="text-xs font-medium text-muted-foreground/60 max-w-[240px] leading-relaxed uppercase tracking-tighter">
                            Sincronize com a base de dados otimizada MyFit para configuração automatizada.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={handleImport}
                        disabled={isImporting}
                        className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] bg-white/5 border border-white/5 hover:bg-primary hover:text-black transition-all duration-500 flex items-center justify-center gap-3"
                    >
                        {isImporting ? (
                            <span className="animate-pulse">Sincronizando...</span>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                Importar Lab Base
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
