const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:8080/api/v1/';

async function testApi() {
    try {
        console.log('1. Logging in...');
        
        // We use an axios instance with a cookie jar or just manually handle cookies
        const instance = axios.create({
            baseURL: API_URL,
            withCredentials: true
        });

        // Setup manual cookie handling since node axios doesn't do it automatically
        let cookieHeader = '';
        let xsrfToken = '';

        instance.interceptors.response.use(response => {
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                const newCookies = cookies.map(c => c.split(';')[0]);
                cookieHeader = newCookies.join('; ');
                const xsrfCookie = cookies.find(c => c.startsWith('XSRF-TOKEN='));
                if (xsrfCookie) {
                    xsrfToken = xsrfCookie.split(';')[0].split('=')[1];
                    console.log('Received XSRF-TOKEN:', xsrfToken);
                }
            }
            return response;
        });

        instance.interceptors.request.use(config => {
            if (cookieHeader) {
                config.headers['Cookie'] = cookieHeader;
            }
            if (xsrfToken) {
                config.headers['X-XSRF-TOKEN'] = xsrfToken;
            }
            return config;
        });

        const loginResp = await instance.post('auth/login', {
            username: 'senior_hkw',
            password: 'password'
        });
        
        console.log('Login successful:', loginResp.data.message);

        // Make a GET request to trigger CSRF filter if needed
        await instance.get('members');
        console.log('GET members successful, got XSRF token');

        console.log('2. Attempting to register member...');
        
        const memberData = {
            nic: "200112345678",
            nameWithInitials: "A B C Test Node",
            fullName: "Test Node Member",
            fullNameSinhala: "නෝඩ් ටෙස්ට්",
            dateOfBirth: "2001-01-01",
            gender: "MALE",
            maritalStatus: "UNMARRIED",
            address: "Node JS St",
            province: "Southern",
            contactNumber: "0711111111",
            ageCategory: "ADULT",
            isMember: true,
            registeredBranchId: 1
        };

        const createResp = await instance.post('members', memberData);
        console.log('Registration successful! ID:', createResp.data.memberId);
        
    } catch (err) {
        console.error('API Error:');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

testApi();
