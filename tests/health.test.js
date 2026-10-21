const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getTestServer, closeTestServer } = require('./setup');

describe('API Health Check Endpoint', () => {
    let baseUrl = '';

    before(async () => {
        const testServer = await getTestServer();
        baseUrl = testServer.baseUrl;
    });

    after(() => {
        closeTestServer();
    });

    test('GET /api/health debe responder 200 con status UP', async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.strictEqual(data.status, 'UP');
        assert.strictEqual(data.app, 'GameVault MVP');
        assert.ok(data.timestamp);
    });

    test('GET ruta API inexistente debe responder 404 JSON (no HTML)', async () => {
        const res = await fetch(`${baseUrl}/api/ruta-que-no-existe-12345`);
        assert.strictEqual(res.status, 404);

        const contentType = res.headers.get('content-type') || '';
        assert.ok(contentType.includes('application/json'));

        const data = await res.json();
        assert.strictEqual(data.success, false);
    });
});

