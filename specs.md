# SPECS - MyFit.ai

## STACK TÉCNICA
- **Frontend:** Next.js 15 (App Router)
- **Estilização:** Tailwind CSS + shadcn/ui
- **Banco de Dados:** Neon Postgres (PostgreSQL)
- **ORM:** Drizzle ORM
- **Autenticação:** Clerk (Single User Workflow)
- **Deploy:** Vercel (fitness.marcelotpbezerra.com.br)
- **APIs:** Edamam/Nutritionix (Dieta) e ExerciseDB (Treinos)

## SCHEMA DE DADOS (Postgres)

```typescript
// 1. Tabela de Exercícios (Proteção contra duplicatas)
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group"),
  isCustom: boolean("is_custom").default(true),
  apiId: text("api_id"), // ID caso venha da API externa
}, (t) => ({
  unqNameUser: unique().on(t.userId, t.name), // Chave composta para evitar duplicidade
}));

// 2. Tabela de Log de Treino
export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").references(() => exercises.id),
  weight: numeric("weight"),
  reps: integer("reps"),
  restTime: integer("rest_time"), // em segundos
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Tabela de Dieta (Refeições e Consumo)
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  mealName: text("meal_name").notNull(), // Ex: Café da manhã
  items: jsonb("items"), // [{food: 'Frango', protein: 30, carbs: 0, fat: 5, qty: 100}]
  isCompleted: boolean("is_completed").default(false),
  notes: text("notes"),
});

// 4. Biometria e Saúde
export const healthStats = pgTable("health_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type"), // 'weight', 'water', 'sleep_hours', 'waist_cm'
  value: numeric("value"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});