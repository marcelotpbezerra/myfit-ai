"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Droplets } from "lucide-react";

interface WaterHistoryChartProps {
    data: {
        date: string;
        total: number;
    }[];
    goal: number;
}

export function WaterHistoryChart({ data, goal }: WaterHistoryChartProps) {
    // Formatar datas para exibição curta (D/M)
    const chartData = data.map(item => {
        const d = new Date(item.date + "T12:00:00");
        return {
            ...item,
            displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
            isGoalMet: item.total >= goal
        };
    });

    return (
        <Card className="border-none bg-blue-500/5 backdrop-blur-xl ring-1 ring-blue-500/10 overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-400" />
                    Histórico de Hidratação
                </CardTitle>
                <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase">
                    Últimos 7 dias (Meta: {(goal / 1000).toFixed(1)}L)
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis
                                dataKey="displayDate"
                                fontSize={10}
                                fontWeight="bold"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'currentColor', opacity: 0.5 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-background/90 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-2xl">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{payload[0].payload.date}</p>
                                                <p className="text-sm font-bold text-blue-400">{(Number(payload[0].value) / 1000).toFixed(2)}L</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.isGoalMet ? '#3b82f6' : '#3b82f640'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
