const { Client } = require('pg');
require('dotenv').config({ path: '/root/conhecimento_bot/02_PROJETOS_DEV/myfit-ai/.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const res = await client.query('SELECT current_date;');
  console.log('Database connected. Current date:', res.rows[0]);
  await client.end();
}

main().catch(err => console.error(err));
