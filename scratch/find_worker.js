const { Client } = require('pg');
const { SignJWT } = require('jose');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dbClient = new Client({
  connectionString: 'postgresql://postgres:Volo%401721%23%24@db.ruavhqfttentcjtmnlct.supabase.co:6543/postgres?sslmode=require'
});

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'placeholder_session_secret_min_32_chars_long'
);

async function generateToken(role, userId, firebaseUid) {
  const token = await new SignJWT({
    firebase_uid: firebaseUid,
    role: role,
    user_id: userId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
  return token;
}

async function main() {
  await dbClient.connect();
  
  // Find a worker user
  const userRes = await dbClient.query(`
    SELECT u.id, u.firebase_uid, u.role, u.full_name, w.kyc_status, w.status
    FROM users u
    LEFT JOIN workers w ON w.id = u.id
    WHERE u.role = 'worker'
    LIMIT 1
  `);
  
  if (userRes.rows.length === 0) {
    console.log('No worker found in database.');
    await dbClient.end();
    return;
  }
  
  const worker = userRes.rows[0];
  console.log('Found worker:', worker);
  
  const token = await generateToken('worker', worker.id, worker.firebase_uid);
  console.log('Generated token for worker:', token);
  
  await dbClient.end();
}

main().catch(console.error);
