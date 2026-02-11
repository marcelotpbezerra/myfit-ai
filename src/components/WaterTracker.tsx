"use client";

import { useOptimistic, useTransition } from "react";
import { addWaterLog } from "@/actions/health";
import { Droplets, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WaterTrackerProps {
    initialAmount: number;
}

export function WaterTracker({ initialAmount }: WaterTrackerProps) {
    const [isPending, startTransition] = useTransition();
    const [optimisticWater, addOptimisticWater] = useOptimistic(
        initialAmount,
        (state, amount: number) => state + amount
    );

    const goal = 4500; // 4.5 Litros
    const progress = Math.min((optimisticWater / goal) * 100, 100);

    async function handleAddWater(amount: number) {
        startTransition(() => {
            addOptimisticWater(amount);
        });
        await addWaterLog(amount);
    }

    return (
        <Card className="overflow-hidden border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Hidratação
                </CardTitle>
                <span className="text-xs text-muted-foreground uppercase font-black">Meta: 4.5L</span>
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
