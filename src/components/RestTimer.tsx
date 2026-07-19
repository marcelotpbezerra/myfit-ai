"use client";

import { useState, useEffect, useRef } from "react";
import { Timer, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RestTimerProps {
    duration: number; // segundos
    /** Nome do próximo exercício/exercício atual — exibido na notificação do relógio */
    exerciseName?: string;
    /** Número da próxima série a ser executada */
    nextSetNumber?: number;
    /** Total de séries do exercício */
    totalSets?: number;
    /** Peso-alvo (para exibir no relógio) */
    targetWeight?: string | null;
    /** Repetições-alvo (para exibir no relógio) */
    targetReps?: number | null;
    /** Sessão formal de descanso criada pelo fluxo do treino */
    restSession?: RestSession;
    /** Dispara a cada tick/ajuste para persistência local ou sync com relógio */
    onRestChange?: (session: RestSession) => void;
    /** Dispara quando descanso termina, é pulado ou concluído manualmente */
    onRestComplete?: (session: RestSession) => void;
    onComplete?: () => void;
    onClose: () => void;
}

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { NotificationService } from "@/lib/notifications";
import { publishWearWorkoutState } from "@/lib/wear-bridge";
import {
    adjustRestSession,
    completeRestSession,
    createRestSession,
    RestSession,
    tickRestSession,
} from "@/lib/rest-engine";

const playBeep = async (frequency = 440, duration = 0.1, isFinal = false) => {
    try {
        const browserWindow = window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
        };
        const AudioContextClass = window.AudioContext || browserWindow.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);

        // Trigger native ducking via Local Notification if on mobile
        if (isFinal && Capacitor.isNativePlatform()) {
            LocalNotifications.schedule({
                notifications: [{
                    title: "Tempo Esgotado!",
                    body: "Próxima série agora!",
                    id: 999,
                    schedule: { at: new Date(Date.now() + 10) },
                    sound: 'beep.wav',
                    channelId: "workout"
                }]
            }).catch(err => console.error("Notification ducking failed", err));
        }

        setTimeout(() => audioCtx.close(), duration * 1000 + 100);
    } catch (e) {
        console.warn("Audio beep failed", e);
    }
};

