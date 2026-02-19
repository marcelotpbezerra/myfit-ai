"use client";

import { useState, useEffect } from "react";
import { Timer, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RestTimerProps {
    duration: number; // segundos
    onComplete?: () => void;
    onClose: () => void;
}

const playBeep = (frequency = 440, duration = 0.1) => {
    try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);

        // Close context after playing to release resources
        setTimeout(() => audioCtx.close(), duration * 1000 + 100);
    } catch (e) {
        console.warn("Audio beep failed", e);
    }
};

export function RestTimer({ duration, onComplete, onClose }: RestTimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) {
            // Final beep to signal the end of rest
            playBeep(1320, 0.4);
            onComplete?.();
            return;
        }

        // Logic for beeps
        const alertSeconds = [20, 10, 5, 4, 3, 2, 1];
        if (alertSeconds.includes(timeLeft)) {
            // Higher pitch for the countdown
            const freq = timeLeft <= 5 ? 880 : 440;
            playBeep(freq, 0.1);
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
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[340px] animate-in fade-in zoom-in duration-300">
                <Card className="overflow-hidden border-none bg-[#0F1115]/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 rounded-[2.5rem]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                                    <Timer className="h-5 w-5 text-primary animate-pulse" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block leading-none mb-1">Timing</span>
                                    <span className="text-xs font-black uppercase tracking-widest text-white">Descanso Ativo</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-all active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="relative mb-8">
                                <div className="text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </div>
                            </div>

                            <div className="flex gap-3 mb-8">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => adjustTime(-10)}
                                    className="h-14 w-20 rounded-2xl border-white/5 bg-white/5 text-lg font-black hover:bg-white/10 text-white transition-all active:scale-95"
                                >
                                    -10s
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => adjustTime(10)}
                                    className="h-14 w-20 rounded-2xl border-white/5 bg-white/5 text-lg font-black hover:bg-white/10 text-white transition-all active:scale-95"
                                >
                                    +10s
                                </Button>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 ring-1 ring-white/5">
                                    <motion.div
                                        className="h-full bg-primary rounded-full relative"
                                        initial={false}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1, ease: "linear" }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                                    </motion.div>
                                </div>
                                <Button
                                    onClick={onClose}
                                    className="w-full h-14 rounded-2xl bg-white text-black font-black text-sm tracking-widest hover:bg-white/90 active:scale-95 transition-all"
                                >
                                    CONCLUIR DESCANSO
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
