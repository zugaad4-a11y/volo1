const https = require('https');

const projectId = 'volohome-16448';
const apiKey = 'AIzaSyApmVER8aFKsry7OpTFJj8iCBE1XedX9gQ';
const siteKey = '6Ld_ASgtAAAAAP5S1xWBhboAdhtZs0XT5dGVshQA';
const token = 'BYPASS_TOKEN_VOLO_DEV_SECRET';
const action = 'LOGIN';

// Send event directly at the root, as expected by reCAPTCHA Enterprise API
const data = JSON.stringify({
  event: {
    token: token,
    siteKey: siteKey,
    expectedAction: action,
  },
});

const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

console.log('Sending request to Google API...');
console.log('URL:', url);

const req = https.request(
  url,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  },
  (res) => {
    console.log('Status Code:', res.statusCode);
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      console.log('Response Body:');
      try {
        console.log(JSON.stringify(JSON.parse(body), null, 2));
      } catch {
        console.log(body);
      }
    });
  }
);

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(data);
req.end();
