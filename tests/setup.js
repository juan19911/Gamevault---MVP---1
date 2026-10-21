const { app } = require('../server');
const { initDatabase } = require('../config/database');

let serverInstance = null;
let baseUrl = '';

async function getTestServer() {
    if (!serverInstance) {
        await initDatabase();
        await new Promise((resolve) => {
            serverInstance = app.listen(0, () => {
                const port = serverInstance.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    }
    return { server: serverInstance, baseUrl };
}

function closeTestServer() {
    if (serverInstance) {
        serverInstance.close();
        serverInstance = null;
    }
}

module.exports = {
    getTestServer,
    closeTestServer
};

