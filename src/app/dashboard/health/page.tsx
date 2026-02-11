import { getLatestStats, getAIContext } from "@/actions/health";
import { BiometricsManager, HabitTracker, ProgressPhotos } from "@/components/HealthManager";
import { AISettings } from "@/components/AISettings";
import { Activity, Heart } from "lucide-react";

export default async function HealthPage() {
    const latestStats = await getLatestStats();
    const initialContext = await getAIContext();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
                    Saúde & Biometria <Activity className="h-8 w-8 text-primary" />
                </h1>
                <p className="text-muted-foreground font-medium">
                    Acompanhe sua evolução física e hábitos diários.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                            <h2 className="text-xl font-black tracking-tight">Biometria Atual</h2>
                        </div>
                        <BiometricsManager latestStats={latestStats} />
                    </section>

                    <section className="space-y-4">
                        <HabitTracker />
                    </section>

                    <section className="space-y-4">
                        <ProgressPhotos />
                    </section>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                    <AISettings initialContext={initialContext} />

                    <div className="p-6 rounded-3xl bg-muted/20 border border-white/5 space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground/60">Insight Rápido</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Manter o registro constante de peso e cintura é o melhor preditor de sucesso em longo prazo.
                        </p>
                        <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
