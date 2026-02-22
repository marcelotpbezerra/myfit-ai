CREATE TABLE "biometrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"weight" numeric(5, 2),
	"body_fat" numeric(5, 2),
	"muscle_mass" numeric(5, 2),
	"visceral_fat" integer,
	"water_percentage" numeric(5, 2),
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diet_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"meal_name" text NOT NULL,
	"scheduled_time" text,
	"target_protein" integer DEFAULT 0,
	"target_carbs" integer DEFAULT 0,
	"target_fat" integer DEFAULT 0,
	"target_calories" integer DEFAULT 0,
	"suggestions" text,
	"items" jsonb DEFAULT '[]'::jsonb,
	"substitutions" jsonb DEFAULT '[]'::jsonb,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text,
	"split" text,
	"is_custom" boolean DEFAULT true,
	"api_id" text,
	"equipment" text,
	"gif_url" text,
	"target_sets" integer DEFAULT 3,
	"target_reps" integer DEFAULT 12,
	"target_weight" numeric DEFAULT '0',
	"target_rest_time" integer DEFAULT 60,
	"order" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "exercises_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(256) NOT NULL,
	"grupo" varchar(128),
	"kcal" integer NOT NULL,
	"prot" numeric(6, 2) NOT NULL,
	"carb" numeric(6, 2) NOT NULL,
	"gord" numeric(6, 2) NOT NULL,
	"porcao" varchar(32) DEFAULT '100g',
	"user_id" varchar NOT NULL,
	CONSTRAINT "foods_user_id_nome_unique" UNIQUE("user_id","nome")
);
--> statement-breakpoint
CREATE TABLE "health_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text,
	"value" text,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"meal_name" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb,
	"is_completed" boolean DEFAULT false,
	"notes" text,
	CONSTRAINT "meals_user_id_date_meal_name_unique" UNIQUE("user_id","date","meal_name")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"workout_split" text DEFAULT 'AB',
	"rest_time_default" integer DEFAULT 60,
	"water_goal" integer DEFAULT 3000,
	"ai_context" text,
	"biometric_enabled" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workout_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" integer,
	"weight" numeric,
	"reps" integer,
	"rest_time" integer,
	"notes" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;