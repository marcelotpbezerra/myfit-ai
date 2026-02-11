"use client";

import { useState } from "react";
import { seedExercises, seedDietPlan } from "@/actions/sync";
import { RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SyncButton() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSync() {
        try {
            setLoading(true);
            await seedExercises();
            await seedDietPlan();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Erro ao sincronizar:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            onClick={handleSync}
            disabled={loading}
            className={cn(
                "w-full h-12 rounded-xl font-bold transition-all active:scale-95",
                success ? "bg-green-500 hover:bg-green-600 text-white" : ""
            )}
        >
            {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : success ? (
                <Check className="h-4 w-4 mr-2" />
            ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {loading ? "Sincronizando..." : success ? "Sincronizado!" : "Importar Base API"}
        </Button>
    );
}
