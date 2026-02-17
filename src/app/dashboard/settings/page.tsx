import { auth } from "@clerk/nextjs/server";
import { getUserSettings } from "@/actions/health";
import { BiometricToggle } from "@/components/BiometricToggle";
import { AISettings } from "@/components/AISettings";
import { Settings, ShieldCheck } from "lucide-react";

export default async function SettingsPage() {
    const settings = await getUserSettings();
    const biometricEnabled = settings?.biometricEnabled ?? false;
    const aiContext = settings?.aiContext || "";

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <Settings className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Configurações
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">
                        Personalize sua experiência e segurança.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Segurança */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold italic">Segurança</h2>
                    </div>

                    <BiometricToggle initialValue={biometricEnabled} />
                </div>

                {/* Perfil & IA */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-bold italic">Inteligência Artificial</h2>
                    </div>
                    <AISettings initialContext={aiContext} />
                </div>
            </div>
        </div>
    );
}
