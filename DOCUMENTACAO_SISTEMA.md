# DOCUMENTAÇÃO DO SISTEMA - MyFit.ai

Este documento consolida o ecossistema técnico e as regras de negócio do projeto **MyFit.ai**, servindo como base de conhecimento para desenvolvedores e IAs.

---

## 1. VISÃO GERAL DO PRODUTO
**Propósito:** Um ecossistema de saúde inteligente e focado em performance pessoal, projetado para centralizar treinos, nutrição e monitoramento biométrico.
- **Público-Alvo:** Entusiastas de fitness, atletas amadores e pessoas que buscam otimização de performance com auxílio de inteligência artificial.
- **Problema Resolvido:** Elimina a fragmentação de dados entre múltiplos aplicativos de treino e dieta, oferecendo uma visão holística e análise preditiva.

## 2. REGRAS DE NEGÓCIO (PRD)
- **Motor de Treino:** Suporte a divisões flexíveis (A, B, C, D). Registro de Séries (Peso, Reps, RPE) com timer de descanso automático.
- **Nutrição 360°:** Plano de refeições fixas com cálculo automático de macros via API. Permite alterações diárias sem modificar o plano base.
- **Logs de Saúde:** Registro rápido de água (incremental), peso, medidas corporais e monitoramento de sono.
- **Offline-First:** Capacidade de registrar atividades na academia sem conexão ativa, sincronizando posteriormente.
- **Integração Smartwatch:** Notificações interativas para checks rápidos de água e refeições.

## 3. ARQUITETURA TÉCNICA
- **Framework:** Next.js 15 (App Router).
- **Linguagem:** TypeScript.
- **Autenticação:** Clerk (Padrão Single User Workflow).
- **Banco de Dados:** Neon Postgres (PostgreSQL Serverless).
- **ORM:** Drizzle ORM.
- **Estilização:** Tailwind CSS + shadcn/ui.
- **IA:** Google Gemini API (modelo oficial: `gemini-3-flash-preview`) para busca inteligente, tradução de exercícios e análise de performance.
- **Deploy:** Vercel.
- **Integrações Externas:**
  - `Nutritionix/Edamam`: Base de dados de alimentos.
  - `ExerciseDB`: Catálogo de exercícios.

## 4. MODELAGEM DE DADOS
### Tabelas Principais (Drizzle Schema)

| Tabela | Descrição | Campos Chave | Relacionamentos |
| :--- | :--- | :--- | :--- |
| `user_settings` | Configurações globais do usuário | `userId` (PK) | - |
| `exercises` | Catálogo de exercícios do usuário | `id` (PK), `userId`, `name` | Unique(`userId`, `name`) |
| `workout_logs` | Histórico de execução de treinos | `id` (PK), `exerciseId` | FK -> `exercises.id` |
| `meals` | Registro diário de consumo alimentar | `id` (PK), `userId`, `date` | JSONB em `items` |
| `diet_plan` | Plano de metas nutricionais base | `id` (PK), `userId` | - |
| `health_stats` | Logs biométricos e fotos | `id` (PK), `userId`, `type` | Suporta múltiplos tipos |

## 5. FLUXOS CRÍTICOS E LOG DE DECISÕES
- **Busca Global e Inteligente (Bilingual Engine):** Localizada em `src/lib/exercise-api.ts`. Utiliza o Gemini para traduzir e otimizar buscas de exercícios (PT-BR/EN), aplicando ranking de relevância por implementos (ex: prioritiza "cable" ou "dumbbell") para garantir que o primeiro resultado seja o mais preciso.
- **Proxy de GIFs (Estratégia V7):** Implementado em `src/app/api/exercise-image/route.ts`. Atua como um middleware de segurança e estabilidade, resolvendo problemas de expiração de links e CORS, garantindo que as demonstrações de exercícios funcionem consistentemente.
- **Motor de Treino (Gestão de Ordem):** Implementação de drag-and-drop no `WorkoutBuilder` com persistência via coluna `order` na tabela `exercises`, garantindo paridade entre o planejamento e a execução.
- **Integração Gemini AI:** Analisa os últimos 7 dias de treino e dieta para gerar insights provocativos e técnicos, seguindo o perfil de consultor especialista.
- **Estratégia de Seeding:** O sistema utiliza `seedExercises` e `seedDietPlan` em `src/actions/sync.ts` para restaurar protocolos padrão (Protocolo 2026) via `ON CONFLICT DO NOTHING`.
- **Proteção contra Duplicatas:** A tabela `exercises` possui uma chave única composta em `(user_id, name)` para garantir que o catálogo não fique poluído em sincronizações repetidas.
- **Flexibilidade Diária:** A tabela `meals` armazena o consumo real do dia, permitindo que o usuário se desvie do `diet_plan` planejado sem perder a integridade da meta base.
- **Diretriz de Design:** Utilização de `framer-motion` e `recharts` para visualização de progresso premium, seguindo a estética de alta performance.
