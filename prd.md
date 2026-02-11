# PRD - MyFit.ai

## 1. VISÃO DO PRODUTO
O MyFit.ai é um ecossistema de saúde inteligente (PWA) focado em performance pessoal. Ele une a flexibilidade de treinos avançados (ABCD), controle nutricional de alta precisão com histórico diário e monitoramento biométrico holístico, tudo centralizado para futura análise preditiva via Gemini AI.

## 2. OBJETIVOS DE NEGÓCIO
- **Centralização:** Eliminar a necessidade de múltiplos apps (um para treino, outro para dieta).
- **Precisão de Sync:** Garantir zero duplicatas entre dispositivos usando arquitetura Pull-First no Neon Postgres.
- **Frictionless UX:** Registro de água e checks de refeição rápidos, inclusive via Smartwatch.

## 3. PERSONAS
### O Otimizador de Performance
- Usuário que muda divisões de treino (A até ABCD) conforme o ciclo.
- Precisa registrar peso, repetições e notas de refeição em segundos entre as séries.
- Monitora água de forma incremental e quer ver o progresso visual de macros (Alvo vs. Realizado).

## 4. FUNCIONALIDADES DETALHADAS

### 4.1 Motor de Treino Dinâmico
- **Divisões Flexíveis:** Configuração de rotinas A, B, C, D.
- **Registro de Séries:** Input de Carga + Repetições + RPE (opcional).
- **Timer de Descanso:** Cronômetro automático inter-séries com alerta sonoro/vibratório.
- **Catálogo Inteligente:** Consumo de APIs de exercícios + criação de exercícios customizados (com proteção UNIQUE no banco).

### 4.2 Nutrição 360°
- **Plano de Refeições:** Cadastro de refeições fixas (Café, Lanches, Jantar).
- **Base de Alimentos:** Integração com API nutricional para cálculo automático de macros.
- **Histórico e Alterações:** Capacidade de alterar alimentos consumidos "naquele dia" sem afetar o plano base, mantendo o histórico de consumo real.
- **Visualização:** Gráficos diários de Proteína, Carbo, Gordura e Calorias (Planejado vs. Realizado).

### 4.3 Logs de Saúde & Biometria
- **Água:** Registro incremental rápido (estilo TickTick).
- **Métricas:** Peso, Medidas Corporais e Monitoramento de Sono.
- **Progresso Visual:** Galeria de fotos de evolução por data.

### 4.4 Integração Smartwatch (PWA)
- **Actionable Notifications:** Receber lembretes de refeição e água e dar "Check" diretamente no relógio via notificações do sistema.

## 5. REQUISITOS NÃO-FUNCIONAIS
- **Offline-First:** O app deve permitir o registro do treino mesmo sem internet na academia.
- **Segurança:** Clerk para Auth + RLS no Neon Postgres.
- **Performance:** Carregamento ultra-rápido via Next.js Server Components.