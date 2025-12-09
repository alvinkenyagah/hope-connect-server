const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const assessmentController = require('../controllers/assessmentController');

// All assessment routes protected
router.use(auth);

// Victim submits assessment
router.post('/', assessmentController.submitAssessment);

// Victim views their own assessments
router.get('/', assessmentController.getAssessments);

// Counselor views a client's assessments
router.get('/user/:id', assessmentController.getAssessmentsForUser);

module.exports = router;
