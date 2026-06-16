"use client";

import { useState, useTransition } from "react";
import { seedMarceloProtocol } from "@/actions/seedMarcelo2026";
import { Download } from "lucide-react";

export function SeedProtocolDialog({ hasPlan }: { hasPlan: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [done, setDone] = useState(false);

    if (hasPlan || done) return null;

    const handleSeed = () => {
        if (!confirm("Carregar protocolo base de refeições?\n\nVocê pode personalizar tudo depois em Protocolo.")) return;
        startTransition(async () => {
            try {
                await seedMarceloProtocol();
                setDone(true);
                window.location.reload();
            } catch (e) {
                console.error("[Seed] Erro:", e);
            }
        });
    };

    return (
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mx-auto">
                <Download className="h-7 w-7" />
            </div>
            <div>
                <h3 className="text-lg font-black">Nenhum protocolo de refeições</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Carregue um protocolo base para começar a registrar sua dieta.
                </p>
            </div>
            <button
                onClick={handleSeed}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
                {isPending ? "Carregando..." : "Carregar Protocolo Base"}
            </button>
        </div>
    );
}
