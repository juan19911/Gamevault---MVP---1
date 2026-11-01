const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getTestServer, closeTestServer } = require('./helpers/setup');

describe('Listas Temáticas y Colecciones Personalizadas (HU-05)', () => {
    let baseUrl = '';
    let authToken = '';
    let createdListId = null;

    before(async () => {
        const testServer = await getTestServer();
        baseUrl = testServer.baseUrl;

        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'gamer@tudai.edu.ar',
                password: 'gamer1234'
            })
        });
        const loginData = await loginRes.json();
        authToken = loginData.token;
    });

    after(() => {
        closeTestServer();
    });

    test('GET /api/lists devuelve status 200 con formato JSON válido', async () => {
        const res = await fetch(`${baseUrl}/api/lists`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        assert.strictEqual(res.status, 200);
        const contentType = res.headers.get('content-type') || '';
        assert.ok(contentType.includes('application/json'), 'La respuesta debe ser estrictamente JSON');

        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(Array.isArray(data.data));
    });

    test('POST /api/lists crea una nueva lista temática', async () => {
        const payload = {
            name: `Lista Test ${Date.now()}`,
            description: 'Colección temática para testing automatizado.'
        };

        const res = await fetch(`${baseUrl}/api/lists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        assert.strictEqual(res.status, 201);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.data.id);
        createdListId = data.data.id;
    });

    test('POST /api/lists/:id/items agrega un juego a la lista', async () => {
        assert.ok(createdListId, 'Debe existir la lista creada');

        const res = await fetch(`${baseUrl}/api/lists/${createdListId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ game_id: 1 })
        });

        assert.strictEqual(res.status, 201);
        const data = await res.json();
        assert.strictEqual(data.success, true);
    });

    test('GET /api/lists/:id devuelve el detalle de la colección con sus juegos', async () => {
        assert.ok(createdListId);

        const res = await fetch(`${baseUrl}/api/lists/${createdListId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.id, createdListId);
        assert.ok(Array.isArray(data.data.games));
        assert.strictEqual(data.data.games.length, 1);
        assert.strictEqual(data.data.games[0].game_id, 1);
    });

    test('PUT /api/lists/:id permite editar el nombre y descripción de la lista (RF-09)', async () => {
        assert.ok(createdListId);

        const res = await fetch(`${baseUrl}/api/lists/${createdListId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name: 'Lista Modificada 2026',
                description: 'Descripción actualizada vía PUT endpoint.'
            })
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.name, 'Lista Modificada 2026');
        assert.strictEqual(data.data.description, 'Descripción actualizada vía PUT endpoint.');
    });

    test('DELETE /api/lists/:id elimina la lista temática', async () => {
        assert.ok(createdListId);

        const res = await fetch(`${baseUrl}/api/lists/${createdListId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
    });
});