export function RestTimer({
    duration,
    exerciseName,
    nextSetNumber,
    totalSets,
    targetWeight,
    targetReps,
    restSession: initialRestSession,
    onRestChange,
    onRestComplete,
    onComplete,
    onClose
}: RestTimerProps) {
    const [restSession, setRestSession] = useState<RestSession>(() =>
        initialRestSession ?? createRestSession({
            exerciseId: 0,
            exerciseName,
            setIndex: nextSetNumber ?? 1,
            totalSets,
            targetWeight,
            targetReps,
            source: "phone",
        }, duration)
    );
    const didFinishRef = useRef(false);
    const timeLeft = restSession.remainingSeconds;

    // Mantém a versão mais recente de restSession acessível sem forçar o efeito
    // de notificação/listeners abaixo a re-executar a cada tick (era a causa raiz
    // do bug: cancelar+reagendar a notificação de descanso a cada 1s, o que fazia
    // o alerta final "perseguir" sempre `duration` segundos à frente e nunca disparar).
    const restSessionRef = useRef(restSession);
    useEffect(() => {
        restSessionRef.current = restSession;
    }, [restSession]);

    const commitRestSession = (nextSession: RestSession) => {
        setRestSession(nextSession);
        onRestChange?.(nextSession);
        return nextSession;
    };

    const finishRest = (status: "completed" | "skipped" = "completed") => {
        if (didFinishRef.current) return;
        didFinishRef.current = true;
        const finished = completeRestSession(restSessionRef.current, status);
        commitRestSession(finished);
        onRestComplete?.(finished);
        onComplete?.();
        onClose();
    };

    useEffect(() => {
        // Disparar notificação acionável ao iniciar descanso (para WearOS/Mobile)
        // Agora inclui contexto do próximo exercício para exibição no relógio
        NotificationService.scheduleRestNotification(duration, {
            exerciseName,
            nextSetNumber,
            totalSets,
            targetWeight,
            targetReps,
        });
        void publishWearWorkoutState({
            workoutSessionId: restSessionRef.current.workoutId ?? restSessionRef.current.id,
            exerciseName,
            setNumber: nextSetNumber ?? 0,
            totalSets: totalSets ?? 0,
            restEndsAtEpochMs: Date.now() + restSessionRef.current.remainingSeconds * 1000,
        });

        // Listeners para ações do WearOS / Notificação
        const handleStartNextSet = () => {
            console.log("WearOS: Iniciando próxima série");
            finishRest("skipped");
        };

        const handleSubtract10s = () => {
            console.log("WearOS: Subtraindo 10s");
            const nextSession = adjustRestSession(restSessionRef.current, -10);
            commitRestSession(nextSession);
            // Reagenda notificação com tempo atualizado
            NotificationService.scheduleRestNotification(nextSession.remainingSeconds, {
                exerciseName,
                nextSetNumber,
                totalSets,
                targetWeight,
                targetReps,
            });
        };

        const handleExtend30s = () => {
            console.log("WearOS: Adicionando 30s");
            const nextSession = adjustRestSession(restSessionRef.current, 30);
            commitRestSession(nextSession);
            NotificationService.scheduleRestNotification(nextSession.remainingSeconds, {
                exerciseName,
                nextSetNumber,
                totalSets,
                targetWeight,
                targetReps,
            });
        };

        window.addEventListener('notification:start_next_set', handleStartNextSet);
        window.addEventListener('notification:subtract_10s', handleSubtract10s);
        window.addEventListener('notification:extend_30s', handleExtend30s);
        // Mantemos o listener antigo por compatibilidade se houver cache
        window.addEventListener('notification:skip_rest', handleStartNextSet);

        return () => {
            window.removeEventListener('notification:start_next_set', handleStartNextSet);
            window.removeEventListener('notification:subtract_10s', handleSubtract10s);
            window.removeEventListener('notification:extend_30s', handleExtend30s);
            window.removeEventListener('notification:skip_rest', handleStartNextSet);
            NotificationService.cancelRestNotifications();
        };
        // Roda uma única vez por sessão de descanso — o RestTimer é remontado a
        // cada novo período de descanso (`{showTimer && <RestTimer ... />}` em
        // WorkoutExecution). NÃO adicionar `restSession` aqui: ele muda a cada
        // tick (1x/seg) e recriava este efeito ~60x/min, cancelando e reagendando
        // a notificação de "descanso finalizado" com o `duration` total a cada
        // vez — o alerta nunca chegava a disparar de fato.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (timeLeft <= 0) {
            playBeep(2500, 0.6, true);
            window.setTimeout(() => finishRest("completed"), 0);
            return;
        }

        const alertSeconds = [10, 5, 4, 3, 2, 1];
        if (alertSeconds.includes(timeLeft)) {
            const freq = timeLeft <= 3 ? 3000 : 2000;
            playBeep(freq, 0.15);
        }

        const timer = setInterval(() => {
            const nextSession = tickRestSession(restSession);
            commitRestSession(nextSession);

            // Atualiza o relógio (a cada 5s quando longe, a cada 1s no final para economizar bateria)
            if (nextSession.remainingSeconds >= 0 && (nextSession.remainingSeconds <= 10 || nextSession.remainingSeconds % 5 === 0)) {
                NotificationService.updateLiveRestTimer(nextSession.remainingSeconds, {
                    exerciseName,
                    nextSetNumber,
                    totalSets
                });
                void publishWearWorkoutState({
                    workoutSessionId: nextSession.workoutId ?? nextSession.id,
                    exerciseName,
                    setNumber: nextSetNumber ?? 0,
                    totalSets: totalSets ?? 0,
                    restEndsAtEpochMs: Date.now() + nextSession.remainingSeconds * 1000,
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, restSession]); // eslint-disable-line react-hooks/exhaustive-deps

    const adjustTime = (seconds: number) => {
        const nextSession = adjustRestSession(restSession, seconds);
        commitRestSession(nextSession);
    };

    const percentage = Math.min(100, (timeLeft / restSession.plannedRestSeconds) * 100);

    // Linha de contexto exibida no modal (teléfone)
    const contextLine = exerciseName
        ? `${exerciseName} — Série ${nextSetNumber ?? "?"}/${totalSets ?? "?"}`
        : null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={() => finishRest("skipped")}
            />
            <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[340px] animate-in fade-in zoom-in duration-300">
                <Card className="overflow-hidden border-none bg-[#0F1115]/80 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 rounded-[2.5rem]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
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
                                onClick={() => finishRest("skipped")}
                                className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-all active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contexto do próximo exercício */}
                        {contextLine && (
                            <div className="mb-4 px-3 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-0.5">Próxima</p>
                                <p className="text-xs font-black text-primary truncate">{contextLine}</p>
                                {(targetWeight || targetReps) && (
                                    <p className="text-[10px] text-primary/60 font-bold mt-0.5">
                                        {targetWeight && `${targetWeight}kg`}{targetWeight && targetReps && " × "}{targetReps && `${targetReps} reps`}
                                    </p>
                                )}
                            </div>
                        )}

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
                                    onClick={() => adjustTime(30)}
                                    className="h-14 w-20 rounded-2xl border-white/5 bg-white/5 text-lg font-black hover:bg-white/10 text-white transition-all active:scale-95"
                                >
                                    +30s
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
                                    onClick={() => finishRest("completed")}
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
