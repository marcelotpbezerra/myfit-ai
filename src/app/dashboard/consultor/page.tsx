"use client";

import { useState } from "react";
import { generateConsultantReport } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Sparkles,
    BrainCircuit,
    TrendingUp,
    Target,
    Zap,
    Loader2,
    CheckCircle,
    AlertTriangle,
    ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function ConsultantPage() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<{
        overview: string;
        critique: string;
        actionable_tips: string[];
    } | null>(null);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const res = await generateConsultantReport();
            if (res && !res.error) {
                setReport(res);
                toast.success("Relatório gerado com sucesso!");
            } else {
                toast.error(res?.error || "Ocorreu uma falha ao gerar o relatório.");
            }
        } catch (error) {
            toast.error("O cérebro da IA está sobrecarregado. Tente novamente.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                        Consultor Gemini IA
                    </h1>
                    <p className="text-muted-foreground">
                        Sua inteligência de alta performance para treinos e nutrição.
                    </p>
                </div>
                <Button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-6 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analisando Biometria e Logs...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Gerar Análise Semanal
                        </>
                    )}
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {report ? (
                    <motion.div
                        key="report"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {/* Overview & Critique */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="border-purple-500/20 bg-purple-500/5 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-purple-400">
                                        <TrendingUp className="w-5 h-5" />
                                        Visão Geral da Semana
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="leading-relaxed text-lg">{report?.overview ?? 'Sem resumo disponível.'}</p>
                                </CardContent>
                            </Card>

                            <Card className="border-pink-500/20 bg-pink-500/5 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-pink-400">
                                        <Target className="w-5 h-5" />
                                        Análise Crítica (Fisiologista)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="leading-relaxed whitespace-pre-line">{report?.critique ?? 'Sem crítica disponível no momento.'}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Actionable Tips */}
                        <div className="space-y-6">
                            <Card className="border-orange-500/20 bg-orange-500/5 backdrop-blur-sm h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-orange-400">
                                        <Zap className="w-5 h-5" />
                                        Próximos Passos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Array.isArray(report?.actionable_tips) ? report.actionable_tips.map((tip, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex gap-3 items-start bg-background/50 p-4 rounded-xl border border-orange-500/10 shadow-sm"
                                        >
                                            <div className="bg-orange-500/20 p-1 rounded">
                                                <ArrowRight className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <p className="text-sm font-medium">{tip}</p>
                                        </motion.div>
                                    )) : (
                                        <p className="text-sm text-muted-foreground">Nenhuma dica prática disponível.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-32 text-center space-y-4 bg-muted/5 rounded-3xl border-2 border-dashed border-muted transition-all"
                    >
                        <div className="bg-muted p-6 rounded-full">
                            <BrainCircuit className="w-16 h-16 text-muted-foreground opacity-40" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Cérebro IA Pronto</h2>
                            <p className="text-muted-foreground max-w-sm">
                                Clique no botão acima para consolidar seus treinos, dieta e bioimpedância em um relatório técnico.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
