"use client";

import { useEffect, useState } from "react";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { Capacitor } from "@capacitor/core";
import { Fingerprint, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function BiometricInvite({ biometricEnabled }: { biometricEnabled: boolean }) {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        const checkAvailability = async () => {
            if (!Capacitor.isNativePlatform() || biometricEnabled) return;

            try {
                const result = await NativeBiometric.isAvailable();
                if (result.isAvailable) {
                    // Check if user has already dismissed it this session (optional)
                    const dismissed = sessionStorage.getItem("biometric-invite-dismissed");
                    if (!dismissed) {
                        setShouldShow(true);
                    }
                }
            } catch (error) {
                console.error("Error checking biometric availability", error);
            }
        };

        checkAvailability();
    }, [biometricEnabled]);

    if (!shouldShow) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="relative overflow-hidden rounded-3xl bg-primary/10 border border-primary/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4 group hover:bg-primary/15 transition-colors duration-500"
            >
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-black">
                        <Fingerprint className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black italic">Segurança Biométrica</h3>
                        <p className="text-sm text-muted-foreground font-medium">
                            Proteja seus dados com FaceID ou Digital.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            sessionStorage.setItem("biometric-invite-dismissed", "true");
                            setShouldShow(false);
                        }}
                        className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Agora não
                    </button>
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        Configurar
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Decorative background element */}
                <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            </motion.div>
        </AnimatePresence>
    );
}
