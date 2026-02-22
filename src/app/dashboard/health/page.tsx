import { getLatestStats, getAIContext, getBiometricsHistory, getWaterHistory, getWaterGoal, getSyncHistory } from "@/actions/health";
import { BiometricsManager, HabitTracker, ProgressPhotos } from "@/components/HealthManager";
import { BioimpedanceManager } from "@/components/BioimpedanceManager";
import { AISettings } from "@/components/AISettings";
import { HealthConnectSync } from "@/components/HealthConnectSync";
import { Activity, Heart, AlertTriangle, Droplets, Scale, Microscope } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function HealthPage() {
    const latestStats = await getLatestStats();
    const initialContext = await getAIContext();
    const bioHistory = await getBiometricsHistory();
    const waterHistory = await getWaterHistory();
    const waterGoal = await getWaterGoal();
    const syncHistory = await getSyncHistory();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
                    Central de Saúde <Activity className="h-8 w-8 text-primary" />
                </h1>
                <p className="text-muted-foreground font-medium">
                    Gestão integrada de biometria, hábitos e análise de composição corporal.
                </p>
            </div>

            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-6 flex items-start gap-4 shadow-lg shadow-destructive/5">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                    <h4 className="font-black uppercase tracking-widest text-xs mb-1">Alerta de Saúde Prioritário</h4>
                    <p className="font-medium text-destructive/90 text-sm leading-relaxed">
                        Monitorar pressão arterial diariamente devido ao histórico neurocirúrgico.
                    </p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Tabs defaultValue="biometria" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-muted/20 p-1 rounded-2xl h-14 ring-1 ring-white/5">
                            <TabsTrigger value="habitos" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest gap-2">
                                <Droplets className="h-4 w-4" />
                                <span className="hidden sm:inline">Hábitos</span>
                            </TabsTrigger>
                            <TabsTrigger value="biometria" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest gap-2">
                                <Scale className="h-4 w-4" />
                                <span className="hidden sm:inline">Peso & Medidas</span>
                            </TabsTrigger>
                            <TabsTrigger value="bioimpedancia" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs uppercase tracking-widest gap-2">
                                <Microscope className="h-4 w-4" />
                                <span className="hidden sm:inline">Bioimpedância</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="habitos" className="space-y-8 outline-none mt-6">
                                <HealthConnectSync history={syncHistory} />
                                <HabitTracker waterHistory={waterHistory} waterGoal={waterGoal} />
                                <ProgressPhotos />
                            </TabsContent>

                            <TabsContent value="biometria" className="space-y-6 outline-none">
                                <div className="flex items-center gap-2 mb-4">
                                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                                    <h2 className="text-xl font-black tracking-tight">Biometria Atual</h2>
                                </div>
                                <BiometricsManager latestStats={latestStats} />
                                <ProgressPhotos />
                            </TabsContent>

                            <TabsContent value="bioimpedancia" className="space-y-6 outline-none">
                                <BioimpedanceManager history={bioHistory} />
                            </TabsContent>
                        </div>
                    </Tabs>
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
