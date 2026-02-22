"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createCustomFood } from "@/actions/diet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

const foodSchema = z.object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    porcao: z.string().min(1, "Porção é obrigatória"),
    kcal: z.number().min(0, "Mínimo 0"),
    prot: z.number().min(0, "Mínimo 0"),
    carb: z.number().min(0, "Mínimo 0"),
    gord: z.number().min(0, "Mínimo 0"),
});

type FoodFormValues = z.infer<typeof foodSchema>;

interface CustomFoodDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (food: any) => void;
}

export function CustomFoodDialog({ open, onOpenChange, onSuccess }: CustomFoodDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FoodFormValues>({
        resolver: zodResolver(foodSchema),
        defaultValues: {
            nome: "",
            porcao: "100g",
            kcal: 0,
            prot: 0,
            carb: 0,
            gord: 0,
        },
    });

    const onSubmit = async (data: FoodFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const result = await createCustomFood(data);
            if (result.success) {
                reset();
                onOpenChange(false);
                if (onSuccess) {
                    onSuccess({
                        name: data.nome,
                        protein: data.prot,
                        carbs: data.carb,
                        fat: data.gord,
                        calories: data.kcal,
                        unit: data.porcao
                    });
                }
            } else {
                setError(result.error || "Ocorreu um erro ao salvar o alimento.");
            }
        } catch (err) {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Novo Alimento Personalizado
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="nome" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Nome do Alimento
                        </Label>
                        <Input
                            id="nome"
                            placeholder="Ex: Whey Blend Chocolate"
                            {...register("nome")}
                            className="h-11 rounded-xl bg-muted/50 border-none shadow-inner"
                        />
                        {errors.nome && <p className="text-[9px] text-destructive font-bold ml-1 uppercase">{errors.nome.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="porcao" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                Porção (Ex: 100g)
                            </Label>
                            <Input
                                id="porcao"
                                {...register("porcao")}
                                className="h-11 rounded-xl bg-muted/50 border-none shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kcal" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                Calorias (Kcal)
                            </Label>
                            <Input
                                id="kcal"
                                type="number"
                                {...register("kcal", { valueAsNumber: true })}
                                className="h-11 rounded-xl bg-muted/50 border-none shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-red-500 ml-1">Proteína (g)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                {...register("prot", { valueAsNumber: true })}
                                className="h-11 rounded-xl bg-muted/50 border-none shadow-inner text-center font-bold"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-blue-500 ml-1">Carbs (g)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                {...register("carb", { valueAsNumber: true })}
                                className="h-11 rounded-xl bg-muted/50 border-none shadow-inner text-center font-bold"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-yellow-500 ml-1">Gordura (g)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                {...register("gord", { valueAsNumber: true })}
                                className="h-11 rounded-xl bg-muted/50 border-none shadow-inner text-center font-bold"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                "Salvar no meu Catálogo"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
