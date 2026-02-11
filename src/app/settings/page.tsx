import { SignOutButton } from "@clerk/nextjs";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Ajustes</h1>
            <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Conta</h2>
                <SignOutButton>
                    <button className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90">
                        Sair da Conta
                    </button>
                </SignOutButton>
            </div>
        </div>
    );
}
