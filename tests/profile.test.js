const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getTestServer, closeTestServer } = require('./helpers/setup');

describe('Perfil de Usuario y Tope de 4 Favoritos (HU-02)', () => {
    let baseUrl = '';
    let authToken = '';

    before(async () => {
        const testServer = await getTestServer();
        baseUrl = testServer.baseUrl;

        // Login to get token
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'gamer@tudai.edu.ar',
                password: 'gamer123'
            })
        });
        const loginData = await loginRes.json();
        authToken = loginData.token;
    });

    after(() => {
        closeTestServer();
    });

    test('GET /api/auth/profile devuelve los datos del perfil autenticado', async () => {
        const res = await fetch(`${baseUrl}/api/auth/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.user.email, 'gamer@tudai.edu.ar');
        assert.ok(Array.isArray(data.favorites));
    });

    test('PUT /api/auth/profile actualiza bio, plataforma y avatar correctamente', async () => {
        const res = await fetch(`${baseUrl}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                bio: 'Bio actualizada en test unitario.',
                platform: 'PC',
                avatar: '/assets/avatars/pixel-cyber.svg'
            })
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.user.avatar, '/assets/avatars/pixel-cyber.svg');
        assert.strictEqual(data.user.bio, 'Bio actualizada en test unitario.');
    });

    test('PUT /api/auth/profile rechaza cambio de contraseña si la actual es incorrecta', async () => {
        const res = await fetch(`${baseUrl}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                current_password: 'pass_equivocada',
                new_password: 'nueva_pass_123'
            })
        });

        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
    });

    test('PUT /api/auth/profile rechaza cambio de contraseña menor a 6 caracteres', async () => {
        const res = await fetch(`${baseUrl}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                current_password: 'gamer123',
                new_password: '123'
            })
        });

        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
    });

    test('Regla de Negocio HU-02: Rechazar con 400 si se intentan destacar más de 4 juegos favoritos', async () => {
        // Intentar pasar 5 IDs como favoritos
        const res = await fetch(`${baseUrl}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                favoriteGameIds: [1, 2, 3, 7, 9] // 5 juegos
            })
        });

        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.message.includes('4'), 'El mensaje debe indicar el límite máximo de 4 juegos');
    });
});

