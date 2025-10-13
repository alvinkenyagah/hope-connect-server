const asyncHandler = require('express-async-handler');
const Assessment = require('../models/Assessment');

/**
 * @desc Get all past assessments for the logged-in user
 * @route GET /api/assessments
 * @access Private (Victim)
 */
exports.getAssessments = asyncHandler(async (req, res) => {
    // req.user is populated by the auth middleware
    const userId = req.user.id; 

    // Find all assessments for the user, sorted by date (most recent first)
    const assessments = await Assessment.find({ user: userId })
        .select('score dateTaken') // Only return score and date for efficiency
        .sort({ dateTaken: -1 });

    res.status(200).json(assessments);
});

/**
 * @desc Submit a new self-assessment
 * @route POST /api/assessments
 * @access Private (Victim)
 */
exports.submitAssessment = asyncHandler(async (req, res) => {
    const { score, answers } = req.body;
    const userId = req.user.id;

    if (!score || !answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'Missing score or invalid answers array.' });
    }

    // --- Daily Assessment Check ---
    // Calculate the start and end of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); 
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const existingAssessment = await Assessment.findOne({
        user: userId,
        dateTaken: { $gte: startOfToday, $lte: endOfToday }
    });

    if (existingAssessment) {
        return res.status(400).json({ message: 'You have already submitted an assessment today. Please try again tomorrow.' });
    }

    // --- Save Assessment ---
    const newAssessment = await Assessment.create({
        user: userId,
        score,
        answers,
        dateTaken: Date.now(),
    });

    // We can also update the recoveryScore on the User model here if desired, 
    // but for simplicity, we'll just save the assessment.

    res.status(201).json({
        message: 'Assessment saved successfully!',
        assessmentId: newAssessment._id,
        score: newAssessment.score,
    });
});
