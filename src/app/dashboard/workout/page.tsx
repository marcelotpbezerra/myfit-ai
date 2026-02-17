import { auth } from "@clerk/nextjs/server";
import { getUserSettings, getExercisesBySplit, getAllExercises } from "@/actions/workout";
import { WorkoutSplitter } from "@/components/WorkoutSplitter";
import { WorkoutExecution } from "@/components/WorkoutExecution";
import { WorkoutBuilder } from "@/components/WorkoutBuilder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dumbbell, Settings, PlusCircle, AlertCircle } from "lucide-react";

export default async function WorkoutPage() {
    const settings = await getUserSettings();
    const currentSplit = settings?.workoutSplit || "ABC";

    // Vamos buscar os exercícios para as letras da divisão
    // Simplificação: buscamos A por padrão ou deixamos o usuário escolher
    const exercisesA = await getExercisesBySplit("A");
    const exercisesB = await getExercisesBySplit("B");
    const exercisesC = await getExercisesBySplit("C");
    const exercisesD = await getExercisesBySplit("D");
    const allExercises = await getAllExercises();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
                        <Dumbbell className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent uppercase">
                            Training <span className="text-white">OS</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            Protocolo MyFit v2.0
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl bg-[#0F1115] border border-amber-500/20 shadow-2xl shadow-amber-500/5 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent opacity-50" />
                <div className="relative p-5 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                        <AlertCircle className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">
                            Atenção Biomecânica
                        </p>
                        <p className="text-xs font-bold text-amber-100/80 leading-relaxed">
                            Evite a <span className="text-amber-400">Manobra de Valsalva</span>. Expire no esforço máximo para preservar a pressão intra-abdominal (Protocolo Pós-Op).
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="training" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-16 bg-[#0F1115] rounded-3xl p-1.5 shadow-2xl ring-1 ring-white/5">
                    <TabsTrigger value="training" className="rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                        Execução
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-2xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                        Configurar
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="training" className="mt-8 space-y-8">
                    <Tabs defaultValue="A" className="w-full">
                        <div className="flex justify-center mb-6">
                            <TabsList className="bg-muted/50 p-1 rounded-2xl h-12">
                                <TabsTrigger value="A" className="px-6 rounded-xl font-black">TREINO A</TabsTrigger>
                                <TabsTrigger value="B" className="px-6 rounded-xl font-black">TREINO B</TabsTrigger>
                                {currentSplit.includes("C") && <TabsTrigger value="C" className="px-6 rounded-xl font-black">TREINO C</TabsTrigger>}
                                {currentSplit.includes("D") && <TabsTrigger value="D" className="px-6 rounded-xl font-black">TREINO D</TabsTrigger>}
                            </TabsList>
                        </div>

                        <TabsContent value="A">
                            <WorkoutExecution exercises={exercisesA} />
                        </TabsContent>
                        <TabsContent value="B">
                            <WorkoutExecution exercises={exercisesB} />
                        </TabsContent>
                        <TabsContent value="C">
                            <WorkoutExecution exercises={exercisesC} />
                        </TabsContent>
                        <TabsContent value="D">
                            <WorkoutExecution exercises={exercisesD} />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="settings" className="mt-8 space-y-8">
                    <Card className="rounded-3xl border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                Configuração de Rotina
                            </CardTitle>
                            <CardDescription>Defina sua divisão e importe sua base de exercícios.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <WorkoutSplitter currentSplit={currentSplit} />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <PlusCircle className="h-5 w-5 text-primary" />
                                Montador de Treino
                            </CardTitle>
                            <CardDescription>Busque e adicione exercícios específicos para cada dia.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <WorkoutBuilder currentExercises={allExercises} currentSplit={currentSplit} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
