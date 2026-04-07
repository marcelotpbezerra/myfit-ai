/**
 * local-db.ts
 * Banco de dados local via IndexedDB (Dexie.js) para suporte offline-first.
 * Espelha as tabelas do servidor mas com campos extras para controle de sync.
 */
import Dexie, { type Table } from "dexie";

// ─── Tipos locais ────────────────────────────────────────────────────────────

export type SyncStatus = "pending" | "synced" | "error";

export interface LocalWorkoutSession {
  id?: number;
  /** UUID gerado no cliente antes de subir ao servidor */
  localId: string;
  division: string;
  exercises: LocalSessionExercise[];
  startedAt: string;
  completedAt?: string;
  syncStatus: SyncStatus;
  userId: string;
}

export interface LocalSessionExercise {
  exerciseId: number;
  exerciseName: string;
  muscleGroup?: string | null;
  sets: LocalSet[];
}

export interface LocalSet {
  setNumber: number;
  weight: string;
  reps: number;
  rpe?: number;
  notes?: string;
  loggedAt: string;
  /** ID retornado pelo servidor após sync */
  serverId?: number;
}

export interface LocalMeal {
  id?: number;
  localId: string;
  serverId?: number;
  userId: string;
  date: string;
  mealName: string;
  items: MealItem[];
  isCompleted: boolean;
  notes?: string;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface MealItem {
  food: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  qty: number;
  unit?: string;
}

export interface LocalHealthStat {
  id?: number;
  localId: string;
  serverId?: number;
  userId: string;
  type: string; // 'weight' | 'water' | 'sleep_hours' | 'waist_cm' etc.
  value: number;
  recordedAt: string;
  syncStatus: SyncStatus;
}

export interface SyncQueueItem {
  id?: number;
  /** ID local do registro relacionado */
  localId: string;
  /** Tabela alvo no servidor */
  table: "workout_sessions" | "meals" | "health_stats";
  /** Operação a executar */
  operation: "create" | "update" | "delete";
  /** Payload serializado */
  data: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

// ─── Definição do banco ──────────────────────────────────────────────────────

export class LocalDatabase extends Dexie {
  workoutSessions!: Table<LocalWorkoutSession>;
  meals!: Table<LocalMeal>;
  healthStats!: Table<LocalHealthStat>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super("myfit-local-v1");

    this.version(1).stores({
      workoutSessions:
        "++id, localId, division, startedAt, syncStatus, userId",
      meals: "++id, localId, serverId, userId, date, mealName, syncStatus",
      healthStats:
        "++id, localId, serverId, userId, type, recordedAt, syncStatus",
      syncQueue: "++id, localId, table, operation, createdAt, attempts",
    });
  }
}

// Singleton — instanciado apenas no cliente
let _db: LocalDatabase | null = null;

export function getLocalDb(): LocalDatabase {
  if (typeof window === "undefined") {
    throw new Error("getLocalDb() só pode ser chamado no cliente");
  }
  if (!_db) {
    _db = new LocalDatabase();
  }
  return _db;
}
