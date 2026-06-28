const { Client } = require('pg');

const hosts = [
  'gcp-0-us-central1.pooler.supabase.com',
  'gcp-0-europe-west3.pooler.supabase.com',
  'gcp-0-asia-southeast1.pooler.supabase.com',
  'gcp-0-asia-northeast1.pooler.supabase.com',
  'gcp-0-asia-south1.pooler.supabase.com'
];

async function testGcp() {
  for (const host of hosts) {
    console.log(`Testing host: ${host}...`);
    const client = new Client({
      connectionString: `postgresql://postgres.ruavhqfttentcjtmnlct:Volo%401721%23%24@${host}:6543/postgres`,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      console.log(`>>> SUCCESS on GCP host: ${host}!`);
      await client.end();
      break;
    } catch (err) {
      console.log(`Failed on ${host}:`, err.message);
    }
  }
}

testGcp();
