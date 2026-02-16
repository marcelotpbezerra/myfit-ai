"use client";

import React, { useEffect, useState } from "react";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { LockKeyhole } from "lucide-react";

export function BiometricGuard({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkBiometric = async () => {
            if (!Capacitor.isNativePlatform()) {
                setIsAuthenticated(true);
                setIsChecking(false);
                return;
            }

            try {
                const result = await NativeBiometric.isAvailable();
                if (result.isAvailable) {
                    const verified = await NativeBiometric.verifyIdentity({
                        reason: "Autenticação MyFit.ai",
                        title: "Login Biométrico",
                        subtitle: "Confirme sua identidade para acessar",
                        description: "Use FaceID ou TouchID",
                    });
                    setIsAuthenticated(true);
                } else {
                    // Fallback if not available (or user didn't set it up)
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Biometric verification failed", error);
                // In production, you might want to force logout or show a pin screen
                // For now, we allow retry
            } finally {
                setIsChecking(false);
            }
        };

        const scheduleNotification = async () => {
            if (!Capacitor.isNativePlatform()) return;

            try {
                const pending = await LocalNotifications.getPending();
                if (pending.notifications.length === 0) {
                    await LocalNotifications.schedule({
                        notifications: [
                            {
                                title: "Hora da Ceia! 🥛",
                                body: "Marcelo, hora da sua Ceia Proteica! 🥚",
                                id: 1,
                                schedule: {
                                    on: { hour: 22, minute: 30 },
                                    repeats: true
                                },
                                sound: "beep.wav",
                                attachments: [],
                                actionTypeId: "",
                                extra: null
                            }
                        ]
                    });
                }
            } catch (error) {
                console.error("Notification scheduling failed", error);
            }
        };

        checkBiometric();
        scheduleNotification();
    }, []);

    if (isChecking) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-[#080808] text-white">
                <div className="animate-pulse rounded-full bg-primary/20 p-8">
                    <LockKeyhole className="h-12 w-12 text-primary" />
                </div>
                <p className="font-bold tracking-widest uppercase text-sm animate-pulse">Verificando...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-[#080808] text-white p-8 text-center">
                <div className="rounded-full bg-red-500/20 p-6">
                    <LockKeyhole className="h-12 w-12 text-red-500" />
                </div>
                <h1 className="text-2xl font-black">Acesso Bloqueado</h1>
                <p className="text-muted-foreground">A autenticação biométrica é necessária.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-white text-black font-bold px-8 py-3 active:scale-95 transition-transform"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
