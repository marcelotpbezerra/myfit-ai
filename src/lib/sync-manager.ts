/**
 * sync-manager.ts
 * Gerencia a fila de sincronização offline → servidor.
 *
 * Fluxo:
 *  1. Ação do usuário → salva no IndexedDB local
 *  2. Se online → tenta sync imediato via server action
 *  3. Se offline (ou falhou) → enfileira em SyncQueue
 *  4. Quando volta a conexão / Background Sync → processa fila
 */
import { getLocalDb, type SyncQueueItem } from "./local-db";
import { logSet } from "@/actions/workout";
import { saveMeal } from "@/actions/diet";
import { addHealthStat } from "@/actions/health";

// ─── Fila de sync ─────────────────────────────────────────────────────────────

/** Adiciona uma operação à fila de sincronização */
export async function enqueueSync(
  table: SyncQueueItem["table"],
  operation: SyncQueueItem["operation"],
  localId: string,
  data: object
): Promise<void> {
  const db = getLocalDb();
  await db.syncQueue.add({
    localId,
    table,
    operation,
    data: JSON.stringify(data),
    createdAt: new Date().toISOString(),
    attempts: 0,
  });

  // Tenta registrar Background Sync no Service Worker
  if (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "SyncManager" in window
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-expect-error — Background Sync API ainda sem types completos
      await registration.sync.register("myfit-sync-queue");
    } catch {
      // SW pode não estar ativo em dev — ignora silenciosamente
    }
  }
}

/** Retorna quantos itens estão aguardando sincronização */
export async function getPendingCount(): Promise<number> {
  const db = getLocalDb();
  return db.syncQueue.count();
}

// ─── Processamento da fila ────────────────────────────────────────────────────

const MAX_ATTEMPTS = 5;

/**
 * Processa todos os itens pendentes na fila.
 * Chamado quando a conexão é restaurada ou via Background Sync.
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  if (typeof window === "undefined") return { processed: 0, failed: 0 };

  const db = getLocalDb();
  const items = await db.syncQueue
    .filter((item) => item.attempts < MAX_ATTEMPTS)
    .toArray();

  let processed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await processSyncItem(item);
      await db.syncQueue.delete(item.id!);
      processed++;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      await db.syncQueue.update(item.id!, {
        attempts: item.attempts + 1,
        lastError: errMsg,
      });
      failed++;
    }
  }

  return { processed, failed };
}

async function processSyncItem(item: SyncQueueItem): Promise<void> {
  const data = JSON.parse(item.data);

  switch (item.table) {
    case "workout_sessions": {
      // Replica cada série da sessão via logSet
      if (item.operation === "create" && data.sets) {
        for (const set of data.sets as Array<{
          exerciseId: number;
          weight: string;
          reps: number;
          restTime?: number;
          notes?: string;
          startedAt?: string;
          completedAt?: string;
        }>) {
          await logSet({
            exerciseId: set.exerciseId,
            weight: set.weight,
            reps: set.reps,
            restTime: set.restTime ?? 60,
            notes: set.notes,
            startedAt: set.startedAt ? new Date(set.startedAt) : undefined,
            completedAt: set.completedAt ? new Date(set.completedAt) : undefined,
          });
        }
      }
      break;
    }

    case "meals": {
      if (item.operation === "create" || item.operation === "update") {
        await saveMeal(data);
      }
      break;
    }

    case "health_stats": {
      if (item.operation === "create") {
        await addHealthStat(data.type, String(data.value));
      }
      break;
    }

    default:
      throw new Error(`Tabela desconhecida na fila: ${item.table}`);
  }
}

// ─── Listener de conectividade ────────────────────────────────────────────────

let syncListenerAttached = false;

/**
 * Registra listener que processa a fila automaticamente quando a
 * conexão é restaurada. Deve ser chamado uma vez no cliente.
 */
export function attachConnectivityListener(): () => void {
  if (syncListenerAttached) return () => {};

  const handleOnline = () => {
    processSyncQueue().catch(console.error);
  };

  window.addEventListener("online", handleOnline);
  syncListenerAttached = true;

  // Se já estiver online, processa imediatamente
  if (navigator.onLine) {
    processSyncQueue().catch(console.error);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    syncListenerAttached = false;
  };
}
