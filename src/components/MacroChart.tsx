"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MacroChartProps {
    // realizado hoje
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    // metas do protocolo
    goal?: number;          // kcal total
    goalProtein?: number;
    goalCarbs?: number;
    goalFat?: number;
}

function MacroBar({
    label,
    value,
    goal,
    color,
}: {
    label: string;
    value: number;
    goal: number;
    color: string;
}) {
    const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
    const over = goal > 0 && value > goal;

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
                <span className="font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                <span className={`font-black ${over ? "text-red-400" : "text-foreground"}`}>
                    {Math.round(value)}
                    <span className="text-muted-foreground font-medium"> / {Math.round(goal)}g</span>
                </span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color, opacity: over ? 0.5 : 1 }}
                />
                {over && (
                    <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: "100%", backgroundColor: "#ef4444", opacity: 0.4 }}
                    />
                )}
            </div>
        </div>
    );
}

export function MacroChart({
    protein,
    carbs,
    fat,
    calories,
    goal = 2000,
    goalProtein = 0,
    goalCarbs = 0,
    goalFat = 0,
}: MacroChartProps) {

    // Calorias calculadas a partir dos macros reais (fonte de verdade)
    const realCalories = Math.round(protein * 4 + carbs * 4 + fat * 9);
    const efectiveCal = calories > 0 ? Math.round(calories) : realCalories;

    const remaining = Math.max(0, goal - efectiveCal);
    const over = efectiveCal > goal;
    const pctCal = goal > 0 ? Math.min(100, Math.round((efectiveCal / goal) * 100)) : 0;

    const data = [
        { name: "Proteína", value: Math.round(protein * 4), color: "#ef4444" },
        { name: "Carbo", value: Math.round(carbs * 4), color: "#3b82f6" },
        { name: "Gordura", value: Math.round(fat * 9), color: "#eab308" },
        { name: "Restante", value: remaining, color: "#27272a" },
    ];

    return (
        <div className="rounded-3xl bg-card/30 backdrop-blur-xl ring-1 ring-white/5 p-5 space-y-5">
            {/* Title */}
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Balanço Calórico
                </p>
                <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${over
                            ? "bg-red-500/20 text-red-400"
                            : pctCal >= 90
                                ? "bg-primary/20 text-primary"
                                : "bg-muted/30 text-muted-foreground"
                        }`}
                >
                    {pctCal}% da meta
                </span>
            </div>

            {/* Donut + centro */}
            <div className="flex items-center gap-5">
                <div className="relative h-[110px] w-[110px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={36}
                                outerRadius={52}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className={`text-xl font-extrabold leading-none ${over ? "text-red-400" : "text-foreground"}`}>
                            {efectiveCal}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase leading-none mt-0.5">kcal</span>
                        <div className="mt-0.5 h-[1px] w-6 bg-muted/50" />
                        <span className="text-[9px] text-muted-foreground leading-none mt-0.5">{goal}</span>
                    </div>
                </div>

                {/* Barras de comparativo por macro */}
                <div className="flex-1 space-y-3">
                    {goalProtein > 0 && (
                        <MacroBar label="Prot" value={protein} goal={goalProtein} color="#ef4444" />
                    )}
                    {goalCarbs > 0 && (
                        <MacroBar label="Carb" value={carbs} goal={goalCarbs} color="#3b82f6" />
                    )}
                    {goalFat > 0 && (
                        <MacroBar label="Gord" value={fat} goal={goalFat} color="#eab308" />
                    )}

                    {/* Fallback: macros sem metas configuradas */}
                    {(!goalProtein && !goalCarbs && !goalFat) && (
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { v: Math.round(protein), l: "Prot", c: "text-red-400" },
                                { v: Math.round(carbs), l: "Carb", c: "text-blue-400" },
                                { v: Math.round(fat), l: "Gord", c: "text-yellow-400" },
                            ].map(({ v, l, c }) => (
                                <div key={l} className="flex flex-col items-center">
                                    <span className={`text-xs font-black ${c}`}>{v}g</span>
                                    <span className="text-[9px] text-muted-foreground uppercase leading-none mt-0.5">{l}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Barra de progresso calórico */}
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Consumido</span>
                    <span>{over ? `+${efectiveCal - goal} kcal acima` : `${remaining} kcal restando`}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${over ? "bg-red-500" : "bg-primary"}`}
                        style={{ width: `${pctCal}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
