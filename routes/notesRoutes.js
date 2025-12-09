const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { protect } = require('../middleware/authMiddleware'); // your auth middleware

// All routes are protected
router.use(protect);

router.post('/', notesController.createNote);
router.get('/victim/:victimId', notesController.getVictimNotes);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

module.exports = router;
