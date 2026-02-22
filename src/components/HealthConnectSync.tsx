"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Moon, Footprints } from "lucide-react";
import { syncHealthData } from "@/lib/health-connect";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface HealthConnectSyncProps {
    history: any[];
}

export function HealthConnectSync({ history }: HealthConnectSyncProps) {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncHealthData();
        } finally {
            setIsSyncing(false);
        }
    };

    // Último sono e passos
    const latestSleep = history.find(h => h.type === 'sleep_hours');
    const latestSteps = history.find(h => h.type === 'steps');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-400" />
                        Atividade & Sono
                    </h3>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Dados sincronizados do Google Health Connect</p>
                </div>
                <Button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="rounded-2xl bg-green-500 hover:bg-green-600 font-black tracking-widest text-xs h-12 px-6 shadow-lg shadow-green-500/20"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    SINCRONIZAR AGORA
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card className="border-none bg-indigo-500/5 backdrop-blur-xl ring-1 ring-indigo-500/10">
                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                            <Moon className="h-5 w-5" />
                        </div>
                        <div className="text-2xl font-black text-white">
                            {latestSleep ? `${latestSleep.value}h` : '--'}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Último Sono</div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-emerald-500/5 backdrop-blur-xl ring-1 ring-emerald-500/10">
                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                            <Footprints className="h-5 w-5" />
                        </div>
                        <div className="text-2xl font-black text-white">
                            {latestSteps ? Number(latestSteps.value).toLocaleString() : '--'}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Passos Ontem</div>
                    </CardContent>
                </Card>
            </div>

            {history.length === 0 && (
                <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-dashed border-indigo-500/20 flex flex-col items-center text-center">
                    <p className="text-sm text-muted-foreground font-medium max-w-[200px]">
                        Conecte seu Health Connect para monitorar seu sono e atividade automaticamente.
                    </p>
                </div>
            )}
        </div>
    );
}
