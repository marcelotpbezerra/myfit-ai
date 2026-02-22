"use client";

import { useState } from "react";
import { uploadBioimpedance } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Upload,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Gauge,
    Activity,
    Weight,
    Calendar,
    ChevronRight,
    History
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface BiometricRecord {
    id: number;
    weight: string | null;
    bodyFat: string | null;
    muscleMass: string | null;
    visceralFat: number | null;
    recordedAt: Date | string | null;
}

export function BioimpedanceManager({ history }: { history: BiometricRecord[] }) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastReading, setLastReading] = useState<any>(history[0] || null);

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
                setLastReading(res.data);
                toast.success("Exame processado e salvo com sucesso!");
                setFile(null);
                // In a real app, we might want to refresh the page/component to show in history
            } else {
                toast.error(res.error || "Falha ao processar o exame.");
            }
        } catch (error) {
            toast.error("Ocorreu um erro inesperado no upload.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Card */}
                <Card className="border-none bg-primary/5 backdrop-blur-xl ring-1 ring-primary/10 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Upload className="w-5 h-5 text-primary" />
                            Importar Novo Exame
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">PDF ou Imagem da sua última avaliação</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bio-file" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Anexar Arquivo</Label>
                                <Input
                                    id="bio-file"
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="h-12 bg-background/50 border-dashed border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-all rounded-xl"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 rounded-xl"
                                disabled={!file || loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    "Extrair Dados com IA"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Latest Result Card */}
                <AnimatePresence mode="wait">
                    {lastReading ? (
                        <motion.div
                            key={lastReading.id || 'new'}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="h-full"
                        >
                            <Card className="h-full border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            Última Análise
                                        </CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground">
                                            {lastReading.recordedAt ? new Date(lastReading.recordedAt).toLocaleDateString('pt-BR') : 'Agora'}
                                        </CardDescription>
                                    </div>
                                    <Activity className="h-10 w-10 text-primary/20" />
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-3 pt-4">
                                    <MetricBox icon={<Weight className="w-4 h-4" />} label="Peso" value={`${lastReading.weight || '---'} kg`} color="text-blue-400" />
                                    <MetricBox icon={<Activity className="w-4 h-4" />} label="Gordura" value={`${lastReading.bodyFat || '---'}%`} color="text-red-400" />
                                    <MetricBox icon={<Gauge className="w-4 h-4" />} label="Músculo" value={`${lastReading.muscleMass || '---'} kg`} color="text-emerald-400" />
                                    <MetricBox icon={<AlertCircle className="w-4 h-4" />} label="Visceral" value={lastReading.visceralFat || '---'} color="text-orange-400" />
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground opacity-50 bg-muted/10 rounded-3xl border-2 border-dashed border-white/5 h-full">
                            <History className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">Nenhum exame cadastrado.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* History Table */}
            {history.length > 0 && (
                <Card className="border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Histórico de Bioimpedância
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-white/5">
                            {history.map((record) => (
                                <div key={record.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{new Date(record.recordedAt!).toLocaleDateString('pt-BR')}</p>
                                            <p className="text-[10px] uppercase font-black text-muted-foreground/60">{record.weight}kg • {record.bodyFat}% gordura</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-xl">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function MetricBox({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number | null | undefined, color: string }) {
    return (
        <div className="flex flex-col bg-muted/20 p-3 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
                <span className={color}>{icon}</span>
                <span className="text-[8px] uppercase tracking-widest font-black opacity-50">{label}</span>
            </div>
            <span className="text-xl font-black">{value}</span>
        </div>
    );
}
