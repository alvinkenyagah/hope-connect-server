const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // Import your User model

/**
 * @desc    Get the assigned counselor details for the logged-in victim
 * @route   GET /api/assignments/my-counselor
 * @access  Private/Victim
 */
exports.getAssignedCounselor = asyncHandler(async (req, res) => {
  const userId = req.user.id; // ID comes from the protect middleware
  const userRole = req.user.role; 

  if (userRole !== 'victim') {
    res.status(403);
    throw new Error('🚫 Access denied. Only victims can request their assigned counselor.');
  }

  // 1. Find the logged-in victim user by ID
  const victimUser = await User.findById(userId)
    // 2. Populate the assignedCounselor field.
    // Select public, relevant fields for display and booking.
    .populate('assignedCounselor', 'name email specialization qualifications'); 

  if (!victimUser) {
    res.status(404);
    throw new Error('Victim user not found.');
  }
  
  const counselor = victimUser.assignedCounselor;

  if (!counselor) {
    // Return a 200 OK status but indicate no assignment
    return res.status(200).json({ counselor: null, message: 'No counselor currently assigned. Please contact support.' });
  }

  // Successfully return the populated counselor object
  res.status(200).json({ counselor });
});

/**
 * @desc    (Optional) Logic to allow an admin/system to assign a counselor to a victim
 * @route   PUT /api/assignments/:victimId
 * @access  Private/Admin
 */
exports.assignCounselor = asyncHandler(async (req, res) => {
  const { counselorId } = req.body;
  const { victimId } = req.params;

  if (!counselorId) {
    res.status(400);
    throw new Error('Please provide a counselor ID.');
  }

  // Basic validation that the target counselor exists and has the correct role
  const counselor = await User.findById(counselorId);
  if (!counselor || counselor.role !== 'counselor') {
    res.status(404);
    throw new Error('Invalid or non-existent counselor ID.');
  }

  // Update the victim's profile
  const victim = await User.findByIdAndUpdate(
    victimId,
    { assignedCounselor: counselorId },
    { new: true, runValidators: true }
  ).populate('assignedCounselor', 'name email');

  if (!victim || victim.role !== 'victim') {
    res.status(404);
    throw new Error('Victim user not found.');
  }

  res.status(200).json({ 
    message: `Counselor ${counselor.name} assigned to ${victim.name}.`,
    victim: victim
  });
});

// Note: You would typically need a separate controller for fetching lists of victims/counselors