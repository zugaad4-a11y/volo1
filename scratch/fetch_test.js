const workerToken = 'eyJhbGciOiJIUzI1NiJ9.eyJmaXJlYmFzZV91aWQiOiJ0ZXN0LWZpcmViYXNlLXVpZCIsInJvbGUiOiJ3b3JrZXIiLCJ1c2VyX2lkIjoiNjY2NjY2NjYtNjY2Ni02NjY2LTY2NjYtNjY2NjY2NjY2NjY2IiwiaWF0IjoxNzgxODY5NzA3LCJleHAiOjE3ODI0NzQ1MDd9.nmUSxVSx_4CjsBSsOhATN-YVKdIFNbC3E45EmRv_eyU';

async function main() {
  const url = 'http://localhost:3000/api/customer/services/e4ac8f59-ca09-49c7-9ed0-9e3a70c8c04c';
  const res = await fetch(url, {
    headers: {
      'Cookie': `volo_session=${workerToken}`
    }
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}

main().catch(console.error);
