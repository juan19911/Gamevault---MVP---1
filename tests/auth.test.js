const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getTestServer, closeTestServer } = require('./helpers/setup');

describe('Autenticación y Registro de Usuarios (HU-01)', () => {
    let baseUrl = '';

    before(async () => {
        const testServer = await getTestServer();
        baseUrl = testServer.baseUrl;
    });

    after(() => {
        closeTestServer();
    });

    test('POST /api/auth/register debe registrar un nuevo usuario exitosamente', async () => {
        const uniqueSuffix = Date.now();
        const payload = {
            username: `tester_${uniqueSuffix}`,
            email: `tester_${uniqueSuffix}@gamevault.test`,
            password: 'Password123!',
            platform: 'PC'
        };

        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        assert.strictEqual(res.status, 201);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.token, 'Debe emitir un token JWT');
        assert.strictEqual(data.user.email, payload.email);
    });

    test('POST /api/auth/login debe autenticar credenciales válidas y devolver JWT', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'gamer@tudai.edu.ar',
                password: 'gamer1234'
            })
        });

        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.token);
        assert.strictEqual(data.user.username, 'juan_luca');
    });

    test('POST /api/auth/login debe rechazar con 401 si la contraseña es errónea', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'gamer@tudai.edu.ar',
                password: 'contraseña_incorrecta'
            })
        });

        assert.strictEqual(res.status, 401);
        const data = await res.json();
        assert.strictEqual(data.success, false);
    });


    test('POST /api/auth/register debe rechazar contraseñas de menos de 8 caracteres (ej. 6 o 7 chars)', async () => {
        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `short_pass_${Date.now()}`,
                email: `short_${Date.now()}@gamevault.test`,
                password: 'pass123' // 7 caracteres
            })
        });

        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.ok(data.message.includes('8 caracteres'), 'Debe exigir al menos 8 caracteres');
    });

    test('POST /api/auth/register debe aceptar contraseña válida de exactamente 8 caracteres', async () => {
        const uniqueSuffix = Date.now();
        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `pass8_${uniqueSuffix}`,
                email: `pass8_${uniqueSuffix}@gamevault.test`,
                password: 'Abcd1234' // Exactamente 8 caracteres
            })
        });

        assert.strictEqual(res.status, 201);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.ok(data.token);
    });

    test('Rutas protegidas deben rechazar con 401 si falta el header Authorization', async () => {
        const res = await fetch(`${baseUrl}/api/auth/profile`);
        assert.strictEqual(res.status, 401);

        const data = await res.json();
        assert.strictEqual(data.success, false);
    });
});

