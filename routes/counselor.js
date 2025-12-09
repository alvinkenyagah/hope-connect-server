// routes/counselor.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const User = require('../models/User');

router.use(auth);

// weekly check-in summary
router.get('/checkin-summary', async (req, res) => {
  try {
    const counselorId = req.user.id;

    // get assigned victims
    const victims = await User.find({ assignedCounselor: counselorId }).select('_id');

    if (victims.length === 0)
      return res.json({ percentage: 0, completed: 0, expected: 0 });

    const victimIds = victims.map(v => v._id);

    // get 7-day assessments
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const assessments = await Assessment.find({
      user: { $in: victimIds },
      dateTaken: { $gte: sevenDaysAgo }
    });

    const completed = assessments.length;
    const expected = victims.length * 7;
    const percentage = expected === 0 ? 0 : Math.round((completed / expected) * 100);

    res.json({ percentage, completed, expected });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load counselor check-in summary' });
  }
});

module.exports = router;
