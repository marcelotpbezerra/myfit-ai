"use client";

import { useState, useEffect } from "react";
import { Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

    const percentage = (timeLeft / duration) * 100;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-10">
            <div className="glass rounded-3xl p-6 shadow-2xl ring-2 ring-primary/20 bg-background/95 border-b-4 border-primary">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-primary animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tempo de Descanso</span>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-6xl font-black tabular-nums tracking-tighter mb-4 text-primary">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>

                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000 ease-linear"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
