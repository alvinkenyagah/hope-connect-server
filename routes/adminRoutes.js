const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware.js');
const { addCounsellor, getAllUsers } = require('../controllers/adminController');
const router = express.Router();

// All routes here must be protected and restricted to 'admin' role
router.use(protect, authorize(['admin']));

// @route   POST /api/admin/counsellor
// @desc    Admin adds a new counsellor
router.post('/counsellor', addCounsellor);

// @route   GET /api/admin/users
// @desc    Admin gets a list of all users
router.get('/users', getAllUsers);

module.exports = router;
