"use client";

import { useState, useTransition } from "react";
import { Activity, Pencil, Save, X } from "lucide-react";
import { addHealthStat } from "@/actions/health";
import { cn } from "@/lib/utils";

interface WeightCardProps {
    initialWeight: string;
}

export function WeightCard({ initialWeight }: WeightCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [weight, setWeight] = useState(initialWeight);
    const [isPending, startTransition] = useTransition();

    async function handleSave() {
        startTransition(async () => {
            await addHealthStat("weight", weight);
            setIsEditing(false);
        });
    }

    return (
        <div className="rounded-3xl border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Peso Atual</p>
                        {isEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="number"
                                    step="0.1"
                                    className="w-20 bg-white/10 rounded-lg px-2 py-1 text-lg font-black outline-none text-white appearance-none"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handleSave} disabled={isPending} className="text-primary hover:scale-110 transition-transform disabled:opacity-50">
                                    <Save className="h-5 w-5" />
                                </button>
                                <button onClick={() => { setWeight(initialWeight); setIsEditing(false); }} className="text-red-500 hover:scale-110 transition-transform">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-lg font-black group flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                {weight} kg
                                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                <Activity className="h-3 w-3" /> Peso fidedigno à biometria Neon
            </span>
        </div>
    );
}
