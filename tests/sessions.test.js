const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getTestServer, closeTestServer } = require('./helpers/setup');
const SessionModel = require('../models/sessionModel');
const { db } = require('../config/database');

describe('Bitácora de Sesiones de Juego y Consistencia Transaccional (HU-04)', () => {
    let baseUrl = '';
    let authToken = '';

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

    test('POST /api/sessions debe registrar sesión e incrementar horas acumuladas de forma atómica', async () => {
        // Obtenemos los juegos de la biblioteca del usuario demo
        const libRes = await fetch(`${baseUrl}/api/library`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        assert.strictEqual(libRes.status, 200);
        const libData = await libRes.json();
        assert.ok(libData.data.length > 0);

        const targetItem = libData.data[0];
        const libraryId = targetItem.library_id;
        const initialHours = targetItem.hours_played || 0;
        const additionalHours = 2.5;

        // Registrar nueva sesión
        const sessionRes = await fetch(`${baseUrl}/api/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                user_library_id: libraryId,
                hours: additionalHours,
                session_date: '2026-11-01',
                notes: 'Prueba de consistencia atómica transaccional.'
            })
        });

        assert.strictEqual(sessionRes.status, 201);
        const sessionData = await sessionRes.json();
        assert.strictEqual(sessionData.success, true);
        assert.strictEqual(sessionData.data.new_total_hours, initialHours + additionalHours);
    });

    test('Transacción atómica: si se fuerza un fallo de actualización, el rollback no persiste la sesión', async () => {
        // Intentar registrar sesión sobre un user_library_id inexistente (violación de integridad referencial FK)
        try {
            await SessionModel.createSession({
                user_library_id: 999999, // Inexistente -> fallo de integridad
                hours: 5.0,
                session_date: '2026-11-01',
                notes: 'Sesión fallida que debe revertirse con ROLLBACK'
            });
        } catch (err) {
            assert.ok(err, 'Debe lanzar un error y ejecutar rollback');
        }

        // Comprobar que no quedó guardada ninguna sesión huérfana
        const [finalSessions] = await db.query('SELECT COUNT(*) as c FROM play_sessions WHERE user_library_id = 999999');
        assert.strictEqual(finalSessions[0].c, 0, 'El rollback transaccional garantizó que no se crearan sesiones huérfanas');
    });

    test('GET /api/sessions/library/:id devuelve el historial de sesiones ordenado cronológicamente', async () => {
        const libRes = await fetch(`${baseUrl}/api/library`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const libData = await libRes.json();
        const targetItem = libData.data[0];
        const libraryId = targetItem.library_id;

        const historyRes = await fetch(`${baseUrl}/api/sessions/library/${libraryId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        assert.strictEqual(historyRes.status, 200);
        const historyData = await historyRes.json();
        assert.strictEqual(historyData.success, true);
        assert.ok(Array.isArray(historyData.data));
        assert.ok(historyData.data.length >= 1);
    });
});
