process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require'
});

async function main() {
  await client.connect();
  
  const categories = await client.query(`
    SELECT id, name, is_active FROM service_categories;
  `);
  console.log('Categories in DB:');
  console.log(categories.rows);
  
  const items = await client.query(`
    SELECT si.id, si.name, sc.name as category_name, si.is_active
    FROM service_items si
    JOIN service_categories sc ON si.category_id = sc.id;
  `);
  console.log('Service Items in DB:');
  console.log(items.rows);
  
  await client.end();
}

main().catch(console.error);
