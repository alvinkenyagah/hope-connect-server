const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

const router = express.Router();

// Middleware: only logged-in counselors can use these routes
router.use(protect, authorize(['counselor']));

/**
 * @desc    Get victims assigned to the logged-in counselor
 * @route   GET /api/counselor/my-victims
 * @access  Private (Counselor)
 */
router.get('/my-victims', asyncHandler(async (req, res) => {
  const counselorId = req.user.id;

  const victims = await User.find({ assignedCounselor: counselorId })
    .select('name email assignedCounselor createdAt lastLogin')
    .sort({ createdAt: -1 });

  res.status(200).json(victims);
}));

module.exports = router;
