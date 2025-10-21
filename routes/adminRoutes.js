const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware.js');
const router = express.Router();
const { addCounsellor, getAllUsers, assignCounselor } = require('../controllers/adminController');

// All routes here must be protected and restricted to 'admin' role
router.use(protect, authorize(['admin']));

// @route   POST /api/admin/counsellor
// @desc    Admin adds a new counsellor
router.post('/counsellor', addCounsellor);

// @route   GET /api/admin/users
// @desc    Admin gets a list of all users
router.get('/users', getAllUsers);
router.post('/assign-counselor', assignCounselor);
module.exports = router;








