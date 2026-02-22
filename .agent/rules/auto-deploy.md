---
trigger: model_decision
description: Quando aplicar melhorias a serem validadas
---

A partir de agora, o meu fluxo de validação é 100% em produção (Vercel). Eu não testo mais localmente. 

Portanto, toda vez que você finalizar a implementação de uma nova funcionalidade, refatoração ou correção de bug que eu solicitar, você DEVE seguir este fluxo automaticamente, sem me perguntar:

1. Execute um check rápido de tipagem (`npx tsc --noEmit`) ou verifique se não há erros óbvios que quebrariam o build da Vercel.
2. Faça o stage dos arquivos (`git add .`).
3. Faça o commit com uma mensagem semântica clara do que foi feito (ex: `feat: refatoracao do diario e protocolo`).
4. Faça o `git push` para o repositório.
5. Me responda apenas com o resumo do que foi feito e a frase: "🚀 Push realizado com sucesso! O deploy já está rodando na Vercel e estará disponível em 1-2 minutos."

Execute essa rotina agora mesmo para as alterações que você acabou de fazer no módulo de Refeições!
