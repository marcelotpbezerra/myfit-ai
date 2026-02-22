"use client";

import { useState } from "react";
import { uploadBioimpedance } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Gauge, Activity, Waves, Weight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function BioimpedancePage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Selecione um arquivo primeiro.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await uploadBioimpedance(formData);
            if (res.success && res.data) {
                setResult(res.data);
                toast.success("Exame processado e salvo com sucesso!");
            } else {
                toast.error(res.error || "Falha ao processar o exame.");
            }
        } catch (error) {
            toast.error("Ocorreu um erro inesperado no upload.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                    Saúde & Bioimpedância
                </h1>
                <p className="text-muted-foreground">
                    Importe seu exame (PDF ou Imagem) para que o Consultor Gemini analise sua composição corporal.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-dashed border-blue-500/20 bg-blue-500/5 transition-all hover:border-blue-500/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-500" />
                            Importar Exame
                        </CardTitle>
                        <CardDescription>Formatos aceitos: PDF, JPG, PNG.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="bio-file" className="text-sm font-medium">Arquivo do Exame</Label>
                                <Input
                                    id="bio-file"
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="cursor-pointer file:bg-blue-500 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 hover:file:bg-blue-600 transition-colors"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                disabled={!file || loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processando com IA...
                                    </>
                                ) : (
                                    "Enviar para Análise"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-4"
                        >
                            <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-blue-500/20">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            Última Leitura
                                        </CardTitle>
                                        <span className="text-xs font-mono text-muted-foreground">Hoje</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <MetricBox icon={<Weight className="w-4 h-4" />} label="Peso" value={`${result?.weight ?? '---'} kg`} color="text-blue-500" />
                                    <MetricBox icon={<Activity className="w-4 h-4" />} label="Gordura" value={`${result?.bodyFat ?? '---'}%`} color="text-red-500" />
                                    <MetricBox icon={<Gauge className="w-4 h-4" />} label="Massa Muscular" value={`${result?.muscleMass ?? '---'} kg`} color="text-green-500" />
                                    <MetricBox icon={<AlertCircle className="w-4 h-4" />} label="G. Visceral" value={result?.visceralFat ?? '---'} color="text-orange-500" />
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!result && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50 bg-muted/5 rounded-xl border border-dashed">
                    <FileText className="w-12 h-12 mb-4" />
                    <p>Nenhum dado de bioimpedância carregado recentemente.</p>
                </div>
            )}
        </div>
    );
}

function MetricBox({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number | null | undefined, color: string }) {
    return (
        <div className="flex flex-col bg-background/50 p-3 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <span className={color}>{icon}</span>
                <span className="text-xs uppercase tracking-wider font-semibold opacity-70">{label}</span>
            </div>
            <span className="text-2xl font-bold">{value ?? '---'}</span>
        </div>
    );
}
