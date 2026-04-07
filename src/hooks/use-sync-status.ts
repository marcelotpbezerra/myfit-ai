"use client";

import { useState, useEffect, useCallback } from "react";
import { useOnlineStatus } from "./use-online-status";

interface SyncStatus {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
  triggerSync: () => Promise<void>;
}

/**
 * Expõe o status da fila de sincronização offline e permite
 * disparar um sync manual.
 */
export function useSyncStatus(): SyncStatus {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      const { getPendingCount } = await import("@/lib/sync-manager");
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB pode não estar disponível (SSR)
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const { processSyncQueue } = await import("@/lib/sync-manager");
      await processSyncQueue();
      setLastSyncAt(new Date().toISOString());
      await refreshCount();
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, refreshCount]);

  // Atualiza contagem quando volta online
  useEffect(() => {
    refreshCount();
    if (isOnline) {
      triggerSync();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling leve enquanto há itens pendentes e está online
  useEffect(() => {
    if (!isOnline || pendingCount === 0) return;
    const id = setInterval(refreshCount, 5000);
    return () => clearInterval(id);
  }, [isOnline, pendingCount, refreshCount]);

  return { pendingCount, isSyncing, lastSyncAt, triggerSync };
}
