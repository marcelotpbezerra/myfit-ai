-- Protocolo de Migração MyFit.ai (Dev -> Prod)
-- Alinhamento de userId para transição de instância Clerk

DO $$
DECLARE
    old_id TEXT := 'user_39WXSB4qfT1hHBKrFUEl3SxfRB5';
    new_id TEXT := 'user_39ncYgtGm2YhXlJC8rWMgMtf9Tf';
BEGIN
    -- 1. Configurações de Usuário
    -- Se o novo usuário já logou e criou configurações padrão, mantemos os dados antigos sobrescrevendo os novos.
    IF EXISTS (SELECT 1 FROM user_settings WHERE user_id = new_id) THEN
        DELETE FROM user_settings WHERE user_id = new_id;
    END IF;
    UPDATE user_settings SET user_id = new_id WHERE user_id = old_id;

    -- 2. Exercícios
    -- Nota: 'unqNameUser' impede duplicatas. Se houver colisão de nomes, o script pode falhar.
    -- Como a conta de produção é nova, assumimos que não há colisões.
    UPDATE exercises SET user_id = new_id WHERE user_id = old_id;

    -- 3. Logs de Treino
    UPDATE workout_logs SET user_id = new_id WHERE user_id = old_id;

    -- 4. Dieta e Refeições
    UPDATE meals SET user_id = new_id WHERE user_id = old_id;
    UPDATE diet_plan SET user_id = new_id WHERE user_id = old_id;

    -- 5. Estatísticas de Saúde
    UPDATE health_stats SET user_id = new_id WHERE user_id = old_id;

    RAISE NOTICE 'Migração concluída com sucesso de % para %', old_id, new_id;
END $$;
