const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');

router.get('/', GameController.getGames);
router.get('/filters', GameController.getFilters);
router.get('/:id', GameController.getGameById);
router.get('/:id/reviews', GameController.getGameReviews);

module.exports = router;

