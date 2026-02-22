const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function seedFoods() {
  try {
    const data = JSON.parse(fs.readFileSync('./data/foods/food-seed.json', 'utf8'));
    console.log(`⏳ Iniciando injeção de ${data.length} alimentos...`);
    
    for (const f of data) {
      // Corrigido para user_id no INSERT e no ON CONFLICT
      await sql`
        INSERT INTO foods (nome, grupo, kcal, prot, carb, gord, porcao, user_id) 
        VALUES (${f.nome}, ${f.grupo}, ${f.kcal}, ${f.prot}, ${f.carb}, ${f.gord}, ${f.porcao}, 'system')
        ON CONFLICT (user_id, nome) DO NOTHING
      `;
    }
    
    console.log(`🎉 Sucesso! Tabela local de nutrição abastecida!`);
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
  }
}

seedFoods();
