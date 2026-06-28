const { SignJWT } = require('jose');

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'placeholder_session_secret_min_32_chars_long'
);

async function generateToken(role, userId) {
  const token = await new SignJWT({
    firebase_uid: 'test-firebase-uid',
    role: role,
    user_id: userId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
  return token;
}

async function run() {
  const workerToken = await generateToken('worker', '66666666-6666-6666-6666-666666666666');
  const customerToken = await generateToken('customer', '77777777-7777-7777-7777-777777777777');
  console.log('WORKER_TOKEN:', workerToken);
  console.log('CUSTOMER_TOKEN:', customerToken);
}

run().catch(console.error);
