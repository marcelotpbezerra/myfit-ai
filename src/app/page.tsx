import Link from "next/link";
import { Dumbbell, ArrowRight, Activity, Utensils, Zap } from "lucide-react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <header className="flex h-20 items-center justify-between px-6 lg:px-12 border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-2xl text-primary">
          <Dumbbell className="h-8 w-8" />
          <span>MyFit.ai</span>
        </div>
        <div>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                Entrar
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <button className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                Acessar Dashboard
              </button>
            </Link>
          </SignedIn>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-20 lg:py-32 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-8">
            <Zap className="h-3 w-3 text-primary" />
            <span>Inteligência Artificial aplicada à sua saúde</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Seu corpo merece uma gestão inteligente.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            O MyFit.ai une treinos avançados, controle nutricional de alta precisão e biometria em um único lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground transition-all hover:scale-105 shadow-xl shadow-primary/25">
                  Começar Agora
                  <ArrowRight className="h-5 w-5" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground transition-all hover:scale-105 shadow-xl shadow-primary/25">
                  Ir para o Dashboard
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            </SignedIn>
          </div>
        </section>

        <section className="px-6 py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border transition-all hover:border-primary/50 group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Treino Dinâmico</h3>
              <p className="text-muted-foreground">Periodização flexível (A, B, C, ABCD) e registro de performance em tempo real.</p>
            </div>
            <div className="bg-card p-8 rounded-2xl border transition-all hover:border-primary/50 group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Utensils className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Nutrição 360°</h3>
              <p className="text-muted-foreground">Controle nutricional preciso com integração de APIs para cálculo automático de macros.</p>
            </div>
            <div className="bg-card p-8 rounded-2xl border transition-all hover:border-primary/50 group">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Saúde Holística</h3>
              <p className="text-muted-foreground">Acompanhamento biométrico, ingestão de água e sono para uma visão completa do seu progresso.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t text-center text-muted-foreground text-sm">
        <p>© 2026 MyFit.ai - Inteligência em Performance.</p>
      </footer>
    </div>
  );
}
