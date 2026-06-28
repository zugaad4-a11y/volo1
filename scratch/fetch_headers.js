const https = require('https');

https.get('https://ruavhqfttentcjtmnlct.supabase.co/rest/v1/', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});
