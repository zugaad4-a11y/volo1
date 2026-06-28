const { SignJWT } = require('jose');
const axios = require('axios');

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'placeholder_session_secret_min_32_chars_long'
);

async function createSessionCookie(payload) {
  return new SignJWT({
    firebase_uid: payload.firebase_uid,
    role: payload.role,
    user_id: payload.user_id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

async function runTests() {
  const workerPayload = {
    firebase_uid: 'test-worker-uid',
    role: 'worker',
    user_id: 'e6a88b50-3d23-455b-bf42-0f04f05786fb',
  };

  const workerToken = await createSessionCookie(workerPayload);

  // We want to trace redirects. Axios by default follows redirects.
  // We can track the redirect steps using the `request` property or interceptors.
  const instance = axios.create();
  
  instance.interceptors.request.use((config) => {
    console.log(`[Axios Request] -> ${config.url}`);
    return config;
  });

  const url = 'http://localhost:3000/api/worker/dashboard';

  console.log('Worker Token:', workerToken);

  console.log(`\n=== Tracing ${url} with WORKER cookie ===`);
  try {
    const res = await instance.get(url, {
      headers: { Cookie: `volo_session=${workerToken}` },
      maxRedirects: 10,
    });
    console.log('Final Status:', res.status);
    console.log('Final URL:', res.config.url);
  } catch (err) {
    console.log('Final Error:', err.message);
    if (err.response) {
      console.log('Error status:', err.response.status);
    }
  }

  console.log(`\n=== Tracing ${url} with INVALID cookie ===`);
  try {
    const res = await instance.get(url, {
      headers: { Cookie: `volo_session=invalid_token_here` },
      maxRedirects: 10,
    });
    console.log('Final Status:', res.status);
  } catch (err) {
    console.log('Final Error:', err.message);
  }

  console.log(`\n=== Tracing ${url} with CUSTOMER cookie ===`);
  const customerPayload = {
    firebase_uid: 'test-customer-uid',
    role: 'customer',
    user_id: 'c8a88b50-3d23-455b-bf42-0f04f05786fb',
  };
  const customerToken = await createSessionCookie(customerPayload);
  try {
    const res = await instance.get(url, {
      headers: { Cookie: `volo_session=${customerToken}` },
      maxRedirects: 10,
    });
    console.log('Final Status:', res.status);
  } catch (err) {
    console.log('Final Error:', err.message);
    if (err.response) {
      console.log('Error status:', err.response.status);
    }
  }

  console.log(`\n=== Tracing ${url} with ADMIN cookie ===`);
  const adminPayload = {
    firebase_uid: 'test-admin-uid',
    role: 'admin',
    user_id: 'ad8e7a68-b7eb-4b2a-8cfa-c529a65f9733',
  };
  const adminToken = await createSessionCookie(adminPayload);
  try {
    const res = await instance.get(url, {
      headers: { Cookie: `volo_session=${adminToken}` },
      maxRedirects: 10,
    });
    console.log('Final Status:', res.status);
  } catch (err) {
    console.log('Final Error:', err.message);
    if (err.response) {
      console.log('Error status:', err.response.status);
    }
  }

  console.log(`\n=== Tracing ${url} with NO cookie ===`);
  try {
    const res = await instance.get(url, {
      maxRedirects: 10,
    });
    console.log('Final Status:', res.status);
  } catch (err) {
    console.log('Final Error:', err.message);
    if (err.response) {
      console.log('Error status:', err.response.status);
      console.log('Error body:', err.response.data);
    }
  }
}

runTests();
