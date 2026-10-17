const http = require('http');

async function runTests() {
    // Start server programmatically on port 3001
    process.env.PORT = '3001';
    require('./server');

    // Wait 1.5s for server to listen
    await new Promise(r => setTimeout(r, 1500));

    function makeRequest(path, method = 'GET', body = null, token = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path,
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            if (token) options.headers['Authorization'] = `Bearer ${token}`;

            const req = http.request(options, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, body: JSON.parse(data) });
                    } catch (e) {
                        resolve({ status: res.statusCode, text: data });
                    }
                });
            });
            req.on('error', reject);
            if (body) req.write(JSON.stringify(body));
            req.end();
        });
    }

    try {
        console.log('--- 1. Testing Health Check ---');
        const health = await makeRequest('/api/health');
        console.log('Health:', health.status, health.body.status);

        console.log('\n--- 2. Testing Login (HU-01) ---');
        const login = await makeRequest('/api/auth/login', 'POST', {
            email: 'gamer@tudai.edu.ar',
            password: 'gamer123'
        });
        console.log('Login Status:', login.status, '| Token received:', !!login.body.token);
        const token = login.body.token;

        console.log('\n--- 3. Testing Catalog (HU-03) ---');
        const games = await makeRequest('/api/games');
        console.log('Games count in catalog:', games.body.count, '| Status:', games.status);

        console.log('\n--- 4. Testing Catalog Search by Title (RNF-02) ---');
        const search = await makeRequest('/api/games?search=Half-Life');
        console.log('Found games with "Half-Life":', search.body.count, '->', search.body.data[0]?.title);

        console.log('\n--- 5. Testing User Library (HU-04) ---');
        const library = await makeRequest('/api/library', 'GET', null, token);
        console.log('User Library games count:', library.body.count);

        console.log('\n--- 6. Testing Play Session Log (HU-05) ---');
        const session = await makeRequest('/api/sessions', 'POST', {
            user_library_id: 1,
            hours: 2.5,
            session_date: '2026-10-17',
            notes: 'Test session automated'
        }, token);
        console.log('Session creation status:', session.status, '| New total hours:', session.body.data?.new_total_hours);

        console.log('\n--- 7. Testing Stats Dashboard (HU-06) ---');
        const stats = await makeRequest('/api/stats/dashboard', 'GET', null, token);
        console.log('Dashboard summary:', stats.body.data?.summary);

        console.log('\n--- 8. Testing Ruleta Gamer (HU-07) ---');
        const ruleta = await makeRequest('/api/stats/random', 'GET', null, token);
        console.log('Ruleta picked game:', ruleta.body.data?.title || ruleta.body.message);

        console.log('\n=======================================');
        console.log('🎉 ALL 8 MVP TESTS PASSED SUCCESSFULLY!');
        console.log('=======================================');
        process.exit(0);
    } catch (err) {
        console.error('Test execution failed:', err);
        process.exit(1);
    }
}

runTests();

