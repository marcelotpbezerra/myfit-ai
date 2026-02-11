"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
    Dumbbell,
    Utensils,
    Activity,
    Home,
    Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Treino", href: "/dashboard/workout", icon: Dumbbell },
    { label: "Dieta", href: "/dashboard/meals", icon: Utensils },
    { label: "Saúde", href: "/dashboard/health", icon: Activity },
];


export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Se for a landing page, não mostra o shell
    if (pathname === "/") return <>{children}</>;

    return (
        <div className="flex h-screen flex-col bg-background md:flex-row dark:bg-[#080808]">
            {/* Sidebar - Desktop */}
            <aside className="hidden w-64 flex-col border-r bg-card/30 backdrop-blur-xl md:flex">
                <div className="flex h-20 items-center border-b px-6">
                    <Link href="/dashboard" className="flex items-center gap-3 font-black text-primary text-2xl tracking-tighter">
                        <div className="rounded-xl bg-primary/10 p-2">
                            <Dumbbell className="h-6 w-6 stroke-[2.5px]" />
                        </div>
                        <span>MyFit<span className="text-foreground/50">.ai</span></span>
                    </Link>
                </div>
                <nav className="flex-1 space-y-1.5 p-4">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 hover:bg-accent/50 group",
                                pathname.startsWith(item.href)
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", pathname.startsWith(item.href) ? "stroke-[2.5px]" : "stroke-2")} />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="border-t p-6">
                    <UserButton
                        showName
                        appearance={{
                            elements: {
                                userButtonBox: "flex-row-reverse",
                                userButtonOuterIdentifier: "font-bold text-sm"
                            }
                        }}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
                {/* Header - Mobile */}
                <header className="flex h-16 items-center justify-between border-b bg-card/50 backdrop-blur-lg px-6 md:hidden sticky top-0 z-40">
                    <Link href="/dashboard" className="flex items-center gap-2 font-black text-primary tracking-tighter">
                        <Dumbbell className="h-5 w-5 stroke-[2.5px]" />
                        <span>MyFit.ai</span>
                    </Link>
                    <UserButton />
                </header>

                <div className="mx-auto max-w-5xl p-6 md:p-10 space-y-10">
                    {children}
                </div>
            </main>

            {/* Bottom Nav - Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 flex h-20 items-center justify-around border-t bg-card/80 backdrop-blur-xl px-4 md:hidden z-50 rounded-t-3xl shadow-2xl">
                {NAV_ITEMS.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all active:scale-90",
                            pathname.startsWith(item.href)
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground"
                        )}
                    >
                        <item.icon className={cn("h-6 w-6", pathname.startsWith(item.href) ? "stroke-[2.5px]" : "stroke-2")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
