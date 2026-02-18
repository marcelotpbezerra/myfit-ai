"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveMeal, deleteMeal, toggleMealCompletion } from "@/actions/diet";
import {
    Plus,
    Trash2,
    Utensils,
    ChevronRight,
    Search,
    CheckCircle2,
    Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Mock Database de Alimentos
const MOCK_FOODS = [
    { name: "Frango Grelhado", protein: 31, carbs: 0, fat: 3.6, unit: "100g" },
    { name: "Arroz Branco", protein: 2.7, carbs: 28, fat: 0.3, unit: "100g" },
    { name: "Ovo Cozido", protein: 6, carbs: 0.6, fat: 5, unit: "unidade" },
    { name: "Feijão Carioca", protein: 4.8, carbs: 13.6, fat: 0.5, unit: "100g" },
    { name: "Batata Doce", protein: 1.6, carbs: 20, fat: 0.1, unit: "100g" },
    { name: "Azeite de Oliva", protein: 0, carbs: 0, fat: 14, unit: "colher sopa" },
    { name: "Whey Protein", protein: 24, carbs: 2, fat: 1.5, unit: "scoop" },
];

interface MealItem {
    food: string;
    protein: number;
    carbs: number;
    fat: number;
    qty: number;
}

interface Meal {
    id?: number;
    mealName: string;
    items: MealItem[];
    isCompleted: boolean;
    date: string;
}

interface Substitution {
    item: string;
    canReplace: string;
    protein: number;
    carbs: number;
    fat?: number;
}

interface DietPlanItem {
    id: number;
    userId: string;
    mealName: string;
    scheduledTime: string | null;
    targetProtein: number | null;
    targetCarbs: number | null;
    targetFat: number | null;
    targetCalories: number | null;
    suggestions: string | null;
    substitutions: Substitution[] | null;
    order: number | null;
}

export function MealManager({ initialMeals, date, dietPlan = [] }: { initialMeals: any[], date: string, dietPlan?: DietPlanItem[] }) {
    const router = useRouter();
    const [meals, setMeals] = useState<Meal[]>(initialMeals);
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
    const [isDietPlanLoaded, setIsDietPlanLoaded] = useState(false);

    // Sincronizar estado local com props do servidor
    useEffect(() => {
        setMeals(initialMeals);
    }, [initialMeals]);

    // Form State
    const [mealName, setMealName] = useState("");
    const [currentItems, setCurrentItems] = useState<MealItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCustomFoodOpen, setIsCustomFoodOpen] = useState(false);
    const [customFood, setCustomFood] = useState({ name: "", protein: 0, carbs: 0, fat: 0, qty: 100 });

    const filteredFoods = MOCK_FOODS.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    function addCustomFood() {
        if (!customFood.name) return;
        setCurrentItems([...currentItems, {
            food: customFood.name,
            protein: Number(customFood.protein),
            carbs: Number(customFood.carbs),
            fat: Number(customFood.fat),
            qty: Number(customFood.qty)
        }]);
        setCustomFood({ name: "", protein: 0, carbs: 0, fat: 0, qty: 100 });
        setIsCustomFoodOpen(false);
    }

    async function applySubstitution(plan: DietPlanItem, sub: Substitution) {
        const existingMeal = meals.find(m => m.mealName === plan.mealName);
        const newItem: MealItem = {
            food: sub.item,
            protein: sub.protein,
            carbs: sub.carbs,
            fat: sub.fat || 0,
            qty: 100
        };

        startTransition(async () => {
            if (existingMeal) {
                await saveMeal({
                    id: existingMeal.id,
                    date: existingMeal.date,
                    mealName: existingMeal.mealName,
                    items: [...existingMeal.items, newItem],
                    isCompleted: existingMeal.isCompleted
                });
            } else {
                await saveMeal({
                    date,
                    mealName: plan.mealName,
                    items: [newItem],
                    isCompleted: false
                });
            }
            router.refresh();
        });
    }

    function openCreateDialog() {
        setEditingMeal(null);
        setMealName("");
        setCurrentItems([]);
        setIsDialogOpen(true);
    }

    function openEditDialog(meal: Meal) {
        setEditingMeal(meal);
        setMealName(meal.mealName);
        setCurrentItems(meal.items);
        setIsDialogOpen(true);
    }

    function addItem(food: typeof MOCK_FOODS[0]) {
        setCurrentItems([...currentItems, {
            food: food.name,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            qty: 100
        }]);
        setSearchQuery("");
    }

    function removeItem(index: number) {
        setCurrentItems(currentItems.filter((_, i) => i !== index));
    }

    function updateItemQty(index: number, newQty: number) {
        const nextItems = [...currentItems];
        const factor = newQty / nextItems[index].qty;
        nextItems[index] = {
            ...nextItems[index],
            protein: Number((nextItems[index].protein * factor).toFixed(1)),
            carbs: Number((nextItems[index].carbs * factor).toFixed(1)),
            fat: Number((nextItems[index].fat * factor).toFixed(1)),
            qty: newQty
        };
        setCurrentItems(nextItems);
    }

    async function handleSave() {
        startTransition(async () => {
            const result = await saveMeal({
                id: editingMeal?.id,
                date,
                mealName,
                items: currentItems,
                isCompleted: editingMeal?.isCompleted || false
            });
            if (result.success) {
                // Refresh local UI (Simples refetch seria ideal, mas vamos atualizar na mão para speed)
                setIsDialogOpen(false);
                router.refresh(); // Quick sync
            }
        });
    }

    async function handleDelete(id: number) {
        if (confirm("Deseja excluir esta refeição?")) {
            await deleteMeal(id);
            router.refresh();
        }
    }

    async function toggleComplete(meal: Meal) {
        if (!meal.id) return;

        // Update otimista local
        const nextState = !meal.isCompleted;
        setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, isCompleted: nextState } : m));

        startTransition(async () => {
            const result = await toggleMealCompletion(meal.id!, nextState);
            if (!result.success) {
                // Reverter em caso de erro
                setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, isCompleted: !nextState } : m));
            }
            router.refresh();
        });
    }

    async function handleQuickAdd(plan: DietPlanItem) {
        // Mock items a partir das sugestões para o usuário não começar do zero
        // Padrão: Sugestão costuma ser "Alimento (qtd) + outro (qtd)"
        const suggestionItems: MealItem[] = [];
        if (plan.suggestions) {
            // Tentar extrair o primeiro item se for simples
            const parts = plan.suggestions.split('+').map(p => p.trim());
            parts.forEach(p => {
                suggestionItems.push({
                    food: p,
                    protein: Math.round((plan.targetProtein || 0) / parts.length),
                    carbs: Math.round((plan.targetCarbs || 0) / parts.length),
                    fat: Math.round((plan.targetFat || 0) / parts.length),
                    qty: 100
                });
            });
        }

        startTransition(async () => {
            const result = await saveMeal({
                date,
                mealName: plan.mealName,
                items: suggestionItems,
                isCompleted: false,
                notes: `Plano: ${plan.suggestions}`
            });

            if (result.success) {
                router.refresh();
            }
        });
    }

    const totals = currentItems.reduce((acc, item) => ({
        p: acc.p + item.protein,
        c: acc.c + item.carbs,
        f: acc.f + item.fat,
        cal: acc.cal + (item.protein * 4 + item.carbs * 4 + item.fat * 9)
    }), { p: 0, c: 0, f: 0, cal: 0 });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Refeições de Hoje</h2>
                    <p className="text-muted-foreground capitalize">
                        {new Date(date + 'T12:00:00').toLocaleDateString("pt-BR", {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })}
                    </p>
                </div>
                <Button onClick={openCreateDialog} className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-5 w-5" /> Adicionar
                </Button>
            </div>

            <div className="grid gap-4">
                {dietPlan.map((plan) => {
                    const existingMeal = meals.find(m => m.mealName === plan.mealName);

                    return (
                        <Card key={plan.id} className={cn(
                            "group transition-all overflow-hidden border-dashed bg-transparent",
                            existingMeal?.isCompleted ? "opacity-40" : "hover:border-primary/50"
                        )}>
                            <div className="flex items-center p-6 gap-4">
                                {existingMeal ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={() => toggleComplete(existingMeal)}
                                            className="transition-transform hover:scale-110 active:scale-95 flex flex-col items-center"
                                        >
                                            {existingMeal.isCompleted ? (
                                                <CheckCircle2 className="h-8 w-8 text-green-500 fill-green-500/10" />
                                            ) : (
                                                <Circle className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </button>
                                        <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">
                                            {existingMeal.isCompleted ? "Feito" : "Confirmar"}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={() => handleQuickAdd(plan)}
                                            className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-90 shadow-lg shadow-primary/5 group"
                                        >
                                            <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                                        </button>
                                        <span className="text-[8px] font-black uppercase text-primary/60 tracking-tighter">Registrar</span>
                                    </div>
                                )}

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-primary/60 tracking-widest">
                                            {plan.scheduledTime}
                                        </span>
                                        <h3 className={cn("font-bold text-lg", existingMeal?.isCompleted && "line-through text-muted-foreground")}>
                                            {plan.mealName}
                                        </h3>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium italic mt-1 leading-tight bg-white/5 p-1 px-2 rounded-lg border border-white/5">
                                        💡 {plan.suggestions}
                                    </p>
                                    <div className="flex gap-3 mt-2 text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-red-500">P: {plan.targetProtein}g</span>
                                        <span className="text-blue-500">C: {plan.targetCarbs}g</span>
                                        <span className="text-yellow-500">F: {plan.targetFat}g</span>
                                        <span className="text-muted-foreground">{plan.targetCalories} kcal</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {plan.substitutions && plan.substitutions.length > 0 && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg">
                                                    Substituições
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-md rounded-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>{plan.mealName} - Opções</DialogTitle>
                                                </DialogHeader>
                                                <ScrollArea className="max-h-96">
                                                    <div className="space-y-4 p-4">
                                                        {plan.substitutions.map((sub, idx) => (
                                                            <div key={idx} className="p-4 rounded-xl bg-card border flex flex-col gap-2">
                                                                <div>
                                                                    <p className="font-bold text-sm mb-1">{sub.item}</p>
                                                                    <p className="text-xs text-muted-foreground mb-2">Pode substituir por: <span className="text-primary font-semibold">{sub.canReplace}</span></p>
                                                                    <div className="flex gap-3 text-[10px] font-black uppercase">
                                                                        <span className="text-red-500">P: {sub.protein}g</span>
                                                                        <span className="text-blue-500">C: {sub.carbs}g</span>
                                                                        {sub.fat !== undefined && <span className="text-yellow-500">F: {sub.fat}g</span>}
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    className="w-full h-8 text-[10px] font-black uppercase rounded-lg shadow-md shadow-primary/10"
                                                                    onClick={() => applySubstitution(plan, sub)}
                                                                >
                                                                    Aplicar esta sugestão
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                    {existingMeal && (
                                        <>
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(existingMeal)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                <Search className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(existingMeal.id!)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl sm:rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-card border-b">
                        <DialogTitle className="text-xl font-bold">
                            {editingMeal ? "Editar Refeição" : "Nova Refeição"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-6 bg-background/50 backdrop-blur-sm">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nome da Refeição</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Almoço"
                                value={mealName}
                                onChange={(e) => setMealName(e.target.value)}
                                className="h-12 rounded-xl bg-card border-none shadow-sm focus-visible:ring-primary"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Alimentos</Label>

                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar alimento..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 rounded-xl bg-card border-none focus-visible:ring-primary"
                                />

                                {searchQuery && (
                                    <div className="absolute top-12 left-0 right-0 z-50 bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <ScrollArea className="h-64">
                                            {filteredFoods.map(food => (
                                                <button
                                                    key={food.name}
                                                    onClick={() => addItem(food)}
                                                    className="w-full text-left p-4 hover:bg-primary/5 transition-colors border-b last:border-0 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <p className="font-bold text-sm">{food.name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{food.unit}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-primary">
                                                            {Math.round(food.protein * 4 + food.carbs * 4 + food.fat * 9)} <span className="font-normal text-[10px] text-muted-foreground">kcal</span>
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredFoods.length === 0 && (
                                                <div className="p-8 text-center">
                                                    <p className="text-xs text-muted-foreground italic mb-4">Nenhum alimento encontrado</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setIsCustomFoodOpen(true)}
                                                        className="rounded-xl"
                                                    >
                                                        <Plus className="h-3 w-3 mr-2" /> Criar Alimento
                                                    </Button>
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>

                            {isCustomFoodOpen && (
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Novo Alimento</p>
                                        <Button variant="ghost" size="sm" onClick={() => setIsCustomFoodOpen(false)} className="h-6 text-[10px] uppercase font-bold">Cancelar</Button>
                                    </div>
                                    <Input
                                        placeholder="Nome do alimento..."
                                        value={customFood.name}
                                        onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                                        className="h-10 rounded-xl bg-background border-none shadow-inner text-sm"
                                    />
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Proteína</Label>
                                            <Input
                                                type="number"
                                                value={customFood.protein}
                                                onChange={(e) => setCustomFood({ ...customFood, protein: Number(e.target.value) })}
                                                className="h-10 rounded-xl bg-background border-none shadow-inner text-center"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Carbs</Label>
                                            <Input
                                                type="number"
                                                value={customFood.carbs}
                                                onChange={(e) => setCustomFood({ ...customFood, carbs: Number(e.target.value) })}
                                                className="h-10 rounded-xl bg-background border-none shadow-inner text-center"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Gordura</Label>
                                            <Input
                                                type="number"
                                                value={customFood.fat}
                                                onChange={(e) => setCustomFood({ ...customFood, fat: Number(e.target.value) })}
                                                className="h-10 rounded-xl bg-background border-none shadow-inner text-center"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold uppercase text-muted-foreground ml-1">Qtd (g)</Label>
                                            <Input
                                                type="number"
                                                value={customFood.qty}
                                                onChange={(e) => setCustomFood({ ...customFood, qty: Number(e.target.value) })}
                                                className="h-10 rounded-xl bg-background border-none shadow-inner text-center"
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={addCustomFood} className="w-full h-10 rounded-xl font-bold shadow-lg shadow-primary/10">
                                        Adicionar à Refeição
                                    </Button>
                                </div>
                            )}

                            <ScrollArea className="h-48 rounded-2xl bg-card/50 p-2">
                                <div className="space-y-2">
                                    {currentItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-white/5 shadow-sm">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold truncate leading-none mb-1">{item.food}</p>
                                                <div className="flex gap-2 text-[10px] text-muted-foreground uppercase font-black">
                                                    <span className="text-red-500">P: {item.protein}g</span>
                                                    <span className="text-blue-500">C: {item.carbs}g</span>
                                                    <span className="text-yellow-500">F: {item.fat}g</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => updateItemQty(idx, Number(e.target.value))}
                                                    className="w-16 h-8 text-xs text-center border-none bg-muted/50 rounded-lg px-1"
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {currentItems.length === 0 && (
                                        <div className="h-full flex items-center justify-center py-10 text-muted-foreground text-xs italic">
                                            Nenhum alimento adicionado
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total da Refeição</p>
                                <p className="text-2xl font-black text-primary">{Math.round(totals.cal)} <span className="text-sm font-normal text-muted-foreground">kcal</span></p>
                            </div>
                            <div className="flex gap-4 text-center">
                                <div>
                                    <p className="text-[10px] font-bold text-red-500">P</p>
                                    <p className="text-sm font-black">{Math.round(totals.p)}g</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-500">C</p>
                                    <p className="text-sm font-black">{Math.round(totals.c)}g</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-yellow-500">F</p>
                                    <p className="text-sm font-black">{Math.round(totals.f)}g</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-card border-t">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancelar</Button>
                        <Button onClick={handleSave} disabled={isPending || !mealName || currentItems.length === 0} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                            {isPending ? "Salvando..." : "Salvar Refeição"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
