const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid requiring dotenv dependency
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim().replace(/(^["']|["']$)/g, '');
        process.env[key] = value;
      }
    }
  });
}

async function verifyRecaptchaTokenMock(token, action = 'LOGIN') {
  // Bypass logic: Only allowed if ALLOW_RECAPTCHA_BYPASS is 'true' AND NODE_ENV is not production AND token matches the bypass secret
  const isBypassAllowed = process.env.ALLOW_RECAPTCHA_BYPASS === 'true';
  const isNotProduction = process.env.NODE_ENV !== 'production';
  const isBypassToken = token === 'BYPASS_TOKEN_VOLO_DEV_SECRET';

  if (isBypassAllowed && isNotProduction && isBypassToken) {
    console.warn(`[reCAPTCHA Server] WARNING: reCAPTCHA verification bypassed using developer secret token.`);
    return { success: true, score: 1.0 };
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'volohome-16448';
  const apiKey = process.env.RECAPTCHA_SERVER_API_KEY;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LcHmCktAAAAAG3Mklo2rxIpQvqi3dbFXPOs4eeb';

  if (!apiKey) {
    console.error('[reCAPTCHA Server] GCP Server API key (RECAPTCHA_SERVER_API_KEY) is not defined in environment variables.');
    return { success: false, reason: 'Server configuration error: API key missing' };
  }

  try {
    const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;
    console.log(`[reCAPTCHA Server] Sending request to REST API for token: ${token ? token.substring(0, 10) + '...' : 'undefined'}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assessment: {
          event: {
            token: token,
            siteKey: siteKey,
            expectedAction: action,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[reCAPTCHA Server] Google API error:', response.status, errorBody);
      return { success: false, reason: `reCAPTCHA API HTTP error ${response.status}` };
    }

    const data = await response.json();

    if (!data.tokenProperties?.valid) {
      const invalidReason = data.tokenProperties?.invalidReason || 'Token validation failed';
      return { success: false, reason: invalidReason };
    }

    if (data.tokenProperties.action !== action) {
      return { success: false, reason: `Action mismatch: expected "${action}", got "${data.tokenProperties.action}"` };
    }

    const score = data.riskAnalysis?.score ?? 0;
    const minRequiredScore = 0.4;
    if (score < minRequiredScore) {
      return { success: false, score, reason: `Low score threshold not met (score: ${score})` };
    }

    return { success: true, score };
  } catch (err) {
    console.error('[reCAPTCHA Server] Exception:', err);
    return { success: false, reason: err.message };
  }
}

async function runTests() {
  console.log('--- TEST 1: Bypass Path (Bypass Enabled, Correct Token, Development) ---');
  process.env.ALLOW_RECAPTCHA_BYPASS = 'true';
  process.env.NODE_ENV = 'development';
  let res = await verifyRecaptchaTokenMock('BYPASS_TOKEN_VOLO_DEV_SECRET');
  console.log('Result:', res);

  console.log('\n--- TEST 2: Bypass Path (Bypass Enabled, Wrong Token, Development) ---');
  res = await verifyRecaptchaTokenMock('wrong_token');
  console.log('Result:', res);

  console.log('\n--- TEST 3: Bypass Path (Bypass Disabled, Bypass Token, Development) ---');
  process.env.ALLOW_RECAPTCHA_BYPASS = 'false';
  res = await verifyRecaptchaTokenMock('BYPASS_TOKEN_VOLO_DEV_SECRET');
  console.log('Result:', res);

  console.log('\n--- TEST 4: Bypass Path (Bypass Enabled, Bypass Token, Production) ---');
  process.env.ALLOW_RECAPTCHA_BYPASS = 'true';
  process.env.NODE_ENV = 'production';
  res = await verifyRecaptchaTokenMock('BYPASS_TOKEN_VOLO_DEV_SECRET');
  console.log('Result:', res);
}

runTests().catch(console.error);
