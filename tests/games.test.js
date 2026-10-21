const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getTestServer, closeTestServer } = require('./setup');

describe('Catálogo y Búsqueda de Videojuegos (HU-03)', () => {
    let baseUrl = '';

    before(async () => {
        const testServer = await getTestServer();
        baseUrl = testServer.baseUrl;
    });

    after(() => {
        closeTestServer();
    });

    test('GET /api/games debe devolver el catálogo inicial de 18 videojuegos', async () => {
        const res = await fetch(`${baseUrl}/api/games`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(Array.isArray(data.data));
        assert.ok(data.count >= 18, 'Debe contener al menos los 18 videojuegos iniciales');
    });

    test('GET /api/games?search=Age debe filtrar títulos por búsqueda reactiva', async () => {
        const res = await fetch(`${baseUrl}/api/games?search=Age`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.data.length > 0);
        assert.ok(data.data.some(g => g.title.includes('Age of Empires')));
    });

    test('GET /api/games?genre=Estrategia debe filtrar títulos por género', async () => {
        const res = await fetch(`${baseUrl}/api/games?genre=Estrategia`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.data.every(g => g.genre === 'Estrategia'));
    });

    test('GET /api/games/filters debe devolver listas de géneros y plataformas únicos', async () => {
        const res = await fetch(`${baseUrl}/api/games/filters`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(Array.isArray(data.genres));
        assert.ok(Array.isArray(data.platforms));
    });

    test('GET /api/games/:id debe devolver el detalle de un juego específico', async () => {
        const res = await fetch(`${baseUrl}/api/games/1`);
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.id, 1);
        assert.ok(data.data.title);
    });
});
