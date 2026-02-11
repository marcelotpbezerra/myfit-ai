"use client";

import { useOptimistic, useTransition, useState } from "react";
import { Droplets, Plus, Pencil, Save, X } from "lucide-react";
import { addWaterLog, updateWaterGoal } from "@/actions/health";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WaterTrackerProps {
    initialAmount: number;
    initialGoal: number;
}

export function WaterTracker({ initialAmount, initialGoal }: WaterTrackerProps) {
    const [isPending, startTransition] = useTransition();
    const [optimisticWater, addOptimisticWater] = useOptimistic(
        initialAmount,
        (state, amount: number) => state + amount
    );

    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [newGoal, setNewGoal] = useState(initialGoal.toString());

    const progress = Math.min((optimisticWater / initialGoal) * 100, 100);

    async function handleAddWater(amount: number) {
        startTransition(() => {
            addOptimisticWater(amount);
        });
        await addWaterLog(amount);
    }

    async function handleSaveGoal() {
        const goalNum = parseInt(newGoal);
        if (isNaN(goalNum)) return;

        startTransition(async () => {
            await updateWaterGoal(goalNum);
            setIsEditingGoal(false);
        });
    }

    return (
        <Card className="overflow-hidden border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Hidratação
                </CardTitle>
                {isEditingGoal ? (
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            className="w-16 h-6 text-[10px] bg-white/10 rounded px-1 outline-none text-white font-bold"
                            value={newGoal}
                            onChange={(e) => setNewGoal(e.target.value)}
                            autoFocus
                        />
                        <button onClick={handleSaveGoal} className="text-green-500"><Save className="h-3 w-3" /></button>
                        <button onClick={() => setIsEditingGoal(false)} className="text-red-500"><X className="h-3 w-3" /></button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsEditingGoal(true)}
                        className="text-xs text-muted-foreground uppercase font-black flex items-center gap-1 hover:text-primary transition-colors"
                    >
                        Meta: {(initialGoal / 1000).toFixed(1)}L
                        <Pencil className="h-2 w-2" />
                    </button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{(optimisticWater / 1000).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground uppercase">Litros</span>
                    </div>
                    <span className="text-sm font-medium text-blue-500">{progress.toFixed(0)}%</span>
                </div>

                <Progress value={progress} className="h-2 bg-blue-100 dark:bg-blue-900/40" />

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-14 hover:bg-blue-500/10 hover:text-blue-500 border-dashed"
                        onClick={() => handleAddWater(250)}
                        disabled={isPending}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        250ml
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-14 hover:bg-blue-500/10 hover:text-blue-500 border-dashed"
                        onClick={() => handleAddWater(500)}
                        disabled={isPending}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        500ml
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
