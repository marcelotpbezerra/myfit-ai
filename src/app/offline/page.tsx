import { WifiOff, Dumbbell } from "lucide-react";
import Link from "next/link";

/**
 * Página exibida pelo Service Worker quando o usuário tenta
 * navegar para uma rota não cacheada enquanto está offline.
 */
export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6 text-center dark:bg-[#080808]">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="rounded-3xl bg-primary/10 p-6">
                        <Dumbbell className="h-12 w-12 stroke-[2px] text-primary" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 rounded-full bg-amber-500 p-1.5">
                        <WifiOff className="h-4 w-4 text-amber-950" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black tracking-tight">
                        Você está offline
                    </h1>
                    <p className="max-w-xs text-sm text-muted-foreground">
                        Esta página ainda não está disponível offline. Volte ao dashboard
                        para registrar seus treinos e refeições sem internet.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
                >
                    Ir para o Dashboard
                </Link>
                <Link
                    href="/dashboard/workout"
                    className="inline-flex items-center justify-center rounded-2xl border border-border px-6 py-3 text-sm font-bold transition-all active:scale-95 hover:bg-accent/50"
                >
                    Registrar Treino
                </Link>
            </div>

            <p className="text-xs text-muted-foreground/60">
                Os dados registrados offline serão sincronizados automaticamente
                quando a conexão for restabelecida.
            </p>
        </div>
    );
}
