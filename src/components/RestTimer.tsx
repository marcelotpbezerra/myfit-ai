"use client";

import { useState, useEffect } from "react";
import { Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
    duration: number; // segundos
    onComplete?: () => void;
    onClose: () => void;
}

export function RestTimer({ duration, onComplete, onClose }: RestTimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete?.();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    const adjustTime = (seconds: number) => {
        setTimeLeft(prev => Math.max(0, prev + seconds));
    };

    const percentage = (timeLeft / duration) * 100;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-10">
            <div className="glass rounded-3xl p-6 shadow-2xl ring-2 ring-primary/20 bg-background/95 border-b-4 border-primary">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-primary animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Descanso Ativo</span>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-7xl font-black tabular-nums tracking-tighter mb-4 text-primary drop-shadow-lg">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>

                    <div className="flex gap-4 mb-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustTime(-10)}
                            className="rounded-xl border-white/5 bg-white/5 font-black hover:bg-white/10"
                        >
                            -10s
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustTime(10)}
                            className="rounded-xl border-white/5 bg-white/5 font-black hover:bg-white/10"
                        >
                            +10s
                        </Button>
                    </div>

                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
