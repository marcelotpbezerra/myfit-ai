"use client";

import React, { useEffect, useState } from "react";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { LockKeyhole, Fingerprint } from "lucide-react";
import { getUserSettings } from "@/actions/health";

export function BiometricGuard({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Safe timeout to prevent app hang if server actions or native calls fail
        const timeoutId = setTimeout(() => {
            if (isChecking) {
                console.warn("Biometric check timed out, proceeding to dashboard");
                setIsChecking(false);
                setIsAuthenticated(true); // Fail-safe: let user in
            }
        }, 5000);

        const checkBiometric = async () => {
            try {
                // If we're not on a native platform, skip immediately
                if (!Capacitor.isNativePlatform()) {
                    setIsAuthenticated(true);
                    setIsChecking(false);
                    clearTimeout(timeoutId);
                    return;
                }

                // Check settings (Server Action)
                const settings = await getUserSettings().catch(err => {
                    console.error("Failed to fetch settings for biometric", err);
                    return null;
                });

                const isBiometricEnabled = settings?.biometricEnabled ?? false;

                if (!isBiometricEnabled) {
                    setIsAuthenticated(true);
                    setIsChecking(false);
                    clearTimeout(timeoutId);
                    return;
                }

                const result = await NativeBiometric.isAvailable();
                if (result.isAvailable) {
                    await NativeBiometric.verifyIdentity({
                        reason: "Autenticação MyFit.ai",
                        title: "Login Biométrico",
                        subtitle: "Confirme sua identidade para acessar",
                        description: "Use FaceID ou TouchID",
                    });
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error("Biometric verification failed", error);
                // On error, we still let the user in as a fail-safe for now
                setIsAuthenticated(true);
            } finally {
                setIsChecking(false);
                clearTimeout(timeoutId);
            }
        };

        const scheduleAllMealNotifications = async () => {
            if (!Capacitor.isNativePlatform()) return;

            const MEAL_NOTIFICATIONS = [
                { id: 1, hour: 8, minute: 0, title: "Café da Manhã! ☀️", body: "Marcelo, hora de abastecer o motor! Cuscuz + ovos + frango 💪" },
                { id: 2, hour: 10, minute: 0, title: "Lanche da Manhã! 🥤", body: "Whey isolado + pasta de amendoim. Anabolismo ativado! 🚀" },
                { id: 3, hour: 12, minute: 0, title: "Almoço! 🍽️", body: "Arroz integral + frango grelhado. Energia para a tarde! ⚡" },
                { id: 4, hour: 17, minute: 0, title: "Pré-Treino! 💪", body: "Iogurte + whey + granola. Prepare-se para destruir! 🔥" },
                { id: 5, hour: 20, minute: 0, title: "Pós-Treino/Jantar! 🏋️", body: "Frango + vegetais + batata. Recuperação anabólica! 💯" },
                { id: 6, hour: 22, minute: 30, title: "Ceia Proteica! 🌙", body: "Whey + pasta de amendoim. Crescimento noturno! 😴💪" }
            ];

            try {
                // Cancelar notificações antigas
                await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

                // Agendar todas as 6 notificações recorrentes
                await LocalNotifications.schedule({
                    notifications: MEAL_NOTIFICATIONS.map(meal => ({
                        title: meal.title,
                        body: meal.body,
                        id: meal.id,
                        schedule: {
                            on: { hour: meal.hour, minute: meal.minute },
                            repeats: true
                        },
                        sound: "beep.wav",
                        attachments: [],
                        actionTypeId: "",
                        extra: null
                    }))
                });
            } catch (error) {
                console.error("Notification scheduling failed", error);
            }
        };

        checkBiometric();
        scheduleAllMealNotifications();
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
