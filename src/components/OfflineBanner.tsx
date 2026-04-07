"use client";

import { WifiOff, RefreshCw, CheckCircle2, CloudOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { cn } from "@/lib/utils";

/**
 * Banner de status offline/sync exibido no topo da aplicação.
 *
 * - Offline sem pendências → fundo âmbar com "Modo offline"
 * - Online com pendências → fundo azul com botão de sync manual
 * - Sincronizando → spinner animado
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { pendingCount, isSyncing, triggerSync } = useSyncStatus();

  // Nada a exibir: online e sem pendências
  if (isOnline && pendingCount === 0) return null;

  const hasPending = pendingCount > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold",
        "transition-all duration-300",
        !isOnline
          ? "bg-amber-500/95 text-amber-950"
          : "bg-blue-600/95 text-white",
        "backdrop-blur-sm"
      )}
    >
      {/* Ícone de estado */}
      {!isOnline ? (
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
      ) : isSyncing ? (
        <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : (
        <CloudOff className="h-3.5 w-3.5 shrink-0" />
      )}

      {/* Mensagem */}
      <span>
        {!isOnline
          ? hasPending
            ? `Modo offline • ${pendingCount} ${pendingCount === 1 ? "dado pendente" : "dados pendentes"} para sync`
            : "Modo offline • Os dados serão sincronizados ao reconectar"
          : isSyncing
          ? `Sincronizando ${pendingCount} ${pendingCount === 1 ? "item" : "itens"}…`
          : `${pendingCount} ${pendingCount === 1 ? "item pendente" : "itens pendentes"} — Clique para sincronizar`}
      </span>

      {/* Botão de sync manual (apenas online com pendências) */}
      {isOnline && !isSyncing && hasPending && (
        <button
          onClick={triggerSync}
          aria-label="Sincronizar agora"
          className="ml-1 rounded-full bg-white/20 p-1 hover:bg-white/30 active:scale-90 transition-transform"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}

      {/* Confirmação de sync completo (quando volta de isSyncing) */}
      {isOnline && !isSyncing && !hasPending && (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-300" />
      )}
    </div>
  );
}
