"use client";

import { useState, useTransition } from "react";
import { updateNotificationPreference } from "@/actions/health";
import { Bell, Dumbbell, Watch, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type NotifKey = "notifyWorkoutRest" | "notifyWorkoutSet" | "notifyMealReminders";

interface NotificationSettingsProps {
    initial: {
        notifyWorkoutRest: boolean;
        notifyWorkoutSet: boolean;
        notifyMealReminders: boolean;
    };
}

const TOGGLES: { key: NotifKey; label: string; desc: string; icon: typeof Bell }[] = [
    { key: "notifyWorkoutRest", label: "Timer de Descanso", desc: "Notificar quando o descanso entre séries acabar", icon: Dumbbell },
    { key: "notifyWorkoutSet", label: "Série no Relógio", desc: "Exibir série atual no WearOS com botão \"Marcar Feita\"", icon: Watch },
    { key: "notifyMealReminders", label: "Lembretes de Refeição", desc: "Receber alertas nos horários das refeições do plano", icon: Utensils },
];

function ToggleRow({
    label,
    desc,
    icon: Icon,
    enabled,
    isPending,
    onToggle,
}: {
    label: string;
    desc: string;
    icon: typeof Bell;
    enabled: boolean;
    isPending: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                    <span className="font-bold text-sm block">{label}</span>
                    <span className="text-[11px] text-muted-foreground">{desc}</span>
                </div>
            </div>
            <button
                onClick={onToggle}
                disabled={isPending}
                className={cn(
                    "relative h-8 w-14 rounded-full transition-colors duration-300 flex items-center p-1 shrink-0",
                    enabled ? "bg-primary" : "bg-muted"
                )}
            >
                <motion.div
                    animate={{ x: enabled ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="h-6 w-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                />
            </button>
        </div>
    );
}

export function NotificationSettings({ initial }: NotificationSettingsProps) {
    const [isPending, startTransition] = useTransition();
    const [prefs, setPrefs] = useState(initial);

    const toggle = (key: NotifKey) => {
        const newValue = !prefs[key];
        setPrefs(prev => ({ ...prev, [key]: newValue }));
        startTransition(async () => {
            try {
                await updateNotificationPreference(key, newValue);
            } catch {
                setPrefs(prev => ({ ...prev, [key]: !newValue }));
            }
        });
    };

    return (
        <Card className="border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notificações
                </CardTitle>
                <CardDescription className="text-xs uppercase font-bold text-muted-foreground">
                    Escolha quais notificações deseja receber
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {TOGGLES.map(t => (
                    <ToggleRow
                        key={t.key}
                        label={t.label}
                        desc={t.desc}
                        icon={t.icon}
                        enabled={prefs[t.key]}
                        isPending={isPending}
                        onToggle={() => toggle(t.key)}
                    />
                ))}
                {isPending && (
                    <p className="text-[10px] text-primary animate-pulse font-bold mt-2 uppercase tracking-tighter text-center">
                        Sincronizando com a Nuvem...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
