const express = require('express');
const router = express.Router();
const StatsController = require('../controllers/statsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/dashboard', StatsController.getDashboard);
router.get('/random', StatsController.getRandomGame);
router.get('/recommendations', StatsController.getRecommendations);

module.exports = router;

