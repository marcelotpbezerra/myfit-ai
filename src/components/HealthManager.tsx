"use client";

import { useState, useTransition } from "react";
import { addHealthStat } from "@/actions/health";
import {
    Weight,
    Ruler,
    Camera,
    Plus,
    Check,
    Moon,
    Droplets
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const BIOMETRICS = [
    { id: "weight", label: "Peso", unit: "kg", icon: Weight },
    { id: "waist_cm", label: "Cintura", unit: "cm", icon: Ruler },
    { id: "arm_cm", label: "Braço", unit: "cm", icon: Ruler },
    { id: "chest_cm", label: "Peito", unit: "cm", icon: Ruler },
];

export function BiometricsManager({ latestStats }: { latestStats: any }) {
    const [isPending, startTransition] = useTransition();
    const [values, setValues] = useState<Record<string, string>>(latestStats || {});

    const handleSave = (type: string) => {
        const val = values[type];
        if (!val) return;

        startTransition(async () => {
            await addHealthStat(type, val);
            alert(`${type} atualizado!`);
        });
    };

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {BIOMETRICS.map((bio) => (
                <Card key={bio.id} className="overflow-hidden border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <bio.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{bio.label} ({bio.unit})</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    value={values[bio.id] || ""}
                                    onChange={(e) => setValues({ ...values, [bio.id]: e.target.value })}
                                    className="h-10 rounded-xl bg-background/50 border-none shadow-inner"
                                />
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={() => handleSave(bio.id)}
                                    disabled={isPending}
                                    className="rounded-xl h-10 w-10 shrink-0"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

import { WaterHistoryChart } from "./WaterHistoryChart";

export function HabitTracker({
    waterHistory = [],
    waterGoal = 3000
}: {
    waterHistory?: any[],
    waterGoal?: number
}) {
    const [isPending, startTransition] = useTransition();
    const [sleep, setSleep] = useState("");

    const handleSleepSave = () => {
        if (!sleep) return;
        startTransition(async () => {
            await addHealthStat("sleep_hours", sleep);
            setSleep("");
            alert("Sono registrado!");
        });
    };

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-none bg-blue-500/5 backdrop-blur-xl ring-1 ring-blue-500/10 h-full">
                <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Moon className="h-5 w-5" />
                        </div>
                        <h4 className="font-bold text-sm">Horas de Sono</h4>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Ex: 8"
                            value={sleep}
                            onChange={(e) => setSleep(e.target.value)}
                            className="h-12 rounded-xl bg-background/50 border-none shadow-sm"
                        />
                        <Button onClick={handleSleepSave} disabled={isPending} className="h-12 px-6 rounded-xl bg-blue-500 hover:bg-blue-600">Salvar</Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black">Normalização via Health Connect em breve.</p>
                </CardContent>
            </Card>

            <WaterHistoryChart data={waterHistory} goal={waterGoal} />
        </div>
    );
}

export function ProgressPhotos() {
    const [isPending, startTransition] = useTransition();

    const handleMockUpload = () => {
        startTransition(async () => {
            // Simulando upload
            const mockUrl = `https://picsum.photos/seed/${Math.random()}/400/600`;
            await addHealthStat("photo_url", mockUrl);
            alert("Foto de progresso salva! (Modo Simulação)");
        });
    };

    return (
        <Card className="border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    Fotos de Evolução
                </CardTitle>
                <CardDescription className="text-xs uppercase font-bold text-muted-foreground">Registre sua transformação visual</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-[3/4] rounded-2xl bg-muted/50 border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={handleMockUpload}>
                            <Plus className="h-6 w-6" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Adicionar</span>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-center text-muted-foreground italic">Dica: Tire fotos no mesmo local e iluminação para comparar.</p>
            </CardContent>
        </Card>
    );
}
