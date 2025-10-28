const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware'); // Assuming this path
const { 
  createAppointment, 
  getAppointments, 
  updateAppointment 
} = require('../controllers/appointmentController');

const router = express.Router();

// All routes require authentication
router.use(protect); 

// @route POST /api/appointments
// Only victims can book appointments, but we need 'counselorId' in the body
router.post('/', authorize(['victim']), createAppointment);

// @route GET /api/appointments
// Both victims and counselors can view their appointments
router.get('/', authorize(['victim', 'counselor']), getAppointments);

// @route PUT /api/appointments/:id
// Both can update (cancel), but only counselor can mark as 'completed'
router.put('/:id', authorize(['victim', 'counselor']), updateAppointment);

module.exports = router;