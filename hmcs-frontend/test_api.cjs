async function testApi() {
    try {
        const loginRes2 = await fetch('http://localhost:8080/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'senior_hkw', password: 'password' })
        });
        const data2 = await loginRes2.json();
        const token = data2.token;

        console.log('Got token:', token.substring(0, 10) + '...');

        for (let i = 1; i <= 3; i++) {
            console.log(\nFetching for Tenant ID: ...);
            const res = await fetch('http://localhost:8080/api/v1/audit/corrections', {
                headers: { 
                    'Authorization': 'Bearer ' + token,
                    'X-Tenant-ID': i.toString()
                }
            });
            
            if (res.ok) {
                const logs = await res.json();
                console.log(Success! Found  logs for tenant .);
            } else {
                console.log('Error:', res.status, res.statusText);
            }
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}
testApi();
