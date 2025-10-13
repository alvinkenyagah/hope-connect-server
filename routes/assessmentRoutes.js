const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Assuming your auth middleware is here
const assessmentController = require('../controllers/assessmentController');

// All assessment routes should be protected and require authentication
router.use(auth); 

// @route POST /api/assessments - Submit a new assessment
router.post('/', assessmentController.submitAssessment);

// @route GET /api/assessments - Get user's assessment history
router.get('/', assessmentController.getAssessments);

module.exports = router;
