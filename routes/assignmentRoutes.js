const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware'); // Your auth middleware
const { 
  getAssignedCounselor, 
  assignCounselor 
} = require('../controllers/counselorAssignmentController'); 

const router = express.Router();

// All routes here will start with /api/assignments

// 1. GET route for the victim to fetch their assigned counselor
router.get(
  '/my-counselor', 
  protect, 
  authorize(['victim']), 
  getAssignedCounselor
);

// 2. PUT route for Admin/System to perform the assignment
// This is typically used by an admin dashboard
router.put(
  '/:victimId', 
  protect, 
  authorize(['admin']), 
  assignCounselor
);

module.exports = router;