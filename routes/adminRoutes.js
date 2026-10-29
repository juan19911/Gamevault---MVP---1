const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const AdminController = require('../controllers/adminController');

// Todas las rutas administrativas requieren autenticación y rol 'admin'
router.use(authMiddleware);
router.use(adminMiddleware);

// Métricas globales y gestión de usuarios
router.get('/stats', AdminController.getSystemStats);
router.get('/users', AdminController.getUsers);
router.post('/users', AdminController.createUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);
router.put('/users/:id/role', AdminController.updateUserRole);
router.put('/users/:id/status', AdminController.updateUserStatus);

// Gestión integral del catálogo de videojuegos
router.post('/games', AdminController.createGame);
router.put('/games/:id', AdminController.updateGame);
router.delete('/games/:id', AdminController.deleteGame);
router.post('/upload-cover', AdminController.uploadCover);

module.exports = router;

