const { Client } = require('pg');

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'sa-east-1',
  'me-central-1'
];

async function testRegions() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Testing region with SNI: ${region} (${host})...`);
    
    const client = new Client({
      host,
      port: 6543,
      database: 'postgres',
      user: 'postgres',
      password: 'Volo@1721#$',
      ssl: {
        rejectUnauthorized: false,
        servername: 'db.ruavhqfttentcjtmnlct.supabase.co'
      }
    });

    try {
      await client.connect();
      console.log(`>>> SUCCESS with SNI in region: ${region}!`);
      await client.end();
      break;
    } catch (err) {
      console.log(`Failed in region ${region}:`, err.message);
    }
  }
}

testRegions();
