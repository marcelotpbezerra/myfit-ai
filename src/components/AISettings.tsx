"use client";

import { useState, useTransition } from "react";
import { updateAIContext } from "@/actions/health";
import { Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AISettings({ initialContext }: { initialContext: string }) {
    const [isPending, startTransition] = useTransition();
    const [context, setContext] = useState(initialContext);

    const handleSave = () => {
        startTransition(async () => {
            await updateAIContext(context);
            alert("Objetivos salvos! O MyFit.ai agora conhece melhor seu perfil.");
        });
    };

    return (
        <Card className="border-none bg-primary/5 backdrop-blur-xl ring-1 ring-primary/20 overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Brain Context (IA)
                </CardTitle>
                <CardDescription className="text-xs uppercase font-bold text-muted-foreground">Conte seus objetivos para o MyFit.ai</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <Textarea
                    placeholder="Ex: Quero ganhar massa muscular, tenho dificuldade em dormir 8h e foco em pernas..."
                    className="min-h-[120px] rounded-2xl bg-background/50 border-none shadow-inner resize-none focus-visible:ring-primary"
                    value={context}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}

                />
                <Button
                    onClick={handleSave}
                    disabled={isPending}
                    className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 font-bold"
                >
                    {isPending ? "Salvando..." : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Atualizar Contexto
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
