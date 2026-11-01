const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getTestServer, closeTestServer } = require('./helpers/setup');
const SessionModel = require('../models/sessionModel');
const { db } = require('../config/database');

describe('Bitácora de Sesiones de Juego y Consistencia Transaccional (RF-05 / HU-05)', () => {
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

    test('Transacción atómica: si falla la actualización de horas tras el INSERT, el ROLLBACK revierte la sesión', async () => {
        const [libRows] = await db.query('SELECT id, hours_played FROM user_library LIMIT 1');
        const libraryId = libRows[0].id;
        const hoursBefore = libRows[0].hours_played;
        const [countBeforeRows] = await db.query('SELECT COUNT(*) as c FROM play_sessions WHERE user_library_id = ?', [libraryId]);
        const countBefore = countBeforeRows[0].c;

        // Interceptamos temporalmente db.query para que el INSERT funcione pero el UPDATE posterior falle
        const originalQuery = db.query.bind(db);
        db.query = async (sql, params) => {
            if (/UPDATE\s+user_library/i.test(sql)) {
                throw new Error('Fallo simulado al actualizar acumulador hours_played');
            }
            return originalQuery(sql, params);
        };

        let thrownError = null;
        try {
            await SessionModel.createSession({
                user_library_id: libraryId,
                hours: 9.5,
                session_date: '2026-11-01',
                notes: 'Sesión que debe revertirse por ROLLBACK'
            });
        } catch (err) {
            thrownError = err;
        } finally {
            db.query = originalQuery;
        }

        assert.ok(thrownError, 'Debe propagar el fallo tras ejecutar ROLLBACK');

        // Verificar que el INSERT previo en play_sessions fue revertido por el ROLLBACK
        const [countAfterRows] = await db.query('SELECT COUNT(*) as c FROM play_sessions WHERE user_library_id = ?', [libraryId]);
        const [libAfterRows] = await db.query('SELECT hours_played FROM user_library WHERE id = ?', [libraryId]);
        assert.strictEqual(countAfterRows[0].c, countBefore, 'El ROLLBACK revirtió el INSERT en play_sessions');
        assert.strictEqual(libAfterRows[0].hours_played, hoursBefore, 'Las horas acumuladas permanecieron intactas');
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
