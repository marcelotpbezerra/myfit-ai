"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Text } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MacroChartProps {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    goal?: number;
}

export function MacroChart({ protein, carbs, fat, calories, goal = 2000 }: MacroChartProps) {
    const data = [
        { name: "Proteína", value: protein * 4, color: "#ef4444" },
        { name: "Carbo", value: carbs * 4, color: "#3b82f6" },
        { name: "Gordura", value: fat * 9, color: "#eab308" },
        { name: "Restante", value: Math.max(0, goal - calories), color: "#27272a" },
    ];

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Balanço Calórico</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center">
                    <div className="relative h-[200px] w-full max-w-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-bold">{Math.round(calories)}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">kcal</span>
                            <div className="mt-1 h-[1px] w-8 bg-muted" />
                            <span className="text-[10px] text-muted-foreground">{goal}</span>
                        </div>
                    </div>

                    <div className="mt-4 grid w-full grid-cols-3 gap-2">
                        <div className="flex flex-col items-center border-r border-muted last:border-0">
                            <span className="text-xs font-semibold text-red-500">{Math.round(protein)}g</span>
                            <span className="text-[10px] text-muted-foreground uppercase leading-none mt-1">Prot</span>
                        </div>
                        <div className="flex flex-col items-center border-r border-muted last:border-0">
                            <span className="text-xs font-semibold text-blue-500">{Math.round(carbs)}g</span>
                            <span className="text-[10px] text-muted-foreground uppercase leading-none mt-1">Carb</span>
                        </div>
                        <div className="flex flex-col items-center border-r border-muted last:border-0">
                            <span className="text-xs font-semibold text-yellow-500">{Math.round(fat)}g</span>
                            <span className="text-[10px] text-muted-foreground uppercase leading-none mt-1">Fat</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
