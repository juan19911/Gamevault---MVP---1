const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getTestServer, closeTestServer } = require('./helpers/setup');

describe('Panel de Administración y Control de Acceso por Roles (RBAC)', () => {
    let baseUrl = '';
    let adminToken = '';
    let userToken = '';
    let createdGameId = null;

    before(async () => {
        const testServer = await getTestServer();
        baseUrl = testServer.baseUrl;

        // Login Admin
        const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@gamevault.com', password: 'admin1234' })
        });
        const adminData = await adminRes.json();
        adminToken = adminData.token;

        // Login Regular User
        const userRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'gamer@tudai.edu.ar', password: 'gamer123' })
        });
        const userData = await userRes.json();
        userToken = userData.token;
    });

    after(() => {
        closeTestServer();
    });

    test('POST /api/auth/login debe autenticar admin y devolver role "admin"', () => {
        assert.ok(adminToken, 'Debe haber emitido un token JWT para admin');
    });

    test('Usuario estándar sin rol admin debe ser rechazado con HTTP 403 en /api/admin/*', async () => {
        const res = await fetch(`${baseUrl}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        assert.strictEqual(res.status, 403);
        const data = await res.json();
        assert.strictEqual(data.success, false);
    });

    test('Petición sin token a /api/admin/* debe ser rechazada con HTTP 401', async () => {
        const res = await fetch(`${baseUrl}/api/admin/users`);
        assert.strictEqual(res.status, 401);
    });

    test('GET /api/admin/users con token de admin debe responder 200 y listar usuarios', async () => {
        const res = await fetch(`${baseUrl}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(Array.isArray(data.data));
        assert.ok(data.data.length >= 2);

        const adminUser = data.data.find(u => u.email === 'admin@gamevault.com');
        assert.ok(adminUser);
        assert.strictEqual(adminUser.role, 'admin');
    });

    test('GET /api/admin/stats debe devolver contadores globales del sistema', async () => {
        const res = await fetch(`${baseUrl}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert.strictEqual(res.status, 200);

        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(typeof data.data.total_users === 'number');
        assert.ok(typeof data.data.total_games === 'number');
    });

    test('POST /api/admin/games debe permitir al administrador crear un nuevo videojuego', async () => {
        const newGame = {
            title: 'Portal 2 (Edición Admin)',
            genre: 'Puzzles',
            platform: 'PC',
            release_year: 2011,
            developer: 'Valve',
            synopsis: 'Juego de lógica y puzles en primera persona con la pistola de portales de Aperture Science.',
            cover_url: '/assets/covers/HL2.webp'
        };

        const res = await fetch(`${baseUrl}/api/admin/games`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newGame)
        });

        assert.strictEqual(res.status, 201);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.data.id);
        assert.strictEqual(data.data.title, newGame.title);
        createdGameId = data.data.id;
    });

    test('PUT /api/admin/games/:id debe permitir modificar los datos del videojuego', async () => {
        assert.ok(createdGameId);

        const updateData = {
            title: 'Portal 2: Co-op Edition',
            developer: 'Valve Corporation'
        };

        const res = await fetch(`${baseUrl}/api/admin/games/${createdGameId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.title, updateData.title);
        assert.strictEqual(data.data.developer, updateData.developer);
    });

    test('DELETE /api/admin/games/:id debe permitir al administrador eliminar el videojuego', async () => {
        assert.ok(createdGameId);

        const res = await fetch(`${baseUrl}/api/admin/games/${createdGameId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);

        // Verify it was deleted
        const checkRes = await fetch(`${baseUrl}/api/games/${createdGameId}`);
        assert.strictEqual(checkRes.status, 404);
    });
});
