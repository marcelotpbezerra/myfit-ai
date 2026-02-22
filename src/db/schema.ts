import { pgTable, serial, text, boolean, integer, numeric, timestamp, date, jsonb, unique, varchar, decimal } from "drizzle-orm/pg-core";

// 1. Tabela de Configurações do Usuário
export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  workoutSplit: text("workout_split").default("AB"), // Ex: 'AB', 'ABC', 'ABCD'
  restTimeDefault: integer("rest_time_default").default(60),
  waterGoal: integer("water_goal").default(3000),
  aiContext: text("ai_context"), // Objetivo do usuário para IA
  biometricEnabled: boolean("biometric_enabled").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Tabela de Exercícios (Proteção contra duplicatas)
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group"),
  split: text("split"), // 'A', 'B', 'C', 'D'
  isCustom: boolean("is_custom").default(true),
  apiId: text("api_id"), // ID caso venha da API externa
  equipment: text("equipment"),
  gifUrl: text("gif_url"),
  targetSets: integer("target_sets").default(3),
  targetReps: integer("target_reps").default(12),
  targetWeight: numeric("target_weight").default("0"),
  targetRestTime: integer("target_rest_time").default(60),
  order: integer("order").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  unqNameUser: unique().on(t.userId, t.name), // Chave composta para evitar duplicidade
}));

// 3. Tabela de Log de Treino
export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  weight: numeric("weight"),
  reps: integer("reps"),
  restTime: integer("rest_time"), // em segundos
  notes: text("notes"), // Notas específicas sobre este conjunto/exercício
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. Tabela de Dieta (Refeições e Consumo)
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  mealName: text("meal_name").notNull(), // Ex: Café da manhã
  items: jsonb("items"), // [{food: 'Frango', protein: 30, carbs: 0, fat: 5, qty: 100}]
  isCompleted: boolean("is_completed").default(false),
  notes: text("notes"),
});

// 5. Biometria e Saúde
export const healthStats = pgTable("health_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type"), // 'weight', 'water', 'sleep_hours', 'waist_cm', 'arm_cm', 'photo_url'
  value: text("value"), // Alterado para text para suportar URLs e valores
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// 6. Tabela de Plano de Dieta (Metas por refeição)
export const dietPlan = pgTable("diet_plan", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mealName: text("meal_name").notNull(), // Café, Lanche, Almoço, etc.
  scheduledTime: text("scheduled_time"), // "08:00", "10:00", "12:00", etc.
  targetProtein: integer("target_protein").default(0),
  targetCarbs: integer("target_carbs").default(0),
  targetFat: integer("target_fat").default(0),
  targetCalories: integer("target_calories").default(0),
  suggestions: text("suggestions"), // Ex: "Pão Integral ou Cuscuz"
  items: jsonb("items"), // [{food: 'Frango', protein: 30, carbs: 0, fat: 5, qty: 100}]
  substitutions: jsonb("substitutions"), // [{item: "Cuscuz", canReplace: "Pão integral", protein: 4, carbs: 23}]
  order: integer("order").default(0),
});

// 7. Tabela de Alimentos (Carga Local / TACO)
export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 256 }).notNull(),
  grupo: varchar("grupo", { length: 128 }),
  kcal: integer("kcal").notNull(),
  prot: decimal("prot", { precision: 6, scale: 2 }).notNull(),
  carb: decimal("carb", { precision: 6, scale: 2 }).notNull(),
  gord: decimal("gord", { precision: 6, scale: 2 }).notNull(),
  porcao: varchar("porcao", { length: 32 }).default("100g"),
  userId: varchar("user_id").notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.nome),
}));
