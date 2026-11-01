const fs = require('fs');
const path = require('path');

// Isolate test database from production/demo database
const testDbPath = path.resolve(__dirname, '..', '..', 'database', 'gamevault_test.db');
process.env.DB_PATH = testDbPath;

const { app } = require('../../server');
const { initDatabase, closeDatabase } = require('../../config/database');

let testServer = null;
let baseUrl = '';

function cleanupTestDbFiles() {
    for (const suffix of ['', '-wal', '-shm']) {
        const p = testDbPath + suffix;
        if (fs.existsSync(p)) {
            try { fs.unlinkSync(p); } catch (_) {}
        }
    }
}

async function getTestServer() {
    if (!testServer) {
        closeDatabase();
        cleanupTestDbFiles();
        await initDatabase();
        await new Promise((resolve) => {
            testServer = app.listen(0, '127.0.0.1', () => {
                const port = testServer.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                testServer.unref();
                resolve();
            });
        });
    }
    return { server: testServer, baseUrl };
}

function closeTestServer() {
    if (testServer) {
        try {
            testServer.close();
        } catch (_) {}
        testServer = null;
    }
    closeDatabase();
    cleanupTestDbFiles();
}

module.exports = {
    getTestServer,
    closeTestServer
};
