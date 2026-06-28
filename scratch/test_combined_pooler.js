const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const regions = ['ap-south-1', 'ap-southeast-1', 'us-east-1'];

async function test() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`\n--- Testing region: ${region} (${host}) ---`);
    
    // Config 1: just username postgres.ref
    console.log('Trying Config 1 (user postgres.ref)...');
    let client = new Client({
      host,
      port: 6543,
      database: 'postgres',
      user: 'postgres.ruavhqfttentcjtmnlct',
      password: 'Volo@1721#$',
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log('>>> CONFIG 1 SUCCESS!');
      await client.end();
      return;
    } catch (err) {
      console.log('Config 1 Failed:', err.message);
    }

    // Config 2: user postgres.ref + servername
    console.log('Trying Config 2 (user postgres.ref + servername)...');
    client = new Client({
      host,
      port: 6543,
      database: 'postgres',
      user: 'postgres.ruavhqfttentcjtmnlct',
      password: 'Volo@1721#$',
      ssl: {
        rejectUnauthorized: false,
        servername: 'db.ruavhqfttentcjtmnlct.supabase.co'
      }
    });
    try {
      await client.connect();
      console.log('>>> CONFIG 2 SUCCESS!');
      await client.end();
      return;
    } catch (err) {
      console.log('Config 2 Failed:', err.message);
    }
  }
}

test().catch(console.error);
