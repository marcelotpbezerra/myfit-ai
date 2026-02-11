"use client";

import { useState } from "react";
import { analyzeProgressWithGemini } from "@/actions/ai";
import { Sparkles, Brain, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function AIInsights() {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGetInsight = async () => {
        setLoading(true);
        try {
            const res = await analyzeProgressWithGemini();
            setInsight(res);
        } catch (err) {
            setInsight("Erro ao conectar com a IA.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-3xl ring-2 ring-primary/20 overflow-hidden shadow-2xl">
                <CardContent className="p-8 flex flex-col items-center text-center gap-6">
                    <div className="h-16 w-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                        <Brain className="h-8 w-8 animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tighter">Insight do Treinador IA</h3>
                        <p className="text-muted-foreground text-sm max-w-[280px]">
                            Analise seus treinos e dieta dos últimos 7 dias com inteligência artificial.
                        </p>
                    </div>

                    <Button
                        onClick={handleGetInsight}
                        disabled={loading}
                        className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/30 font-black text-lg gap-3 active:scale-95 transition-all group"
                    >
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />}
                        {loading ? "Processando Dados..." : "Pedir Insight à IA"}
                        <ChevronRight className="h-5 w-5 opacity-50" />
                    </Button>
                </CardContent>
            </Card>

            <AnimatePresence>
                {insight && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative"
                    >
                        <Card className="border-none bg-card/50 backdrop-blur-xl ring-1 ring-white/10 rounded-3xl overflow-hidden p-6">
                            <div className="prose prose-sm prose-invert max-w-none">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Análise Gerada</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
                                    {insight}
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
