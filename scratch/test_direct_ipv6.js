const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  host: '2406:da1c:4c7:f800:a824:6858:8195:6cb2',
  port: 6543,
  database: 'postgres',
  user: 'postgres.ruavhqfttentcjtmnlct',
  password: 'Volo@1721#$',
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log('Connecting to database via IPv6...');
  await client.connect();
  console.log('Connected! Querying tables...');
  const res = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name;');
  console.log('Tables:', res.rows.map(r => r.table_name));
  await client.end();
}

main().catch(console.error);
