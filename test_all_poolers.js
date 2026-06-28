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
    console.log(`Testing region: ${region} (${host})...`);
    
    const client = new Client({
      connectionString: `postgresql://postgres.ruavhqfttentcjtmnlct:Volo%401721%23%24@${host}:6543/postgres`,
      ssl: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      console.log(`>>> SUCCESS in region: ${region}!`);
      await client.end();
      break;
    } catch (err) {
      console.log(`Failed in region ${region}:`, err.message);
    }
  }
}

testRegions();
