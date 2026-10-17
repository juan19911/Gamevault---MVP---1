const express = require('express');
const router = express.Router();
const SessionController = require('../controllers/sessionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', SessionController.createSession);
router.get('/library/:id', SessionController.getSessionsByLibraryId);
router.get('/recent', SessionController.getRecentSessions);

module.exports = router;

