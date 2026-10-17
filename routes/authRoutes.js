const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);

module.exports = router;

