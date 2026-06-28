process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require'
});

async function main() {
  await client.connect();
  
  console.log('Querying user_devices...');
  const res = await client.query(`
    SELECT ud.*, u.full_name 
    FROM user_devices ud
    LEFT JOIN users u ON ud.user_id = u.id;
  `);
  console.log('Registered Devices:', JSON.stringify(res.rows, null, 2));
  
  await client.end();
}

main().catch(console.error);
