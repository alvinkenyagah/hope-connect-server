const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware.js');
const router = express.Router();
const { 
  addCounsellor, 
  getAllUsers, 
  assignCounselor, 
  getAssignedVictims 
} = require('../controllers/adminController');

// existing routes
router.use(protect, authorize(['admin']));
router.post('/counsellor', addCounsellor);
router.get('/users', getAllUsers);
router.post('/assign-counselor', assignCounselor);

// ✅ New route for counselor dashboard
router.get('/assigned-victims/:counselorId', getAssignedVictims);

module.exports = router;









