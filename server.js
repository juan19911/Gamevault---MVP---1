const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { initDatabase } = require('./config/database');
const errorMiddleware = require('./middlewares/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes Mounting (available on both /api and /api/v1 for standards compliance)
const registerRoutes = (prefix) => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/games`, gameRoutes);
    app.use(`${prefix}/library`, libraryRoutes);
    app.use(`${prefix}/sessions`, sessionRoutes);
    app.use(`${prefix}/stats`, statsRoutes);
};

registerRoutes('/api');
registerRoutes('/api/v1');

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        app: 'GameVault MVP',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Fallback to SPA index.html for unknown non-API routes
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Middleware
app.use(errorMiddleware);

// Initialize DB and start server
async function startServer() {
    try {
        console.log('[GameVault] Inicializando persistencia y catálogo...');
        await initDatabase();

        app.listen(PORT, () => {
            console.log('====================================================');
            console.log(`🎮 GameVault MVP Server ejecutándose en puerto ${PORT}`);
            console.log(`🌐 URL de acceso local: http://localhost:${PORT}`);
            console.log('====================================================');
        });
    } catch (err) {
        console.error('[GameVault] Fallo crítico al iniciar el servidor:', err);
        process.exit(1);
    }
}

startServer();

