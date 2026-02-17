"use client";

import { useState, useTransition } from "react";
import { updateBiometricSetting } from "@/actions/health";
import { Fingerprint, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BiometricToggle({ initialValue }: { initialValue: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [enabled, setEnabled] = useState(initialValue);

    const toggle = () => {
        const newValue = !enabled;
        setEnabled(newValue);
        startTransition(async () => {
            try {
                await updateBiometricSetting(newValue);
            } catch (error) {
                setEnabled(!newValue); // Rollback
                console.error("Failed to update biometric setting", error);
            }
        });
    };

    return (
        <Card className="border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-primary" />
                    Biometria Nativa
                </CardTitle>
                <CardDescription className="text-xs uppercase font-bold text-muted-foreground">
                    Ative para proteger o acesso ao Dashboard
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span className="font-bold text-sm">
                        {enabled ? "Ativado" : "Desativado"}
                    </span>
                    <button
                        onClick={toggle}
                        disabled={isPending}
                        className={cn(
                            "relative h-8 w-14 rounded-full transition-colors duration-300 flex items-center p-1",
                            enabled ? "bg-primary" : "bg-muted"
                        )}
                    >
                        <motion.div
                            animate={{ x: enabled ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="h-6 w-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                        >
                            {enabled ? (
                                <Check className="h-3 w-3 text-primary stroke-[3px]" />
                            ) : (
                                <X className="h-3 w-3 text-muted-foreground stroke-[3px]" />
                            )}
                        </motion.div>
                    </button>
                </div>
                {isPending && (
                    <p className="text-[10px] text-primary animate-pulse font-bold mt-2 uppercase tracking-tighter text-center">
                        Sincronizando com a Nuvem...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
