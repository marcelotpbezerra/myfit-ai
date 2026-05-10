# core - MyFit.ai

## Purpose
Garantir a precisão técnica no monitoramento de performance física e nutricional, assegurando que a inteligência artificial (Gemini) e as APIs externas (Nutritionix/ExerciseDB) operem em harmonia com o banco de dados Neon.

## Overview
MyFit.ai é um ecossistema "Offline-First" (vía persistência local/Clerk) para gestão de treinos e dieta. Ele utiliza o Gemini como um consultor técnico para análise de dados e tradução semântica de exercícios.

## Requirements
1.  **Nutritional Ground Truth**: Os macros (Proteína, Carbo, Gordura) calculados devem sempre somar o total calórico aproximado (4-4-9). Divergências maiores que 10% devem ser sinalizadas no log de sistema.
2.  **Exercise Catalog Uniqueness**: A chave única `(userId, name)` na tabela `exercises` é inviolável. O sistema de sincronização deve usar `ON CONFLICT DO UPDATE` apenas para metadados, nunca para IDs.
3.  **Bilingual Engine (Gemini)**: Toda busca de exercício deve passar pelo middleware de tradução em `src/lib/exercise-api.ts` para garantir que termos em PT-BR encontrem correspondentes em EN no ExerciseDB.
4.  **Privacy & Ownership**: Nenhum dado de saúde (especialmente fotos de progresso) pode ser acessado fora do contexto do `userId` autenticado pelo Clerk.
5.  **Proxy Integrity**: Demonstrações de exercícios (GIFs) devem obrigatoriamente passar pelo proxy em `src/app/api/exercise-image/route.ts` para evitar quebras de cache externas.

## Arquitetura de Conhecimento
1.  **Fonte de Verdade**: `DOCUMENTACAO_SISTEMA.md` e `db/schema.ts`.
2.  **Lógica de Negócio**: Server Actions em `src/actions/`.
3.  **Motor de IA**: `src/lib/gemini.ts`.
4.  **UI/UX**: Componentes Shadcn em `src/components/ui`.

## Mapeamento de Diretórios
- `src/app/`: Rotas Next.js 15 e layouts.
- `src/db/`: Esquemas Drizzle e migrações.
- `src/lib/`: Abstrações de API e lógica de cálculo.
- `src/actions/`: Mutação de dados e lógica de servidor.
