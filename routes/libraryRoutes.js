const express = require('express');
const router = express.Router();
const LibraryController = require('../controllers/libraryController');
const authMiddleware = require('../middlewares/authMiddleware');

// All library routes require authentication
router.use(authMiddleware);

router.get('/', LibraryController.getLibrary);
router.post('/', LibraryController.addGame);
router.put('/:id', LibraryController.updateGame);
router.delete('/:id', LibraryController.deleteGame);

module.exports = router;

