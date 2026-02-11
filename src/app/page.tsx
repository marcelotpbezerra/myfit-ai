import Link from "next/link";
import { Dumbbell, ArrowRight, Activity, Utensils, Zap, Star, Shield, Smartphone } from "lucide-react";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#080808]">
      {/* Hero Section */}
      <header className="flex h-20 items-center justify-between px-6 lg:px-12 bg-transparent sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-2xl text-primary tracking-tighter">
          <Dumbbell className="h-8 w-8 stroke-[2.5px]" />
          <span>MyFit<span className="text-foreground/50">.ai</span></span>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-2xl bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10 active:scale-95">
                Entrar
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <button className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                Dashboard
              </button>
            </Link>
          </SignedIn>
        </div>
      </header>

      <main className="flex-1">
        {/* Intro Section */}
        <section className="relative px-6 py-12 lg:py-20 text-center max-w-5xl mx-auto overflow-hidden">
          {/* Background Blobs */}
          <div className="absolute top-0 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
          <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />

          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary mb-6 lg:mb-8">
            <Zap className="h-3 w-3" />
            <span>Inteligência Artificial aplicada à sua saúde</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-6 leading-[0.85] text-white">
            SEU CORPO MERECE UMA <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent italic">GESTÃO INTELIGENTE.</span>
          </h1>

          <p className="text-base lg:text-lg text-muted-foreground mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-4">
            O MyFit.ai une treinos avançados, controle nutricional de alta precisão e biometria em um ecossistema projetado para alta performance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-5 text-xl font-black text-black transition-all hover:scale-105 shadow-2xl shadow-primary/30 group">
                  Começar Jornada
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <button className="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary px-10 py-5 text-xl font-black text-black transition-all hover:scale-105 shadow-2xl shadow-primary/30">
                  Dashboard
                  <ArrowRight className="h-6 w-6" />
                </button>
              </Link>
            </SignedIn>
          </div>

          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 border-y border-white/5 py-10 opacity-50">
            <div className="space-y-1">
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">IA Powered</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-white">PWA</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">App Instalável</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-white">V.1.0</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">Early Access</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-white">Premium</p>
              <p className="text-[10px] font-bold uppercase tracking-widest">Design High-End</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-24 bg-card/10 border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl font-black tracking-tight text-white">RECURSOS DE ELITE</h2>
              <div className="h-1.5 w-20 bg-primary mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="group relative bg-white/[0.02] p-10 rounded-[40px] border border-white/5 hover:bg-white/[0.04] transition-all overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 group-hover:text-primary transition-transform">
                  <Dumbbell className="h-20 w-20" />
                </div>
                <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 text-primary shadow-inner">
                  <Dumbbell className="h-8 w-8 stroke-[2.5px]" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-white">Treino Dinâmico</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">Periodização flexível (A-B-C-D) e registro de performance com UX de academia.</p>
              </div>

              <div className="group relative bg-white/[0.02] p-10 rounded-[40px] border border-white/5 hover:bg-white/[0.04] transition-all overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 group-hover:text-primary transition-transform">
                  <Utensils className="h-20 w-20" />
                </div>
                <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 text-primary shadow-inner">
                  <Utensils className="h-8 w-8 stroke-[2.5px]" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-white">Nutrição 360°</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">Controle nutricional com integração inteligente para cálculo automático de macros.</p>
              </div>

              <div className="group relative bg-white/[0.02] p-10 rounded-[40px] border border-white/5 hover:bg-white/[0.04] transition-all overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 group-hover:text-primary transition-transform">
                  <Activity className="h-20 w-20" />
                </div>
                <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 text-primary shadow-inner">
                  <Activity className="h-8 w-8 stroke-[2.5px]" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-white">Habits Engine</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">Acompanhamento de água, sono e biometria integrado ao seu treinamento.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials/Badges */}
        <section className="px-6 py-24 text-center max-w-4xl mx-auto">
          <div className="space-y-12">
            <div className="flex justify-center gap-1 text-primary">
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
              <Star className="h-5 w-5 fill-current" />
            </div>
            <blockquote className="text-3xl font-bold tracking-tight text-white leading-snug">
              "A interface mais fluida que já usei para treinar. O foco no PWA faz parecer um app nativo de altíssima performance."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold text-white uppercase text-sm tracking-widest">PWA Ready</p>
                <p className="text-xs text-muted-foreground uppercase font-black">Instale no seu iPhone ou Android</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 text-center bg-black/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-black text-xl text-primary tracking-tighter">
            <Dumbbell className="h-6 w-6 stroke-[2.5px]" />
            <span>MyFit<span className="text-white/30">.ai</span></span>
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">© 2026 Inteligência em Elite Performance</p>
          <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span className="hover:text-primary cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Termos</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
