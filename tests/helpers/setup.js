const { app } = require('../../server');
const { initDatabase } = require('../../config/database');

let testServer = null;
let baseUrl = '';

async function getTestServer() {
    if (!testServer) {
        await initDatabase();
        await new Promise((resolve) => {
            testServer = app.listen(0, '127.0.0.1', () => {
                const port = testServer.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                testServer.unref(); // Allows Node.js test runner to exit cleanly without hanging
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
}

module.exports = {
    getTestServer,
    closeTestServer
};
