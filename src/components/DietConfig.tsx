"use client";

import { useState, useTransition } from "react";
import { addDietMeal, updateDietMeal, deleteDietMeal } from "@/actions/diet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Edit2, Plus, Clock, Zap, Target, Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { searchFoodNutrition } from "@/lib/nutrition-api";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DietPlanItem {
    id: number;
    mealName: string;
    scheduledTime: string | null;
    targetProtein: number | null;
    targetCarbs: number | null;
    targetFat: number | null;
    targetCalories: number | null;
    suggestions: string | null;
    items: any[] | null;
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
        items: [] as any[],
        suggestions: "",
        order: 0
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    function resetForm() {
        setFormData({
            mealName: "",
            scheduledTime: "",
            items: [],
            suggestions: "",
            order: currentPlan.length
        });
        setSearchQuery("");
        setSearchResults([]);
        setEditingMeal(null);
        setIsAddMode(false);
    }

    function handleEdit(meal: DietPlanItem) {
        setEditingMeal(meal);
        setFormData({
            mealName: meal.mealName,
            scheduledTime: meal.scheduledTime || "",
            items: Array.isArray(meal.items) ? meal.items : [],
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
                        <div className="grid gap-6 py-4 px-1 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nome da Refeição</Label>
                                    <Input
                                        placeholder="Ex: Almoço"
                                        value={formData.mealName}
                                        onChange={e => setFormData({ ...formData, mealName: e.target.value })}
                                        className="rounded-2xl bg-muted/50 border-none h-12 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Horário Previsto</Label>
                                    <Input
                                        type="time"
                                        value={formData.scheduledTime}
                                        onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                                        className="rounded-2xl bg-muted/50 border-none h-12 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Composição da Refeição (Catálogo)</Label>

                                <div className="relative">
                                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar alimento no banco..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSearchQuery(val);
                                            if (val.length > 2) {
                                                setIsSearching(true);
                                                searchFoodNutrition(val).then(res => {
                                                    setSearchResults(res);
                                                    setIsSearching(false);
                                                });
                                            } else {
                                                setSearchResults([]);
                                            }
                                        }}
                                        className="pl-10 h-11 rounded-xl bg-muted/50 border-none focus-visible:ring-primary shadow-inner"
                                    />
                                    {isSearching && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-primary" />}

                                    {searchResults.length > 0 && (
                                        <div className="absolute top-12 left-0 right-0 z-50 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <ScrollArea className="h-64">
                                                {searchResults.map((food, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            const newItem = {
                                                                food: food.name,
                                                                protein: food.protein,
                                                                carbs: food.carbs,
                                                                fat: food.fat,
                                                                qty: 100
                                                            };
                                                            setFormData(f => ({ ...f, items: [...f.items, newItem] }));
                                                            setSearchQuery("");
                                                            setSearchResults([]);
                                                        }}
                                                        className="w-full text-left p-4 hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 flex justify-between items-center"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-sm">{food.name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase">{food.unit}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-primary">{food.calories} kcal</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </ScrollArea>
                                        </div>
                                    )}
                                </div>

                                <ScrollArea className="h-48 rounded-2xl bg-muted/30 p-2 border border-white/5">
                                    <div className="space-y-2">
                                        {(() => {
                                            const items = Array.isArray(formData.items) ? formData.items : [];
                                            return items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-white/5 shadow-sm">
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold truncate leading-none mb-1">{item.food}</p>
                                                        <div className="flex gap-2 text-[8px] text-muted-foreground uppercase font-black">
                                                            <span className="text-red-500">P: {Number(item.protein || 0).toFixed(1)}g</span>
                                                            <span className="text-blue-500">C: {Number(item.carbs || 0).toFixed(1)}g</span>
                                                            <span className="text-yellow-500">F: {Number(item.fat || 0).toFixed(1)}g</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            value={item.qty}
                                                            onChange={(e) => {
                                                                const newQty = Number(e.target.value);
                                                                const factor = newQty / (item.qty || 100);
                                                                const nextItems = [...items];
                                                                nextItems[idx] = {
                                                                    ...item,
                                                                    qty: newQty,
                                                                    protein: Number((Number(item.protein || 0) * factor).toFixed(1)),
                                                                    carbs: Number((Number(item.carbs || 0) * factor).toFixed(1)),
                                                                    fat: Number((Number(item.fat || 0) * factor).toFixed(1))
                                                                };
                                                                setFormData({ ...formData, items: nextItems });
                                                            }}
                                                            className="w-16 h-8 text-xs text-center border-none bg-muted/50 rounded-lg px-1"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setFormData({ ...formData, items: items.filter((_, i) => i !== idx) })}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                        {(Array.isArray(formData.items) ? formData.items : []).length === 0 && (
                                            <div className="h-full flex items-center justify-center py-10 text-muted-foreground text-xs italic">
                                                Nenhum alimento no plano
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Macros Totais</p>
                                    <p className="text-xl font-black text-primary">
                                        {Math.round((Array.isArray(formData.items) ? formData.items : []).reduce((a, b) => a + (Number(b.protein || 0) * 4 + Number(b.carbs || 0) * 4 + Number(b.fat || 0) * 9), 0))} <span className="text-xs font-normal">kcal</span>
                                    </p>
                                </div>
                                <div className="flex gap-4 text-center">
                                    <div>
                                        <p className="text-[9px] font-bold text-red-500">P</p>
                                        <p className="text-xs font-black">{Math.round((Array.isArray(formData.items) ? formData.items : []).reduce((a, b) => a + Number(b.protein || 0), 0))}g</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-blue-500">C</p>
                                        <p className="text-xs font-black">{Math.round((Array.isArray(formData.items) ? formData.items : []).reduce((a, b) => a + Number(b.carbs || 0), 0))}g</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-yellow-500">F</p>
                                        <p className="text-xs font-black">{Math.round((Array.isArray(formData.items) ? formData.items : []).reduce((a, b) => a + Number(b.fat || 0), 0))}g</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="px-1 pb-1">
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending || formData.items.length === 0 || !formData.mealName}
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
                                            {(Array.isArray(meal.items) ? meal.items : []).map((it: any) => `${it.qty || 100}g ${it.food || "Alimento"}`).join(" + ") || "Sem alimentos cadastrados"}
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
