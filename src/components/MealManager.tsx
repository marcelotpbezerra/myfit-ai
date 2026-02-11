"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveMeal, deleteMeal } from "@/actions/diet";
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

export function MealManager({ initialMeals, date }: { initialMeals: any[], date: string }) {
    const router = useRouter();
    const [meals, setMeals] = useState<Meal[]>(initialMeals);
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

    // Form State
    const [mealName, setMealName] = useState("");
    const [currentItems, setCurrentItems] = useState<MealItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFoods = MOCK_FOODS.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        await saveMeal({
            ...meal,
            id: meal.id,
            isCompleted: !meal.isCompleted
        });
        router.refresh();
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
                    <p className="text-muted-foreground">{new Date(date).toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <Button onClick={openCreateDialog} className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-5 w-5" /> Adicionar
                </Button>
            </div>

            <div className="grid gap-4">
                {meals.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-3xl opacity-50">
                        <Utensils className="h-12 w-12 mb-4" />
                        <p className="font-medium">Nenhuma refeição registrada para hoje.</p>
                    </div>
                )}

                {meals.map((meal) => (
                    <Card key={meal.id} className={cn(
                        "group transition-all hover:border-primary/50 overflow-hidden",
                        meal.isCompleted && "bg-muted/30"
                    )}>
                        <div className="flex items-center p-6 gap-4">
                            <button
                                onClick={() => toggleComplete(meal)}
                                className="transition-transform hover:scale-110 active:scale-95"
                            >
                                {meal.isCompleted ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-500 fill-green-500/10" />
                                ) : (
                                    <Circle className="h-6 w-6 text-muted-foreground" />
                                )}
                            </button>

                            <div className="flex-1 cursor-pointer" onClick={() => openEditDialog(meal)}>
                                <h3 className={cn("font-bold text-lg", meal.isCompleted && "line-through text-muted-foreground")}>
                                    {meal.mealName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {meal.items.length} itens • {Math.round(meal.items.reduce((acc, i) => acc + (i.protein * 4 + i.carbs * 4 + i.fat * 9), 0))} kcal
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(meal.id!)} className="text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>
                    </Card>
                ))}
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
                                                        <p className="font-bold">{food.name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">{food.unit}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-semibold text-primary">{Math.round(food.protein * 4 + food.carbs * 4 + food.fat * 9)} kcal</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>

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
