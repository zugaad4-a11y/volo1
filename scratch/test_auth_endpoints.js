const http = require('http');

function postJSON(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: JSON.parse(body)
        });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Testing /api/auth/pre-check for existing user (+919390884905)...');
  const res1 = await postJSON('/api/auth/pre-check', { phone: '+919390884905' });
  console.log('Response Status:', res1.statusCode);
  console.log('Response Body:', res1.body);

  console.log('\nTesting /api/auth/pre-check for unregistered user (+919999999999)...');
  const res2 = await postJSON('/api/auth/pre-check', { phone: '+919999999999' });
  console.log('Response Status:', res2.statusCode);
  console.log('Response Body:', res2.body);
}

main().catch(console.error);
