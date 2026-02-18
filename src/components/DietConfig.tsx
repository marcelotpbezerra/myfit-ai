"use client";

import { useState, useTransition } from "react";
import { addDietMeal, updateDietMeal, deleteDietMeal } from "@/actions/diet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Clock, Zap, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface DietPlanItem {
    id: number;
    mealName: string;
    scheduledTime: string | null;
    targetProtein: number | null;
    targetCarbs: number | null;
    targetFat: number | null;
    targetCalories: number | null;
    suggestions: string | null;
    order: number | null;
}

export function DietConfig({ currentPlan }: { currentPlan: DietPlanItem[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [editingMeal, setEditingMeal] = useState<DietPlanItem | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        mealName: "",
        scheduledTime: "",
        targetProtein: 0,
        targetCarbs: 0,
        targetFat: 0,
        suggestions: "",
        order: 0
    });

    function resetForm() {
        setFormData({
            mealName: "",
            scheduledTime: "",
            targetProtein: 0,
            targetCarbs: 0,
            targetFat: 0,
            suggestions: "",
            order: currentPlan.length
        });
        setEditingMeal(null);
        setIsAddMode(false);
    }

    function handleEdit(meal: DietPlanItem) {
        setEditingMeal(meal);
        setFormData({
            mealName: meal.mealName,
            scheduledTime: meal.scheduledTime || "",
            targetProtein: meal.targetProtein || 0,
            targetCarbs: meal.targetCarbs || 0,
            targetFat: meal.targetFat || 0,
            suggestions: meal.suggestions || "",
            order: meal.order || 0
        });
        setIsAddMode(true);
    }

    async function handleSubmit() {
        startTransition(async () => {
            let result;
            if (editingMeal) {
                result = await updateDietMeal(editingMeal.id, formData);
            } else {
                result = await addDietMeal(formData);
            }

            if (result.success) {
                resetForm();
                router.refresh();
            }
        });
    }

    async function handleDelete(id: number) {
        if (!confirm("Tem certeza que deseja excluir esta refeição do protocolo?")) return;

        startTransition(async () => {
            const result = await deleteDietMeal(id);
            if (result.success) {
                router.refresh();
            }
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Protocolo Diário
                </h3>
                <Dialog open={isAddMode} onOpenChange={(open) => !open && resetForm()}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsAddMode(true)} className="rounded-2xl gap-2 font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" />
                            Nova Refeição
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-lg text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                                {editingMeal ? "Editar Refeição" : "Nova Refeição no Plano"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nome</Label>
                                    <Input
                                        placeholder="Ex: Almoço"
                                        value={formData.mealName}
                                        onChange={e => setFormData({ ...formData, mealName: e.target.value })}
                                        className="rounded-2xl bg-muted/50 border-none h-12 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Horário</Label>
                                    <Input
                                        type="time"
                                        value={formData.scheduledTime}
                                        onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                                        className="rounded-2xl bg-muted/50 border-none h-12 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-red-500 ml-1">Proteína (g)</Label>
                                    <Input
                                        type="number"
                                        value={formData.targetProtein}
                                        onChange={e => setFormData({ ...formData, targetProtein: Number(e.target.value) })}
                                        className="rounded-2xl bg-red-500/10 border-none h-12 font-bold text-red-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-blue-500 ml-1">Carbo (g)</Label>
                                    <Input
                                        type="number"
                                        value={formData.targetCarbs}
                                        onChange={e => setFormData({ ...formData, targetCarbs: Number(e.target.value) })}
                                        className="rounded-2xl bg-blue-500/10 border-none h-12 font-bold text-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-yellow-500 ml-1">Gordura (g)</Label>
                                    <Input
                                        type="number"
                                        value={formData.targetFat}
                                        onChange={e => setFormData({ ...formData, targetFat: Number(e.target.value) })}
                                        className="rounded-2xl bg-yellow-500/10 border-none h-12 font-bold text-yellow-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sugestões (Conteúdo do Plano)</Label>
                                <Input
                                    placeholder="Ex: 200g Frango + 150g Arroz"
                                    value={formData.suggestions}
                                    onChange={e => setFormData({ ...formData, suggestions: e.target.value })}
                                    className="rounded-2xl bg-muted/50 border-none h-12 font-bold"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending}
                                className="w-full rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl"
                            >
                                {isPending ? "Salvando..." : editingMeal ? "Atualizar Plano" : "Salvar no Plano"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {currentPlan.length === 0 && (
                    <div className="text-center py-20 bg-card/20 rounded-[2.5rem] border border-dashed border-white/10">
                        <p className="text-muted-foreground font-medium">Nenhuma refeição configurada.</p>
                        <p className="text-[10px] text-muted-foreground/50 uppercase mt-2">Clique em + Nova Refeição para começar</p>
                    </div>
                )}
                {currentPlan.map((meal) => (
                    <Card key={meal.id} className="rounded-[2rem] border-none bg-card/30 backdrop-blur-xl ring-1 ring-white/5 overflow-hidden group hover:ring-primary/20 transition-all duration-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20 shrink-0">
                                        <Clock className="h-4 w-4 mb-0.5" />
                                        <span className="text-[10px] font-black">{meal.scheduledTime || "--:--"}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-lg tracking-tight">{meal.mealName}</h4>
                                            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                            <span className="text-[10px] font-black uppercase text-primary/60 tracking-wider">
                                                {meal.targetCalories} kcal
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium line-clamp-1 italic">
                                            {meal.suggestions || "Sem sugestões cadastradas"}
                                        </p>

                                        <div className="flex gap-4 mt-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                <span className="text-[10px] font-black opacity-60">P: {meal.targetProtein}G</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span className="text-[10px] font-black opacity-60">C: {meal.targetCarbs}G</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                                                <span className="text-[10px] font-black opacity-60">G: {meal.targetFat}G</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleEdit(meal)}>
                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-500/10 group/del" onClick={() => handleDelete(meal.id)}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground group-hover/del:text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
