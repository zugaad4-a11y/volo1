const apiKey = 'AIzaSyApmVER8aFKsry7OpTFJj8iCBE1XedX9gQ';

async function main() {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${apiKey}`;
  console.log('Sending direct test POST request to:', url);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'http://localhost:3000/'
    },
    body: JSON.stringify({
      phoneNumber: '+919999999999',
      recaptchaToken: 'dummy_token'
    })
  });
  
  console.log('Response Status:', res.status);
  const text = await res.text();
  console.log('Response Body:', text);
}

main().catch(console.error);
