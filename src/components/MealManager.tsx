"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveMeal, deleteMeal, toggleMealCompletion, clearMealLog } from "@/actions/diet";
import {
    Plus,
    Trash2,
    Utensils,
    ChevronRight,
    Search,
    CheckCircle2,
    Circle,
    Loader2,
    RotateCcw,
    AlertCircle,
    BellRing,
    Check
} from "lucide-react";
import { searchFoodNutrition } from "@/lib/nutrition-api";
import { Button } from "@/components/ui/button";
import { CustomFoodDialog } from "@/components/CustomFoodDialog";
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

// Retirado MOCK_FOODS para usar API real

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
    qty?: number; // quantidade configurada no protocolo
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
    items: any[] | null;
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

    const [isSimulating, setIsSimulating] = useState(false);
    const [isPersistentCustomFoodOpen, setIsPersistentCustomFoodOpen] = useState(false);
    const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});

    const [isSubstituting, setIsSubstituting] = useState<{ mealId: number | string, itemIndex: number } | null>(null);
    const [isSubstituteSearchOpen, setIsSubstituteSearchOpen] = useState(false);
    // Estado para a substituição em 2 fases: primeiro selecionar alimento, depois informar qty
    const [substituteFood, setSubstituteFood] = useState<any | null>(null);
    const [substituteQty, setSubstituteQty] = useState<number>(100);
    const [substitutePlan, setSubstitutePlan] = useState<DietPlanItem | null>(null);

    const searchParams = useSearchParams();

    // Sincronizar estado local com props do servidor
    useEffect(() => {
        setMeals(initialMeals);
    }, [initialMeals]);

    // Lidar com deep links de notificações
    useEffect(() => {
        const mealId = searchParams.get("mealId");
        const action = searchParams.get("action");

        if (mealId && action === "edit") {
            const mealToEdit = meals.find(m => m.id === Number(mealId));
            if (mealToEdit) {
                openEditDialog(mealToEdit);
            } else {
                // Se não achou na lista de meals, pode ser que ainda não tenha sido criado
                // Mas o deep link costuma vir com o plano se for 'log' ou algo assim
                // Se for um plano de dieta sem refeição criada ainda:
                const plan = dietPlan.find(p => p.id === Number(mealId));
                if (plan) {
                    setEditingMeal(null);
                    setMealName(plan.mealName);
                    const planItems = Array.isArray(plan.items) ? plan.items : [];
                    const suggestionItems: MealItem[] = planItems.map(it => ({
                        food: it.food || "Alimento",
                        protein: Number(it.protein || 0),
                        carbs: Number(it.carbs || 0),
                        fat: Number(it.fat || 0),
                        qty: Number(it.qty || 100)
                    }));
                    setCurrentItems(suggestionItems);
                    setIsDialogOpen(true);
                }
            }
        }
    }, [searchParams, meals, dietPlan]);

    // Form State
    const [mealName, setMealName] = useState("");
    const [currentItems, setCurrentItems] = useState<MealItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [subDialogOpenId, setSubDialogOpenId] = useState<number | null>(null);

    // Busca de alimentos com debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length > 2) {
                setIsSearching(true);
                try {
                    const results = await searchFoodNutrition(searchQuery);
                    setSearchResults(results);
                } catch (error) {
                    console.error("Search failed:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);


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
            let result;
            if (existingMeal) {
                const currentItems = Array.isArray(existingMeal.items) ? [...existingMeal.items] : [];
                const matchIndex = currentItems.findIndex(it =>
                    it.food.toLowerCase().includes(sub.canReplace.toLowerCase()) ||
                    sub.canReplace.toLowerCase().includes(it.food.toLowerCase())
                );

                if (matchIndex > -1) {
                    currentItems[matchIndex] = newItem;
                } else {
                    currentItems.push(newItem);
                }

                result = await saveMeal({
                    id: existingMeal.id,
                    date: existingMeal.date,
                    mealName: existingMeal.mealName,
                    items: currentItems,
                    isCompleted: existingMeal.isCompleted
                });
            } else {
                let itemsToSave = [newItem];
                if (plan.items && plan.items.length > 0) {
                    const baseItems = [...plan.items];
                    const matchIdx = baseItems.findIndex(it =>
                        it.food.toLowerCase().includes(sub.canReplace.toLowerCase()) ||
                        sub.canReplace.toLowerCase().includes(it.food.toLowerCase())
                    );
                    if (matchIdx > -1) {
                        baseItems[matchIdx] = newItem;
                        itemsToSave = baseItems;
                    } else {
                        itemsToSave = [...baseItems, newItem];
                    }
                } else if (plan.suggestions) {
                    const baseParts = plan.suggestions.split('+').map(p => p.trim());
                    const baseItems: MealItem[] = baseParts.map((p, idx) => ({
                        food: p,
                        protein: idx === 0 ? (plan.targetProtein || 0) : 0,
                        carbs: idx === 0 ? (plan.targetCarbs || 0) : 0,
                        fat: idx === 0 ? (plan.targetFat || 0) : 0,
                        qty: 100
                    }));

                    const matchIdx = baseItems.findIndex(it =>
                        it.food.toLowerCase().includes(sub.canReplace.toLowerCase()) ||
                        sub.canReplace.toLowerCase().includes(it.food.toLowerCase())
                    );

                    if (matchIdx > -1) {
                        baseItems[matchIdx] = newItem;
                        itemsToSave = baseItems;
                    } else {
                        itemsToSave = [...baseItems, newItem];
                    }
                }

                result = await saveMeal({
                    date,
                    mealName: plan.mealName,
                    items: itemsToSave,
                    isCompleted: false
                });
            }
            if (result?.success) {
                setSubDialogOpenId(null);
                router.refresh();
            }
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
        // Se os itens do diário estão vazios, pre-preenche do protocolo
        const diaryItems = Array.isArray(meal.items) ? meal.items : [];
        if (diaryItems.length === 0) {
            const plan = dietPlan.find(p => p.mealName === meal.mealName);
            const planItems: MealItem[] = Array.isArray(plan?.items) ? plan!.items.map((it: any) => ({
                food: it.food || "Alimento",
                protein: Number(it.protein || 0),
                carbs: Number(it.carbs || 0),
                fat: Number(it.fat || 0),
                qty: Number(it.qty || 100)
            })) : [];
            setCurrentItems(planItems);
        } else {
            setCurrentItems(diaryItems);
        }
        setIsDialogOpen(true);
    }

    function addItem(food: any) {
        const newItem = {
            food: food.name || "Alimento",
            protein: Number(food.protein) || 0,
            carbs: Number(food.carbs) || 0,
            fat: Number(food.fat) || 0,
            qty: Number(food.qty) || 100
        };
        setCurrentItems(prev => [...prev, newItem]);
        setSearchQuery("");
        setSearchResults([]);
    }

    function removeItem(index: number) {
        setCurrentItems(currentItems.filter((_, i) => i !== index));
    }

    function updateItemQty(index: number, newQty: number) {
        const nextItems = [...currentItems];
        const safeQty = isNaN(newQty) || newQty <= 0 ? 1 : newQty;
        const factor = nextItems[index].qty > 0 ? safeQty / nextItems[index].qty : 1;
        nextItems[index] = {
            ...nextItems[index],
            protein: Number((nextItems[index].protein * factor).toFixed(1)),
            carbs: Number((nextItems[index].carbs * factor).toFixed(1)),
            fat: Number((nextItems[index].fat * factor).toFixed(1)),
            qty: safeQty
        };
        setCurrentItems(nextItems);
    }

    async function handleSave() {
        startTransition(async () => {
            try {
                const result = await saveMeal({
                    id: editingMeal?.id,
                    date,
                    mealName,
                    items: currentItems,
                    isCompleted: editingMeal?.isCompleted || false
                });
                if (result.success) {
                    setIsDialogOpen(false);
                    router.refresh();
                } else {
                    alert(result.error || "Erro ao salvar refeição");
                }
            } catch (err) {
                console.error("Save failed:", err);
                alert("Erro crítico ao salvar. Tente novamente.");
            }
        });
    }

    async function handleUndo(mealId: number) {
        if (confirm("Deseja limpar o registro desta refeição e voltar ao plano original?")) {
            startTransition(async () => {
                await clearMealLog(mealId);
                router.refresh();
            });
        }
    }

    async function handleDelete(id: number) {
        if (confirm("Deseja excluir esta refeição permanentemente?")) {
            await deleteMeal(id);
            router.refresh();
        }
    }

    async function toggleComplete(meal: Meal) {
        if (!meal.id) {
            // Se não tem ID, é uma refeição do plano que não foi registrada ainda.
            // Vamos registrar com os itens padrão do plano.
            const plan = dietPlan.find(p => p.mealName === meal.mealName);
            if (plan) {
                handleQuickAdd(plan, true);
                return;
            }
            return;
        }

        const nextState = !meal.isCompleted;
        setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, isCompleted: nextState } : m));

        startTransition(async () => {
            const result = await toggleMealCompletion(meal.id!, nextState);
            if (!result.success) {
                setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, isCompleted: !nextState } : m));
            }
            router.refresh();
        });
    }

    async function handleQuickAdd(plan: DietPlanItem, isCompleted = false) {
        const planItems = Array.isArray(plan.items) ? plan.items : [];
        const suggestionItems: MealItem[] = planItems.map(it => ({
            food: it.food || "Alimento",
            protein: Number(it.protein || 0),
            carbs: Number(it.carbs || 0),
            fat: Number(it.fat || 0),
            qty: Number(it.qty || 100)
        }));

        startTransition(async () => {
            const result = await saveMeal({
                date,
                mealName: plan.mealName,
                items: suggestionItems,
                isCompleted,
                notes: `Plano Base`
            });

            if (result.success) {
                router.refresh();
            }
        });
    }

    async function handleSubstituteItem(food: any) {
        if (!isSubstituting) return;

        const { mealId, itemIndex } = isSubstituting;
        const targetMeal = meals.find(m => m.id === mealId);

        if (!targetMeal) return;

        // Se o diário existe mas está vazio, usa o protocolo como base
        const plan = dietPlan.find(p => p.mealName === targetMeal.mealName);
        const baseItems = (Array.isArray(targetMeal.items) && targetMeal.items.length > 0)
            ? [...targetMeal.items]
            : (plan && Array.isArray(plan.items) ? [...plan.items] : []);

        // Escala os macros pela quantidade real informada (padrão do banco = por 100g)
        const qty = food._selectedQty ?? 100;
        const factor = qty / 100;

        const newItems = [...baseItems];
        newItems[itemIndex] = {
            food: String(food.name || "Alimento"),
            protein: Number((Number(food.protein || 0) * factor).toFixed(1)),
            carbs: Number((Number(food.carbs || 0) * factor).toFixed(1)),
            fat: Number((Number(food.fat || 0) * factor).toFixed(1)),
            qty
        };

        startTransition(async () => {
            const result = await saveMeal({
                ...targetMeal,
                items: newItems
            });
            if (result.success) {
                setIsSubstituteSearchOpen(false);
                setIsSubstituting(null);
                setSubstituteFood(null);
                setSubstituteQty(100);
                setSubstitutePlan(null);
                router.refresh();
            }
        });
    }

    async function simulateNotification() {
        setIsSimulating(true);
        try {
            if (!("Notification" in window)) {
                alert("Este navegador não suporta notificações.");
                return;
            }

            let permission = Notification.permission;
            if (permission !== "granted") {
                permission = await Notification.requestPermission();
            }

            if (permission === "granted") {
                const registration = await navigator.serviceWorker.ready;
                registration.showNotification("🍽️ Simulação: Hora do Almoço!", {
                    body: "Sua dieta está pronta. O que vai comer?",
                    icon: "/icons/icon-192x192.png",
                    data: {
                        mealId: dietPlan[0]?.id || 1, // Simula o primeiro item do plano
                        mealName: dietPlan[0]?.mealName || "Refeição",
                        url: "/dashboard/meals"
                    },
                    actions: [
                        { action: "log", title: "Registrar Plano" },
                        { action: "edit", title: "Substituir" }
                    ]
                } as any);
            }
        } catch (error) {
            console.error("Erro ao simular:", error);
        } finally {
            setIsSimulating(false);
        }
    }

    const safeCurrentItems = Array.isArray(currentItems) ? currentItems : [];
    const totals = safeCurrentItems.reduce((acc, item) => {
        const p = Number(item.protein || 0);
        const c = Number(item.carbs || 0);
        const f = Number(item.fat || 0);
        return {
            p: acc.p + p,
            c: acc.c + c,
            f: acc.f + f,
            cal: acc.cal + (p * 4 + c * 4 + f * 9)
        }
    }, { p: 0, c: 0, f: 0, cal: 0 });

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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={simulateNotification}
                        disabled={isSimulating}
                        className="rounded-xl border-dashed h-12 px-4 text-xs font-bold gap-2 animate-pulse hover:animate-none"
                    >
                        <BellRing className="h-4 w-4" />
                        Simular Notify
                    </Button>
                    <Button onClick={openCreateDialog} className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-5 w-5" /> Adicionar
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {dietPlan.length === 0 && (
                    <div className="text-center py-12 bg-card/10 rounded-[2.5rem] border border-dashed border-white/5 mx-2">
                        <Utensils className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground font-medium italic">Protocolo não configurado para hoje.</p>
                        <p className="text-[10px] text-muted-foreground/50 uppercase mt-2">Configure seu plano na aba de Protocolo</p>
                    </div>
                )}

                {dietPlan.map((plan) => {
                    const existingMeal = meals.find(m => m.mealName === plan.mealName);
                    const isExpanded = expandedMeals[plan.id];

                    return (
                        <Card key={plan.id} className={cn(
                            "group transition-all overflow-hidden border-none bg-card/40 backdrop-blur-xl ring-1 ring-white/5",
                            existingMeal?.isCompleted ? "opacity-60 grayscale-[0.5]" : "hover:ring-primary/30"
                        )}>
                            <div className="flex items-center p-4 gap-4 cursor-pointer" onClick={() => setExpandedMeals(prev => ({ ...prev, [plan.id]: !prev[plan.id] }))}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleComplete(existingMeal || { mealName: plan.mealName, items: [], isCompleted: false, date });
                                    }}
                                    className="transition-transform hover:scale-110 active:scale-95 shrink-0"
                                >
                                    {existingMeal?.isCompleted ? (
                                        <CheckCircle2 className="h-8 w-8 text-green-500 fill-green-500/10" />
                                    ) : (
                                        <Circle className="h-8 w-8 text-muted-foreground/30" />
                                    )}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-primary/60 tracking-widest uppercase">
                                            {plan.scheduledTime}
                                        </span>
                                        <h3 className={cn("font-bold text-base truncate", existingMeal?.isCompleted && "text-muted-foreground")}>
                                            {plan.mealName}
                                        </h3>
                                    </div>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-[10px] font-bold text-red-500/80">P: {existingMeal ? (Array.isArray(existingMeal.items) ? existingMeal.items : []).reduce((a, b) => a + Number(b.protein || 0), 0).toFixed(0) : (plan.targetProtein ?? 0)}g</span>
                                        <span className="text-[10px] font-bold text-blue-500/80">C: {existingMeal ? (Array.isArray(existingMeal.items) ? existingMeal.items : []).reduce((a, b) => a + Number(b.carbs || 0), 0).toFixed(0) : (plan.targetCarbs ?? 0)}g</span>
                                        <span className="text-[10px] font-bold text-yellow-500/80">G: {existingMeal ? (Array.isArray(existingMeal.items) ? existingMeal.items : []).reduce((a, b) => a + Number(b.fat || 0), 0).toFixed(0) : (plan.targetFat ?? 0)}g</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-primary">
                                            {existingMeal ? Math.round((Array.isArray(existingMeal.items) ? existingMeal.items : []).reduce((a, b) => a + (Number(b.protein || 0) * 4 + Number(b.carbs || 0) * 4 + Number(b.fat || 0) * 9), 0)) : (plan.targetCalories ?? 0)}
                                            <span className="text-[10px] ml-1 font-normal text-muted-foreground uppercase">kcal</span>
                                        </p>
                                    </div>
                                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground/30 transition-transform", isExpanded && "rotate-90")} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    <div className="h-px bg-white/5 mx-2" />

                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-2 flex justify-between">
                                            <span>Alimentos</span>
                                            {existingMeal ? (
                                                <span className="text-primary italic">Diário (Consumo Real)</span>
                                            ) : (
                                                <span className="text-muted-foreground/50 italic">Plano Base</span>
                                            )}
                                        </p>

                                        {(() => {
                                            // #1 Sincronização inteligente: diário existe mas vazio → exibe protocolo como base
                                            const diaryItems = existingMeal ? (Array.isArray(existingMeal.items) ? existingMeal.items : []) : [];
                                            const protocolItems = Array.isArray(plan.items) ? plan.items : [];
                                            const displayItems = diaryItems.length > 0 ? diaryItems : protocolItems;
                                            const isShowingProtocol = diaryItems.length === 0 && protocolItems.length > 0;

                                            return displayItems.length > 0 ? displayItems.map((it: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold truncate">{it.qty ?? 100}g {it.food ?? "Alimento"}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase font-black">
                                                            P: {Number(it.protein ?? 0).toFixed(1)}g | C: {Number(it.carbs ?? 0).toFixed(1)}g | G: {Number(it.fat ?? 0).toFixed(1)}g
                                                        </p>
                                                    </div>
                                                    {/* #2 Botão Substituir: disponível quando há registro no diário OU ao ver protocolo */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (existingMeal) {
                                                                if (isShowingProtocol) {
                                                                    setIsSubstituting({ mealId: existingMeal.id!, itemIndex: idx });
                                                                } else {
                                                                    setIsSubstituting({ mealId: existingMeal.id!, itemIndex: idx });
                                                                }
                                                                setSubstitutePlan(plan);
                                                                setSubstituteFood(null);
                                                                setSubstituteQty(100);
                                                                setSearchQuery("");
                                                                setSearchResults([]);
                                                                setIsSubstituteSearchOpen(true);
                                                            } else {
                                                                handleQuickAdd(plan).then?.(() => {
                                                                    router.refresh();
                                                                });
                                                            }
                                                        }}
                                                        className="h-8 text-[10px] font-black uppercase tracking-tighter text-blue-400 hover:bg-blue-400/10 shrink-0"
                                                    >
                                                        Substituir
                                                    </Button>
                                                </div>
                                            )) : (
                                                <p className="text-xs text-muted-foreground/50 italic text-center py-2">
                                                    Nenhum alimento no protocolo
                                                </p>
                                            );
                                        })()}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        {existingMeal ? (
                                            <>
                                                <Button
                                                    onClick={(e) => { e.stopPropagation(); openEditDialog(existingMeal); }}
                                                    className="flex-1 h-10 rounded-xl gap-2 font-bold text-xs bg-primary/10 text-primary hover:bg-primary/20 border-none"
                                                >
                                                    <Plus className="h-3.5 w-3.5" /> Adicionar Alimento
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleUndo(existingMeal.id!); }}
                                                    title="Retornar ao Protocolo"
                                                    className="h-10 w-10 rounded-xl bg-muted/20 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); handleQuickAdd(plan); }}
                                                className="w-full h-10 rounded-xl gap-2 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                                            >
                                                <Plus className="h-4 w-4" /> Iniciar Refeição
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}

                <div className="pt-4 px-2">
                    <Button
                        variant="ghost"
                        onClick={openCreateDialog}
                        className="w-full h-14 rounded-2xl border border-dashed border-primary/20 bg-primary/5 text-primary gap-2 font-black uppercase tracking-widest hover:bg-primary/10 transition-all group"
                    >
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                        Adicionar Alimento Avulso
                    </Button>
                </div>
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
                                    placeholder="Buscar Alimento Extra (Edamam)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 rounded-xl bg-card border-none focus-visible:ring-primary shadow-inner"
                                />
                                <div className="absolute right-3 top-2.5">
                                    {isSearching && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                                </div>

                                {searchQuery && (
                                    <div className="absolute top-12 left-0 right-0 z-50 bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <ScrollArea className="h-64">
                                            {isSearching ? (
                                                <div className="p-8 flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                    <p className="text-xs">Buscando na base de dados...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {searchResults.map((food, idx) => (
                                                        <button
                                                            key={`${food.name}-${idx}`}
                                                            onClick={() => addItem(food)}
                                                            className="w-full text-left p-4 hover:bg-primary/5 transition-colors border-b last:border-0 flex justify-between items-center"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {food.image && (
                                                                    <img src={food.image} alt={food.name} className="h-10 w-10 rounded-lg object-cover bg-muted" />
                                                                )}
                                                                <div>
                                                                    <p className="font-bold text-sm">{food.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{food.unit}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-black text-primary">
                                                                    {food.calories} <span className="font-normal text-[10px] text-muted-foreground">kcal</span>
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}

                                                    {searchResults.length > 0 && (
                                                        <div className="p-4 text-center border-t bg-muted/10">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setIsPersistentCustomFoodOpen(true)}
                                                                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80"
                                                            >
                                                                <Plus className="h-3 w-3 mr-2" />
                                                                Não achou? Criar Personalizado
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {searchResults.length === 0 && !isSearching && searchQuery.length > 2 && (
                                                        <div className="p-8 text-center bg-muted/20 border-t">
                                                            <p className="text-xs text-muted-foreground italic mb-3">Não encontrou o que procurava?</p>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => setIsPersistentCustomFoodOpen(true)}
                                                                className="rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none"
                                                            >
                                                                <Plus className="h-3 w-3 mr-2" />
                                                                Crie um Alimento Personalizado
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
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
            <Dialog open={isSubstituteSearchOpen} onOpenChange={(open) => {
                setIsSubstituteSearchOpen(open);
                if (!open) { setSubstituteFood(null); setSubstituteQty(100); }
            }}>
                <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-card border-b">
                        <DialogTitle className="text-xl font-bold">
                            {substituteFood ? "Confirmar Substituição" : "Substituir Alimento"}
                        </DialogTitle>
                    </DialogHeader>

                    {substituteFood ? (
                        /* ====== FASE 2: confirmar quantidade ====== */
                        <div className="p-6 space-y-6">
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                                <p className="font-black text-sm">{substituteFood.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">
                                    Por 100g → P: {Number(substituteFood.protein || 0).toFixed(1)}g | C: {Number(substituteFood.carbs || 0).toFixed(1)}g | G: {Number(substituteFood.fat || 0).toFixed(1)}g | {substituteFood.calories ?? Math.round(Number(substituteFood.protein || 0) * 4 + Number(substituteFood.carbs || 0) * 4 + Number(substituteFood.fat || 0) * 9)} kcal
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                                    Quantidade (gramas)
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={2000}
                                    value={substituteQty}
                                    onChange={(e) => setSubstituteQty(Math.max(1, Number(e.target.value)))}
                                    className="h-14 text-2xl font-black text-center border-none bg-muted/50 rounded-xl"
                                />
                            </div>

                            {/* Preview dos macros com a qty real */}
                            {(() => {
                                const f = substituteQty / 100;
                                const p = Number((Number(substituteFood.protein || 0) * f).toFixed(1));
                                const c = Number((Number(substituteFood.carbs || 0) * f).toFixed(1));
                                const g = Number((Number(substituteFood.fat || 0) * f).toFixed(1));
                                const cal = Math.round(p * 4 + c * 4 + g * 9);
                                return (
                                    <div className="flex justify-around p-4 rounded-2xl bg-card/50 border border-white/5">
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase text-red-400">Prot</p>
                                            <p className="text-lg font-black">{p}g</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase text-blue-400">Carb</p>
                                            <p className="text-lg font-black">{c}g</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase text-yellow-400">Gord</p>
                                            <p className="text-lg font-black">{g}g</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black uppercase text-primary">Kcal</p>
                                            <p className="text-lg font-black text-primary">{cal}</p>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => setSubstituteFood(null)} className="flex-1 rounded-xl">
                                    Voltar
                                </Button>
                                <Button
                                    disabled={isPending}
                                    onClick={() => handleSubstituteItem({ ...substituteFood, _selectedQty: substituteQty })}
                                    className="flex-1 rounded-xl shadow-lg shadow-primary/20"
                                >
                                    {isPending ? "Salvando..." : "Confirmar"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* ====== FASE 1: escolher alimento ====== */
                        <div className="p-6 space-y-4">
                            {/* Sugestões do protocolo */}
                            {(() => {
                                const subs = Array.isArray(substitutePlan?.substitutions) ? substitutePlan!.substitutions : [];
                                if (subs.length === 0) return null;
                                return (
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase text-primary/70 tracking-widest">Substituições Previstas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {subs.map((sub: any, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setSubstituteFood({
                                                            name: sub.item,
                                                            protein: sub.protein,
                                                            carbs: sub.carbs,
                                                            fat: sub.fat ?? 0,
                                                            calories: Math.round((sub.protein || 0) * 4 + (sub.carbs || 0) * 4 + (sub.fat || 0) * 9)
                                                        });
                                                        // Pré-preencher com a quantidade configurada no protocolo
                                                        setSubstituteQty(sub.qty ?? 100);
                                                    }}
                                                    className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[11px] font-black hover:bg-primary/20 transition-colors border border-primary/20"
                                                >
                                                    {sub.item}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="h-px bg-white/5 mt-2" />
                                    </div>
                                );
                            })()}

                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar substituto..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 rounded-xl bg-card border-none focus-visible:ring-primary shadow-inner"
                                    autoFocus
                                />
                            </div>
                            <ScrollArea className="h-64">
                                {isSearching ? (
                                    <div className="p-8 flex flex-col items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {searchResults.length === 0 && searchQuery.trim().length > 2 && (
                                            <p className="text-xs text-center text-muted-foreground py-6 italic">Nenhum resultado encontrado</p>
                                        )}
                                        {searchResults.map((food, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { setSubstituteFood(food); setSubstituteQty(100); }}
                                                className="w-full text-left p-4 hover:bg-primary/5 transition-colors rounded-xl flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="font-bold text-sm">{food.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{food.unit}</p>
                                                </div>
                                                <p className="text-xs font-black text-primary">{food.calories} kcal/100g</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <CustomFoodDialog
                open={isPersistentCustomFoodOpen}
                onOpenChange={setIsPersistentCustomFoodOpen}
                onSuccess={(newFood) => {
                    if (isSubstituting) {
                        handleSubstituteItem(newFood);
                    } else {
                        addItem(newFood);
                    }
                }}
            />
        </div >
    );
}
