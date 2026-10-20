const express = require('express');
const router = express.Router();
const ListController = require('../controllers/listController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', ListController.getMyLists);
router.post('/', ListController.createList);
router.get('/:id', ListController.getListDetails);
router.delete('/:id', ListController.deleteList);
router.post('/:id/items', ListController.addGame);
router.delete('/:id/items/:gameId', ListController.removeGame);

module.exports = router;
