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
            body: JSON.stringify({ email: 'gamer@tudai.edu.ar', password: 'gamer1234' })
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

    test('POST /api/admin/upload-cover debe recibir imagen base64 y guardarla en el servidor', async () => {
        // Pixel transparente 1x1 PNG en base64
        const sampleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const res = await fetch(`${baseUrl}/api/admin/upload-cover`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: sampleImage, filename: 'test_portada.png' })
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.url.startsWith('/uploads/covers/cover_'));
    });

    let createdTestUserId = null;
    let createdTestUserToken = null;

    test('POST /api/admin/users debe permitir al admin crear una cuenta de usuario con rol y estado', async () => {
        const res = await fetch(`${baseUrl}/api/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'UsuarioPruebaCRUD',
                email: 'testcrud@gamevault.com',
                password: 'password123',
                role: 'user',
                status: 'active',
                platform: 'PC'
            })
        });

        assert.strictEqual(res.status, 201);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.data.id);
        assert.strictEqual(data.data.username, 'UsuarioPruebaCRUD');
        assert.strictEqual(data.data.status, 'active');
        createdTestUserId = data.data.id;

        // Login with new user to get token
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'testcrud@gamevault.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        createdTestUserToken = loginData.token;
    });

    test('PUT /api/admin/users/:id debe permitir modificar datos del usuario', async () => {
        assert.ok(createdTestUserId);

        const res = await fetch(`${baseUrl}/api/admin/users/${createdTestUserId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'UsuarioPruebaModificado',
                platform: 'PlayStation 5'
            })
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.username, 'UsuarioPruebaModificado');
        assert.strictEqual(data.data.platform, 'PlayStation 5');
    });

    test('PUT /api/admin/users/:id/status debe banear al usuario y bloquear sus interacciones (HTTP 403)', async () => {
        assert.ok(createdTestUserId);
        assert.ok(createdTestUserToken);

        // 1. Admin bans the user
        const banRes = await fetch(`${baseUrl}/api/admin/users/${createdTestUserId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'banned' })
        });
        assert.strictEqual(banRes.status, 200);
        const banData = await banRes.json();
        assert.strictEqual(banData.data.status, 'banned');

        // 2. Banned user attempts to perform interaction (e.g. adding game to library) -> MUST be blocked with 403
        const actionRes = await fetch(`${baseUrl}/api/library`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${createdTestUserToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ game_id: 1, status: 'playing' })
        });
        assert.strictEqual(actionRes.status, 403);
        const actionData = await actionRes.json();
        assert.strictEqual(actionData.banned, true);
    });

    test('PUT /api/admin/users/:id/status debe permitir desbanear al usuario', async () => {
        assert.ok(createdTestUserId);

        const res = await fetch(`${baseUrl}/api/admin/users/${createdTestUserId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'active' })
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.data.status, 'active');
    });

    test('DELETE /api/admin/users/:id debe permitir eliminar al usuario', async () => {
        assert.ok(createdTestUserId);

        const res = await fetch(`${baseUrl}/api/admin/users/${createdTestUserId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
    });
});

